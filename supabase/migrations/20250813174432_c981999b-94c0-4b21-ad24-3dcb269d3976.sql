-- Add original_due_date column to tasks table for recurring task functionality
ALTER TABLE public.tasks ADD COLUMN original_due_date TIMESTAMP WITH TIME ZONE;