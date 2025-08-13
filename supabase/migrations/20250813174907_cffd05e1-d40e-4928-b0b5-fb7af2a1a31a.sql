-- Update recurrence_type constraint to include 'daily' option
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_recurrence_type_check;

ALTER TABLE public.tasks ADD CONSTRAINT tasks_recurrence_type_check 
CHECK (recurrence_type = ANY (ARRAY['daily'::text, 'weekly'::text, 'biweekly'::text, 'monthly'::text]));