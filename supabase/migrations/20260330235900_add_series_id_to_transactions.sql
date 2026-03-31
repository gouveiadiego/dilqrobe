-- Adicionar coluna 'series_id' à tabela de transações para agrupar parcelas e assinaturas (recorrências contínuas)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS series_id UUID DEFAULT NULL;

-- Criar um index para pesquisas mais rápidas por série
CREATE INDEX IF NOT EXISTS idx_transactions_series_id ON public.transactions(series_id);
