-- Migration: Add subtasks to team_tasks
ALTER TABLE public.team_tasks ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;
