
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task, TaskUpdate } from "@/types/task";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type TaskResponse = Database['public']['Tables']['tasks']['Row'];
type Json = Database['public']['Tables']['tasks']['Insert']['subtasks'];

export type StreakProgressType = {
  current: number;
  next: number;
  nextMilestone: number;
  visualLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
};

export const useTasks = () => {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error('Erro ao carregar tarefas');
        throw error;
      }
      
      return data.map((task: TaskResponse) => ({
        ...task,
        completed: task.completed || false,
        due_date: task.due_date || null,
        category: task.category || null,
        priority: (task.priority as Task['priority']) || 'medium',
        section: task.section || 'inbox',
        is_recurring: Boolean(task.is_recurring),
        recurrence_count: task.recurrence_count !== undefined ? task.recurrence_count : null,
        recurrence_completed: task.recurrence_completed || 0,
        subtasks: Array.isArray(task.subtasks) 
          ? (task.subtasks as any[]).map(st => ({
              id: st.id || crypto.randomUUID(),
              title: st.title || '',
              completed: st.completed || false
            }))
          : []
      })) as Task[];
    }
  });

  const addTaskMutation = useMutation({
    mutationFn: async (newTask: Omit<Task, "id" | "completed" | "user_id" | "subtasks">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Set today's date as default when no date is provided
      const taskDate = newTask.due_date || new Date().toISOString();

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: newTask.title,
          priority: newTask.priority,
          due_date: taskDate,
          category: newTask.category,
          section: newTask.section,
          is_recurring: newTask.is_recurring,
          recurrence_count: newTask.recurrence_count,
          recurrence_completed: 0,
          user_id: user.id,
          subtasks: []
        }])
        .select()
        .single();

      if (error) {
        toast.error('Erro ao adicionar tarefa');
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa adicionada com sucesso');
    }
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', id);

      if (error) {
        toast.error('Erro ao atualizar tarefa');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Erro ao deletar tarefa');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa removida com sucesso');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TaskUpdate }) => {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) {
        toast.error('Erro ao atualizar tarefa');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarefa atualizada com sucesso');
    }
  });

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const isCompleting = !task.completed;

      if (task.is_recurring && isCompleting) {
        // Se a tarefa está sendo marcada como concluída e é recorrente
        const newRecurrenceCompleted = (task.recurrence_completed || 0) + 1;
        const updates: any = { completed: false }; // Reset completion

        // Se tem um número limitado de recorrências e atingiu o limite
        if (task.recurrence_count !== null && newRecurrenceCompleted >= task.recurrence_count) {
          updates.completed = true; // Marca como concluída definitivamente
        }

        // Atualiza o contador de recorrências
        updates.recurrence_completed = newRecurrenceCompleted;
        updateTaskMutation.mutate({ id, updates });

        if (updates.completed) {
          toast.success('Todas as recorrências foram concluídas!');
        } else {
          toast.success('Tarefa concluída! Próxima recorrência disponível.');
        }
      } else {
        // Comportamento normal para tarefas não recorrentes
        toggleTaskMutation.mutate({ id, completed: !task.completed });
      }
    }
  };

  return {
    tasks,
    isLoading,
    addTask: addTaskMutation.mutate,
    toggleTask,
    deleteTask: deleteTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
  };
};
