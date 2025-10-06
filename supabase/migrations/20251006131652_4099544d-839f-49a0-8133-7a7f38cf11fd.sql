-- Adicionar colunas para controle de parcelas fixas
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS installments_total INTEGER,
ADD COLUMN IF NOT EXISTS installment_number INTEGER;

-- Criar índice para melhorar performance de queries de parcelas
CREATE INDEX IF NOT EXISTS idx_transactions_installments 
ON public.transactions(user_id, installments_total, installment_number) 
WHERE installments_total IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.transactions.installments_total IS 'Total de parcelas planejadas para esta transação recorrente (null = infinito)';
COMMENT ON COLUMN public.transactions.installment_number IS 'Número da parcela atual (1, 2, 3...). Usado junto com installments_total';