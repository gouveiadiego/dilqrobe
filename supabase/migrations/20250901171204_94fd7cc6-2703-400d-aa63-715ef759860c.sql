-- Fix extension versions - update to recommended defaults
-- Note: Only update extensions that exist
DO $$
DECLARE
    ext_name text;
    ext_names text[] := ARRAY['uuid-ossp', 'pgcrypto', 'pgjwt', 'pg_stat_statements', 'pg_graphql', 'pg_jsonschema', 'wrappers', 'vault'];
BEGIN
    FOREACH ext_name IN ARRAY ext_names
    LOOP
        -- Check if extension exists and update it
        IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = ext_name) THEN
            EXECUTE format('ALTER EXTENSION %I UPDATE', ext_name);
            RAISE NOTICE 'Updated extension: %', ext_name;
        END IF;
    END LOOP;
END
$$;