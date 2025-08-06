-- Drop the existing function
DROP FUNCTION IF EXISTS generate_company_slug();

-- Create improved function to generate slug from company name
CREATE OR REPLACE FUNCTION generate_company_slug(company_name TEXT)
RETURNS TEXT AS $$
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
  WHILE EXISTS (SELECT 1 FROM company_share_links WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;