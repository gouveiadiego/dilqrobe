-- Security fixes: Add search_path restrictions to prevent SQL injection attacks

-- Update update_task_recurrence function
CREATE OR REPLACE FUNCTION public.update_task_recurrence()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  IF NEW.is_recurring AND NEW.recurrence_completed IS NULL THEN
    NEW.recurrence_completed := 0;
  END IF;
  RETURN NEW;
END;
$function$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Update delete_journal_entry function
CREATE OR REPLACE FUNCTION public.delete_journal_entry(entry_id_param uuid, user_id_param uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Exclui a entrada e conta quantas linhas foram afetadas
  DELETE FROM public.journal_entries
  WHERE id = entry_id_param AND user_id = user_id_param
  RETURNING (1) INTO deleted_count;
  
  -- Retorna verdadeiro se pelo menos uma linha foi excluída
  RETURN deleted_count > 0;
END;
$function$;

-- Update create_work_log_entry function
CREATE OR REPLACE FUNCTION public.create_work_log_entry()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  -- Só cria entrada se a tarefa está sendo marcada como completa (não estava completa antes)
  IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
    INSERT INTO public.company_work_log (
      company_id,
      user_id,
      checklist_item_id,
      title,
      description,
      category,
      month_year
    ) VALUES (
      NEW.company_id,
      NEW.user_id,
      NEW.id,
      NEW.title,
      'Tarefa do checklist concluída: ' || NEW.title,
      NEW.category,
      to_char(now(), 'YYYY-MM')
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update update_challenge_rankings function
CREATE OR REPLACE FUNCTION public.update_challenge_rankings(challenge_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  -- First update the total_distance and total_runs for all participants
  UPDATE public.challenge_participants cp
  SET 
    total_distance = COALESCE(subquery.total_distance, 0),
    total_runs = COALESCE(subquery.total_runs, 0)
  FROM (
    SELECT 
      user_id,
      SUM(distance) as total_distance,
      COUNT(*) as total_runs
    FROM public.running_records
    WHERE challenge_id = update_challenge_rankings.challenge_id
    GROUP BY user_id
  ) as subquery
  WHERE cp.challenge_id = update_challenge_rankings.challenge_id
    AND cp.user_id = subquery.user_id;

  -- Then update the rankings based on the new totals
  WITH ranked_participants AS (
    SELECT
      cp.id,
      ROW_NUMBER() OVER (ORDER BY cp.total_distance DESC) as new_rank
    FROM public.challenge_participants cp
    WHERE cp.challenge_id = update_challenge_rankings.challenge_id
  )
  UPDATE public.challenge_participants cp
  SET ranking = rp.new_rank
  FROM ranked_participants rp
  WHERE cp.id = rp.id;
END;
$function$;

-- Update generate_company_slug function (version with company_id parameter)
CREATE OR REPLACE FUNCTION public.generate_company_slug(company_name text, company_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert company name to slug format
    base_slug := LOWER(TRIM(company_name));
    base_slug := REGEXP_REPLACE(base_slug, '[^a-z0-9\s-]', '', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');
    base_slug := TRIM(base_slug, '-');
    
    -- Limit slug length
    IF LENGTH(base_slug) > 50 THEN
        base_slug := SUBSTRING(base_slug, 1, 50);
    END IF;
    
    -- Ensure slug is not empty
    IF base_slug = '' THEN
        base_slug := 'empresa';
    END IF;
    
    final_slug := base_slug;
    
    -- Check if slug exists and append number if needed
    WHILE EXISTS (SELECT 1 FROM public.company_share_links WHERE slug = final_slug AND company_id != generate_company_slug.company_id) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$function$;

-- Update generate_company_slug function (version without company_id parameter)
CREATE OR REPLACE FUNCTION public.generate_company_slug(company_name text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert company name to slug format
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(company_name, '[áàâãä]', 'a', 'g'),
        '[éèêë]', 'e', 'g'
      ),
      '[íìîï]', 'i', 'g'
    )
  );
  
  base_slug := regexp_replace(
    regexp_replace(
      regexp_replace(base_slug, '[óòôõö]', 'o', 'g'),
      '[úùûü]', 'u', 'g'
    ),
    '[ç]', 'c', 'g'
  );
  
  -- Remove special characters and spaces, replace with hyphens
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  -- Ensure it's not empty
  IF base_slug = '' THEN
    base_slug := 'empresa';
  END IF;
  
  final_slug := base_slug;
  
  -- Check if slug already exists and increment if needed
  WHILE EXISTS (SELECT 1 FROM public.company_share_links WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$function$;

-- Update get_user_payments function
CREATE OR REPLACE FUNCTION public.get_user_payments(user_id_param uuid)
 RETURNS SETOF public.payments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.payments
  WHERE user_id = user_id_param
  ORDER BY created_at DESC;
END;
$function$;