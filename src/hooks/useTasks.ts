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

// Enhanced function to create or update a corresponding checklist item when a regular task is completed
const createOrUpdateChecklistItemFromTask = async (task: Task) => {
  if (!task.project_company_id) {
    console.log('⚠️ Task has no project_company_id, skipping checklist item sync');
    return;
  }
  
  console.log('🔄 Syncing checklist item for:', {
    taskTitle: task.title,
    companyId: task.project_company_id,
    taskId: task.id
  });
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated for checklist sync");

    // Get category name from category ID if needed
    let categoryName = 'geral';
    if (task.category) {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('name')
        .eq('id', task.category)
        .eq('user_id', user.id)
        .maybeSingle();
      
      categoryName = categoryData?.name || task.category;
    }

    // First, check if a checklist item already exists for this regular task (by title and company)
    const { data: existingItem, error: checkError } = await supabase
      .from('project_checklist')
      .select('id, completed')
      .eq('title', task.title)
      .eq('company_id', task.project_company_id)
      .maybeSingle();
    
    if (checkError) {
      console.error('❌ Error checking for existing checklist item:', checkError);
      toast.error('Erro ao verificar item do checklist existente.');
      throw checkError;
    }
    
    if (existingItem) {
      console.log('ℹ️ Checklist item already exists. Updating status to completed.');
      if (!existingItem.completed) {
        const { error: updateError } = await supabase
          .from('project_checklist')
          .update({ completed: true })
          .eq('id', existingItem.id);
        
        if (updateError) {
          console.error('❌ Error updating checklist item status:', updateError);
          toast.error('Erro ao atualizar status do item do checklist.');
          throw updateError;
        }
        toast.success('✅ Item do checklist do projeto marcado como Concluído!');
      } else {
        toast.info('Item do checklist do projeto já está concluído.');
      }
      return;
    }

    // If it doesn't exist, create it as completed.
    const { data, error } = await supabase
      .from('project_checklist')
      .insert({
        title: task.title,
        company_id: task.project_company_id,
        user_id: user.id,
        completed: true,
        category: categoryName,
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating checklist item:', error);
      toast.error('Erro ao sincronizar com checklist do projeto');
      throw error;
    } else {
      console.log('✅ Checklist item created successfully:', {
        checklistItemId: data.id,
        title: data.title,
        companyId: data.company_id,
        completed: data.completed
      });
      toast.success('✅ Tarefa sincronizada com o checklist do projeto!');
      return data;
    }
  } catch (error) {
    console.error('💥 Exception in createOrUpdateChecklistItemFromTask:', error);
    toast.error('Erro ao sincronizar com checklist do projeto');
    throw error;
  }
};

type AddTaskPayload = Omit<Task, "id" | "completed" | "user_id" | "subtasks"> & { projectCategory?: string };

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
    mutationFn: async (newTask: AddTaskPayload) => {
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

      // If task has a company, create a corresponding project checklist item
      if (data && data.project_company_id) {
        console.log('Task has company, creating corresponding project checklist item...');
        
        // Get the category name if projectCategory is provided (it should be the name, not ID)
        let categoryName = 'geral';
        if (newTask.projectCategory) {
          categoryName = newTask.projectCategory;
        }
        
        const { error: checklistError } = await supabase
          .from('project_checklist')
          .insert({
            title: data.title,
            company_id: data.project_company_id,
            user_id: user.id,
            completed: false, // new tasks are not completed
            category: categoryName
          });
        
        if (checklistError) {
          console.error('Error creating project checklist item on task creation:', checklistError);
          toast.error('Erro ao sincronizar tarefa com checklist do projeto. A tarefa principal foi criada.');
        } else {
          console.log('Project checklist item created on task creation successfully.');
          toast.success('Tarefa adicionada e sincronizada com checklist do projeto!');
        }
      } else {
        toast.success('Tarefa adicionada com sucesso');
      }

      console.log('Task added successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-checklist-dashboard'] });
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
      queryClient.invalidateQueries({ queryKey: ['project-checklist-dashboard'] });
      console.log('🔄 Cache invalidated for tasks and project-checklist');
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
      queryClient.invalidateQueries({ queryKey: ['project-checklist-dashboard'] });
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
          console.log('🔗 Creating checklist item for completed recurring task');
          try {
            await createOrUpdateChecklistItemFromTask(task);
            queryClient.invalidateQueries({ queryKey: ['project-checklist-dashboard'] });
          } catch (error) {
            console.error('💥 Failed to create checklist item:', error);
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
          console.log('🔗 Creating checklist item for recurring task completion');
          try {
            await createOrUpdateChecklistItemFromTask(task);
            queryClient.invalidateQueries({ queryKey: ['project-checklist-dashboard'] });
          } catch (error) {
            console.error('💥 Failed to create checklist item:', error);
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
        console.log('🔗 Creating checklist item for regular task completion');
        try {
          await createOrUpdateChecklistItemFromTask(task);
          queryClient.invalidateQueries({ queryKey: ['project-checklist-dashboard'] });
        } catch (error) {
          console.error('💥 Failed to create checklist item:', error);
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
