-- Add slug column to company_share_links table
ALTER TABLE company_share_links 
ADD COLUMN slug TEXT;

-- Create unique index for slugs
CREATE UNIQUE INDEX company_share_links_slug_key ON company_share_links(slug) WHERE slug IS NOT NULL;

-- Function to generate slug from company name
CREATE OR REPLACE FUNCTION generate_company_slug(company_name TEXT, company_id UUID)
RETURNS TEXT AS $$
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
    WHILE EXISTS (SELECT 1 FROM company_share_links WHERE slug = final_slug AND company_id != generate_company_slug.company_id) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;