
-- Create customers table to store Stripe customer data
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  subscription_id TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_user_id UNIQUE (user_id)
);

-- Set up RLS policies
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow users to read only their own customer data
CREATE POLICY "Users can view their own customer data"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Disallow direct writes from client
CREATE POLICY "No client inserts"
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "No client updates"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "No client deletes"
  ON public.customers
  FOR DELETE
  TO authenticated
  USING (false);
