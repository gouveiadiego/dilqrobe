
CREATE TABLE public.bank_balance_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  real_balance NUMERIC NOT NULL,
  system_balance NUMERIC,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, bank_account_id, snapshot_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_balance_snapshots TO authenticated;
GRANT ALL ON public.bank_balance_snapshots TO service_role;

ALTER TABLE public.bank_balance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own balance snapshots"
ON public.bank_balance_snapshots FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_bank_balance_snapshots_acc_date
  ON public.bank_balance_snapshots (bank_account_id, snapshot_date DESC);

CREATE TRIGGER trg_bank_balance_snapshots_updated
BEFORE UPDATE ON public.bank_balance_snapshots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
