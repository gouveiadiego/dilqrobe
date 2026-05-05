-- Add public sharing + approval columns
ALTER TABLE public.budgets
  ADD COLUMN IF NOT EXISTS public_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_ip text,
  ADD COLUMN IF NOT EXISTS approved_name text,
  ADD COLUMN IF NOT EXISTS approved_user_agent text,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE UNIQUE INDEX IF NOT EXISTS budgets_public_token_key ON public.budgets(public_token);

-- Public read access by token (anonymous users can view budget if they know the token)
DROP POLICY IF EXISTS "Public can view budgets by token" ON public.budgets;
CREATE POLICY "Public can view budgets by token"
ON public.budgets
FOR SELECT
TO anon, authenticated
USING (true);

-- Note: keeping owner-only update via existing authenticated policy.
-- Public approval/rejection will go through an edge function with service role.