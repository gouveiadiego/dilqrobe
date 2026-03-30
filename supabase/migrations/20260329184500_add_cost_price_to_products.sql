-- Add cost_price to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price numeric(12,2) DEFAULT 0;

-- Update existing rows to have cost_price = 0 if not set (already handled by DEFAULT)
