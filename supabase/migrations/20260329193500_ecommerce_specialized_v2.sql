-- Migration to support specialized Fitness Clothing Ecommerce
-- Author: Antigravity
-- Date: 2026-03-29

-- 1. Create Suppliers table
CREATE TABLE IF NOT EXISTS public.ecommerce_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text,
  whatsapp text,
  instagram text,
  email text,
  discount_pct numeric(5,2) DEFAULT 0,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Add specialized fields to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS size text,
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.ecommerce_suppliers(id);

-- 3. Create Sales table (specialized for clothing)
CREATE TABLE IF NOT EXISTS public.ecommerce_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  date timestamp with time zone DEFAULT now(),
  client_name text,
  payment_method text,
  quantity integer NOT NULL DEFAULT 1,
  discount_pct numeric(5,2) DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Create Bonuses table
CREATE TABLE IF NOT EXISTS public.ecommerce_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  date timestamp with time zone DEFAULT now(),
  influencer_name text,
  influencer_handle text,
  quantity integer NOT NULL DEFAULT 1,
  bonus_value numeric(12,2) DEFAULT 0,
  generated_sales numeric(12,2) DEFAULT 0,
  reason text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Note: RLS policies should be added as per project patterns.
-- Assuming basic RLS for now:
ALTER TABLE public.ecommerce_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_bonuses ENABLE ROW LEVEL SECURITY;

-- Polices (Simplified for restoration)
CREATE POLICY "Users can manage their own ecommerce_suppliers" ON public.ecommerce_suppliers 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own ecommerce_sales" ON public.ecommerce_sales 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own ecommerce_bonuses" ON public.ecommerce_bonuses 
  FOR ALL USING (auth.uid() = user_id);
