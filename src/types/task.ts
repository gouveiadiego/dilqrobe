
import { Database } from "@/integrations/supabase/types";

type Json = Database['public']['Tables']['tasks']['Insert']['subtasks'];

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  author?: string;
  content: string;
  created_at: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  uploaded_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  category: string | null;
  created_at?: string;
  updated_at?: string;
  subtasks: SubTask[];
  section: string;
  is_recurring: boolean;
  recurrence_count?: number | null;
  recurrence_completed?: number;
  original_due_date?: string | null;
  recurrence_type?: "weekly" | "biweekly" | "monthly" | null;
  _isRecurringInstance?: boolean;
  project_company_id?: string | null;

  // Novos campos Fase 2
  estimated_time_minutes?: number | null;
  timer_value_seconds?: number | null;
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
}

export type TaskUpdate = Omit<Partial<Task>, 'subtasks'> & {
  subtasks?: Json;
};
