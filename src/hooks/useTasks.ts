import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Task, TaskUpdate } from "@/types/task";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { addDays, addMonths, addWeeks } from "date-fns";

type TaskResponse = Database['public']['Tables']['tasks']['Row'];
type Json = Database['public']['Tables']['tasks']['Insert']['subtasks'];

export type StreakProgressType = {
  current: number;
  next: number;
  nextMilestone: number;
  visualLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
};

const calculateNextDueDate = (currentDate: string, type: Task['recurrence_type']): string => {
  const date = new Date(currentDate);
  
  switch (type) {
    case 'weekly':
      return addWeeks(date, 1).toISOString();
    case 'biweekly':
      return addWeeks(date, 2).toISOString();
    case 'monthly':
      return addMonths(date, 1).toISOString();
    default:
      return addMonths(date, 1).toISOString();
  }
};

// Enhanced function to create or update a corresponding project task when a regular task is completed
const createProjectTaskFromTask = async (task: Task) => {
  if (!task.project_company_id) {
    console.log('⚠️ Task has no project_company_id, skipping project task creation');
    return;
  }
  
  console.log('🔄 Syncing project task for:', {
    taskTitle: task.title,
    companyId: task.project_company_id,
    taskId: task.id
  });
  
  try {
    // First, check if a project task already exists for this regular task (by title and company)
    const { data: existingTask, error: checkError } = await supabase
      .from('project_tasks')
      .select('id, status')
      .eq('title', task.title)
      .eq('company_id', task.project_company_id)
      .maybeSingle();
    
    if (checkError) {
      console.error('❌ Error checking for existing project task:', checkError);
      toast.error('Erro ao verificar tarefa de projeto existente.');
      throw checkError;
    }
    
    if (existingTask) {
      console.log('ℹ️ Project task already exists for this task. Updating status.');
      if (existingTask.status !== 'completed') {
        const { error: updateError } = await supabase
          .from('project_tasks')
          .update({ status: 'completed' })
          .eq('id', existingTask.id);
        
        if (updateError) {
          console.error('❌ Error updating project task status:', updateError);
          toast.error('Erro ao atualizar status da tarefa do projeto.');
          throw updateError;
        }
        toast.success('✅ Tarefa do projeto atualizada para Concluída!');
      } else {
        toast.info('Tarefa do projeto já está concluída.');
      }
      return;
    }

    // If it doesn't exist, create it.
    const { data, error } = await supabase
      .from('project_tasks')
      .insert({
        title: task.title,
        description: `Tarefa criada automaticamente ao ser concluída: ${task.title}`,
        status: 'completed',
        company_id: task.project_company_id,
        due_date: task.due_date,
        priority: task.priority
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating project task:', error);
      toast.error('Erro ao sincronizar com projeto');
      throw error;
    } else {
      console.log('✅ Project task created successfully:', {
        projectTaskId: data.id,
        title: data.title,
        companyId: data.company_id,
        status: data.status
      });
      toast.success('✅ Tarefa sincronizada com o projeto!');
      return data;
    }
  } catch (error) {
    console.error('💥 Exception in createProjectTaskFromTask:', error);
    toast.error('Erro ao sincronizar com projeto');
    throw error;
  }
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
        project_company_id: task.project_company_id || null,
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

      console.log('Adding task with project_company_id:', newTask.project_company_id);

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
          subtasks: [],
          project_company_id: newTask.project_company_id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
        toast.error('Erro ao adicionar tarefa');
        throw error;
      }

      // If task has a company, create a corresponding project task
      if (data && data.project_company_id) {
        console.log('Task has company, creating corresponding project task...');
        const { error: projectTaskError } = await supabase
          .from('project_tasks')
          .insert({
            title: data.title,
            description: `Tarefa criada automaticamente a partir da aba Execução.`,
            status: 'pending',
            company_id: data.project_company_id,
            due_date: data.due_date,
            priority: data.priority,
          });
        
        if (projectTaskError) {
          console.error('Error creating project task on task creation:', projectTaskError);
          toast.error('Erro ao sincronizar tarefa com projeto. A tarefa principal foi criada.');
        } else {
          console.log('Project task created on task creation successfully.');
          toast.success('Tarefa adicionada e sincronizada com projeto!');
        }
      } else {
        toast.success('Tarefa adicionada com sucesso');
      }

      console.log('Task added successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks-dashboard'] });
    }
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      console.log('🔄 Toggling task:', { id, completed });
      
      const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', id);

      if (error) {
        console.error('❌ Error toggling task:', error);
        toast.error('Erro ao atualizar tarefa');
        throw error;
      }
      
      console.log('✅ Task toggle successful');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      // Aggressively invalidate project tasks to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks-dashboard'] });
      console.log('🔄 Cache invalidated for tasks and project-tasks');
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
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks-dashboard'] });
      toast.success('Tarefa atualizada com sucesso');
    }
  });

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) {
      console.error('❌ Task not found:', id);
      return;
    }

    const isCompleting = !task.completed;
    console.log('🎯 Task action:', {
      taskId: id,
      taskTitle: task.title,
      isCompleting,
      isRecurring: task.is_recurring,
      hasProjectCompany: !!task.project_company_id,
      projectCompanyId: task.project_company_id
    });

    if (task.is_recurring && isCompleting) {
      const newRecurrenceCompleted = (task.recurrence_completed || 0) + 1;
      
      if (task.recurrence_count !== null && newRecurrenceCompleted >= task.recurrence_count) {
        console.log('🏁 Completing final recurrence for task:', task.title);
        
        updateTaskMutation.mutate({ 
          id, 
          updates: { 
            completed: true,
            recurrence_completed: newRecurrenceCompleted
          } 
        });
        
        // Create project task if associated with a company
        if (task.project_company_id) {
          console.log('🔗 Creating project task for completed recurring task');
          try {
            await createProjectTaskFromTask(task);
            queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['project-tasks-dashboard'] });
          } catch (error) {
            console.error('💥 Failed to create project task:', error);
          }
        }
        
        toast.success('Todas as recorrências foram concluídas!');
      } else {
        const nextDueDate = calculateNextDueDate(task.due_date!, task.recurrence_type);
        
        updateTaskMutation.mutate({
          id,
          updates: {
            completed: false,
            due_date: nextDueDate,
            recurrence_completed: newRecurrenceCompleted
          }
        });

        // Create project task if associated with a company
        if (task.project_company_id) {
          console.log('🔗 Creating project task for recurring task completion');
          try {
            await createProjectTaskFromTask(task);
            queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['project-tasks-dashboard'] });
          } catch (error) {
            console.error('💥 Failed to create project task:', error);
          }
        }

        const recurrenceTypeText = {
          weekly: 'semana',
          biweekly: 'quinzena',
          monthly: 'mês'
        }[task.recurrence_type || 'monthly'];

        toast.success(`Tarefa concluída! Próxima recorrência disponível no(a) próximo(a) ${recurrenceTypeText}.`);
      }
    } else {
      console.log('📝 Toggling regular task completion');
      toggleTaskMutation.mutate({ id, completed: !task.completed });
      
      // Create project task if completing and associated with a company
      if (isCompleting && task.project_company_id) {
        console.log('🔗 Creating project task for regular task completion');
        try {
          await createProjectTaskFromTask(task);
          queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
          queryClient.invalidateQueries({ queryKey: ['project-tasks-dashboard'] });
        } catch (error) {
          console.error('💥 Failed to create project task:', error);
        }
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
