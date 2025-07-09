-- Adicionar política RLS para permitir acesso público aos posts do Instagram via links compartilhados
CREATE POLICY "Allow public access to shared company Instagram posts" 
ON editorial_calendar_posts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM company_share_links csl
    WHERE csl.company_id = editorial_calendar_posts.company_id 
      AND csl.is_active = true
  )
);