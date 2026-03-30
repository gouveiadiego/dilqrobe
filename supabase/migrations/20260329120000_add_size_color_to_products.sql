-- Add missing columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS size text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price numeric(12,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Enable RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own products
CREATE POLICY "Users can only see their own products" 
ON public.products FOR ALL 
USING (auth.uid() = user_id);
