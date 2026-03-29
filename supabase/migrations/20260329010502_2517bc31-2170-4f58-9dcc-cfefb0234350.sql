
-- Fornecedores
CREATE TABLE public.ecommerce_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  whatsapp TEXT,
  instagram TEXT,
  email TEXT,
  website TEXT,
  delivery_time TEXT,
  payment_method TEXT,
  discount_percent NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ecommerce_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own suppliers" ON public.ecommerce_suppliers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Produtos / Estoque
CREATE TABLE public.ecommerce_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  size TEXT,
  color TEXT,
  supplier_id UUID REFERENCES public.ecommerce_suppliers(id) ON DELETE SET NULL,
  cost_price NUMERIC DEFAULT 0,
  sale_price NUMERIC DEFAULT 0,
  qty_in INTEGER DEFAULT 0,
  qty_sold INTEGER DEFAULT 0,
  qty_gifted INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ecommerce_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own products" ON public.ecommerce_products
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Vendas
CREATE TABLE public.ecommerce_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.ecommerce_products(id) ON DELETE SET NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  client_name TEXT,
  payment_method TEXT,
  quantity INTEGER DEFAULT 1,
  unit_cost NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ecommerce_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sales" ON public.ecommerce_sales
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Bonificações / Influencers
CREATE TABLE public.ecommerce_bonifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES public.ecommerce_products(id) ON DELETE SET NULL,
  bonification_date DATE NOT NULL DEFAULT CURRENT_DATE,
  client_name TEXT,
  contact_handle TEXT,
  quantity INTEGER DEFAULT 1,
  unit_cost NUMERIC DEFAULT 0,
  gift_value NUMERIC DEFAULT 0,
  sales_generated NUMERIC DEFAULT 0,
  campaign_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ecommerce_bonifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own bonifications" ON public.ecommerce_bonifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger para update_timestamp em todas as tabelas
CREATE TRIGGER update_ecommerce_suppliers_updated_at BEFORE UPDATE ON public.ecommerce_suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_ecommerce_products_updated_at BEFORE UPDATE ON public.ecommerce_products
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_ecommerce_sales_updated_at BEFORE UPDATE ON public.ecommerce_sales
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

CREATE TRIGGER update_ecommerce_bonifications_updated_at BEFORE UPDATE ON public.ecommerce_bonifications
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
