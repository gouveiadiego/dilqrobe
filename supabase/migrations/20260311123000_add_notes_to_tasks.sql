-- Add notes column to tasks table for task comments/progress tracking
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS notes text;
