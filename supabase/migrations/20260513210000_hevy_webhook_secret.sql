ALTER TABLE hevy_integrations 
ADD COLUMN IF NOT EXISTS webhook_secret UUID DEFAULT gen_random_uuid() UNIQUE;
