import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Edit,
  Trash2,
  Plus,
  FileText,
  RefreshCw
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ProjectTask = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  project_company_id: string;
  due_date?: string;
  priority?: string;
  assigned_to?: string;
  project_companies?: {
    name: string;
  };
};

export function ProjectTasks() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState<Omit<ProjectTask, 'id'>>({
    title: '',
    description: '',
    completed: false,
    project_company_id: '',
    priority: 'medium',
  });
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);

  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['project-companies'],
    queryFn: async () => {
      console.log('🏢 Fetching project companies...');
      const { data, error } = await supabase
        .from('project_companies')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Error fetching companies:', error);
        throw error;
      }
      console.log('✅ Companies loaded:', data?.length, 'companies found');
      return data;
    }
  });

  const { data: tasks = [], isLoading, refetch } = useQuery({
    queryKey: ['project-tasks'],
    queryFn: async () => {
      console.log('📋 Fetching project tasks...');

      // First, let's see what's in the tasks table for projects
      const { data: allTasks, error: allTasksError } = await supabase
        .from('tasks')
        .select('*')
        .not('project_company_id', 'is', null)
        .order('created_at', { ascending: false });

      console.log('📊 ALL project tasks in database:', allTasks);
      console.log('🔢 Total project tasks count:', allTasks?.length || 0);

      if (allTasksError) {
        console.error('❌ Error fetching all tasks:', allTasksError);
      }

      // Now fetch with JOIN
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          project_companies (
            name
          )
        `)
        .not('project_company_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching project tasks with JOIN:', error);
        throw error;
      }

      console.log('✅ Project tasks with companies loaded:', data?.length, 'tasks found');
      console.log('📝 Detailed tasks data:', data);

      // Let's also check if there are tasks without companies
      const tasksWithoutCompanies = data?.filter(task => !task.project_companies?.name);
      if (tasksWithoutCompanies && tasksWithoutCompanies.length > 0) {
        console.warn('⚠️ Tasks without company data:', tasksWithoutCompanies);
      }

      return data as ProjectTask[];
    }
  });

  const refreshTasks = () => {
    console.log('🔄 Manual refresh triggered');
    queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
    refetch();
    toast.success('Lista atualizada!');
  };

  const addTaskMutation = useMutation({
    mutationFn: async (task: Omit<ProjectTask, 'id'>) => {
      // Get the current user to satisfy tasks table RLS
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const taskToInsert = { ...task, user_id: user.id };

      const { data, error } = await supabase
        .from('tasks')
        .insert(taskToInsert as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      toast.success('Tarefa adicionada com sucesso!');
      setIsAddDialogOpen(false);
      resetNewTaskForm();
    },
    onError: (error) => {
      console.error('Erro ao adicionar tarefa:', error);
      toast.error('Erro ao adicionar tarefa');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (task: ProjectTask) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: task.title,
          description: task.description,
          completed: task.completed,
          project_company_id: task.project_company_id,
          due_date: task.due_date,
          priority: task.priority,
          assigned_to: task.assigned_to
        } as any)
        .eq('id', task.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      toast.success('Tarefa atualizada com sucesso!');
      setIsEditDialogOpen(false);
      setEditingTask(null);
    },
    onError: (error) => {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Erro ao atualizar tarefa');
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-tasks'] });
      toast.success('Tarefa removida com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover tarefa:', error);
      toast.error('Erro ao remover tarefa');
    }
  });

  const resetNewTaskForm = () => {
    setNewTask({
      title: '',
      description: '',
      completed: false,
      project_company_id: '',
      priority: 'medium',
    });
  };

  const handleAddTask = () => {
    if (!newTask.title || !newTask.project_company_id) {
      toast.error('Título e empresa são obrigatórios');
      return;
    }
    addTaskMutation.mutate(newTask);
  };

  const handleUpdateTask = () => {
    if (!editingTask || !editingTask.title || !editingTask.project_company_id) {
      toast.error('Título e empresa são obrigatórios');
      return;
    }
    updateTaskMutation.mutate(editingTask);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'low': return 'Baixa';
      case 'medium': return 'Média';
      case 'high': return 'Alta';
      default: return 'Média';
    }
  };

  const getPriorityClass = (priority?: string) => {
    switch (priority) {
      case 'low': return 'bg-green-50 text-green-700';
      case 'medium': return 'bg-blue-50 text-blue-700';
      case 'high': return 'bg-red-50 text-red-700';
      default: return 'bg-blue-50 text-blue-700';
    }
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tarefas do Projeto</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshTasks}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar ({tasks.length})
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Nova Tarefa</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="title" className="text-sm font-medium">Título</label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Título da tarefa"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="description" className="text-sm font-medium">Descrição</label>
                  <Textarea
                    id="description"
                    value={newTask.description || ''}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Descreva a tarefa"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="company" className="text-sm font-medium">Empresa</label>
                  <Select
                    value={newTask.project_company_id}
                    onValueChange={(value) => setNewTask({ ...newTask, project_company_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="status" className="text-sm font-medium">Status</label>
                  <Select
                    value={newTask.completed ? 'completed' : 'pending'}
                    onValueChange={(value: 'pending' | 'in_progress' | 'completed') =>
                      setNewTask({ ...newTask, completed: value === 'completed' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente/Em Andamento</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="priority" className="text-sm font-medium">Prioridade</label>
                  <Select
                    value={newTask.priority || 'medium'}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="dueDate" className="text-sm font-medium">Data de Entrega</label>
                  <Input
                    type="date"
                    id="dueDate"
                    value={newTask.due_date ? new Date(newTask.due_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddTask}>Adicionar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-100">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h4 className="text-lg font-medium text-gray-700 mb-1">Nenhuma tarefa encontrada</h4>
            <p className="text-gray-500 mb-4">
              Comece adicionando uma nova tarefa ao projeto ou conclua uma tarefa da aba Execução que esteja vinculada a uma empresa.
              <br />
              <span className="text-sm text-blue-600">
                💡 Dica: Tarefas da aba Execução aparecem aqui automaticamente quando concluídas e vinculadas a uma empresa.
              </span>
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Tarefa
            </Button>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-4">
              📊 Exibindo {tasks.length} tarefa{tasks.length !== 1 ? 's' : ''} encontrada{tasks.length !== 1 ? 's' : ''}
            </div>
            {tasks.map((task) => (
              <div key={task.id} className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-lg">{task.title}</h4>
                    <p className="text-sm text-gray-600">
                      Empresa: {task.project_companies?.name || '❌ Empresa não encontrada'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Dialog open={isEditDialogOpen && editingTask?.id === task.id} onOpenChange={(open) => {
                      setIsEditDialogOpen(open);
                      if (!open) setEditingTask(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600"
                          onClick={() => setEditingTask(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Editar Tarefa</DialogTitle>
                        </DialogHeader>
                        {editingTask && (
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <label htmlFor="edit-title" className="text-sm font-medium">Título</label>
                              <Input
                                id="edit-title"
                                value={editingTask.title}
                                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <label htmlFor="edit-description" className="text-sm font-medium">Descrição</label>
                              <Textarea
                                id="edit-description"
                                value={editingTask.description || ''}
                                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <label htmlFor="edit-company" className="text-sm font-medium">Empresa</label>
                              <Select
                                value={editingTask.project_company_id}
                                onValueChange={(value) => setEditingTask({ ...editingTask, project_company_id: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma empresa" />
                                </SelectTrigger>
                                <SelectContent>
                                  {companies.map((company) => (
                                    <SelectItem key={company.id} value={company.id}>
                                      {company.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <label htmlFor="edit-status" className="text-sm font-medium">Status</label>
                              <Select
                                value={editingTask.completed ? 'completed' : 'pending'}
                                onValueChange={(value: 'pending' | 'in_progress' | 'completed') =>
                                  setEditingTask({ ...editingTask, completed: value === 'completed' })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pendente</SelectItem>
                                  <SelectItem value="completed">Concluída</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <label htmlFor="edit-priority" className="text-sm font-medium">Prioridade</label>
                              <Select
                                value={editingTask.priority || 'medium'}
                                onValueChange={(value) => setEditingTask({ ...editingTask, priority: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a prioridade" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Baixa</SelectItem>
                                  <SelectItem value="medium">Média</SelectItem>
                                  <SelectItem value="high">Alta</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <label htmlFor="edit-dueDate" className="text-sm font-medium">Data de Entrega</label>
                              <Input
                                type="date"
                                id="edit-dueDate"
                                value={editingTask.due_date ? new Date(editingTask.due_date).toISOString().split('T')[0] : ''}
                                onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                              />
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                          <Button onClick={handleUpdateTask}>Salvar</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTask(task.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {task.description && (
                  <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={`text-xs px-2 py-1 rounded-full border ${task.completed
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}>
                    {task.completed ? 'Concluída' : 'Pendente'}
                  </span>
                  {task.priority && (
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityClass(task.priority)}`}>
                      {getPriorityLabel(task.priority)}
                    </span>
                  )}
                  {task.due_date && (
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700">
                      Entrega: {new Date(task.due_date).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
