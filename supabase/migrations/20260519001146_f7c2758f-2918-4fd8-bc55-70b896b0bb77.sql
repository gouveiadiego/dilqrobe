
CREATE TABLE public.fitness_daily_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  water_ml integer NOT NULL DEFAULT 0,
  sleep_hours numeric(4,2),
  steps integer NOT NULL DEFAULT 0,
  cardio_minutes integer NOT NULL DEFAULT 0,
  mood smallint,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);

ALTER TABLE public.fitness_daily_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own daily log"
ON public.fitness_daily_log
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_fitness_daily_log_user_date ON public.fitness_daily_log (user_id, log_date DESC);

CREATE TRIGGER trg_fitness_daily_log_updated
BEFORE UPDATE ON public.fitness_daily_log
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
