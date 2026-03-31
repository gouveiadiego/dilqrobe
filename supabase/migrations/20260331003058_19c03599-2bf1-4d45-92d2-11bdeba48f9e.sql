-- Adicionar coluna para intervalo personalizado em dias
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS custom_interval_days INTEGER DEFAULT NULL;