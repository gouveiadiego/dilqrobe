
-- Adiciona campos para estimativa, timer, comentários e anexos na tabela de tarefas
ALTER TABLE public.tasks
  ADD COLUMN estimated_time_minutes INTEGER NULL,
  ADD COLUMN timer_value_seconds INTEGER NULL,
  ADD COLUMN comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN attachments JSONB NOT NULL DEFAULT '[]'::jsonb;
