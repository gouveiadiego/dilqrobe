import { useState, useEffect } from "react";
import { AddTask } from "@/components/AddTask";
import { TaskItem } from "@/components/TaskItem";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Menu, CheckSquare, Wallet, LayoutDashboard, LogOut, Trophy, Calendar, User, Settings, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryManager } from "@/components/CategoryManager";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { Task, SubTask } from "@/types/task";
import { FinanceTab } from "@/components/FinanceTab";
import { JournalsTab } from "@/components/JournalsTab";
import { HabitsTab } from "@/components/HabitsTab";
import DashboardTab from "@/components/DashboardTab";
import { ChallengesTab } from "@/components/ChallengesTab";
import { ProfileTab } from "@/components/ProfileTab";
import { SettingsTab } from "@/components/SettingsTab";
import { BudgetTab } from "@/components/BudgetTab";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Database } from "@/integrations/supabase/types";
import { format, startOfWeek, startOfMonth, isThisWeek, isThisMonth, parseISO } from "date-fns";
import { KanbanCalendar } from "@/components/KanbanCalendar";

type TaskResponse = Database['public']['Tables']['tasks']['Row'];
type Json = Database['public']['Tables']['tasks']['Insert']['subtasks'];

const Index = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Task["priority"] | "all">("all");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'finance' | 'journals' | 'habits' | 'challenges' | 'profile' | 'settings' | 'budget'>('tasks');
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [showThisWeek, setShowThisWeek] = useState(false);
  const [showThisMonth, setShowThisMonth] = useState(false);
  const [showOlder, setShowOlder] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        toast.error('Erro ao carregar categorias');
        throw error;
      }
      
      return data;
    }
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        toast.error('Erro ao adicionar categoria');
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria adicionada com sucesso');
    }
  });

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

      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          title: newTask.title,
          priority: newTask.priority,
          due_date: newTask.due_date,
          category: newTask.category,
          section: newTask.section,
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

  const addSubtaskMutation = useMutation({
    mutationFn: async ({ taskId, title }: { taskId: string; title: string }) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      const newSubtask = {
        id: crypto.randomUUID(),
        title,
        completed: false
      };

      const updatedSubtasks = [...task.subtasks, newSubtask].map(st => ({
        id: st.id,
        title: st.title,
        completed: st.completed
      })) as unknown as Json;

      const { error } = await supabase
        .from('tasks')
        .update({ subtasks: updatedSubtasks })
        .eq('id', taskId);

      if (error) {
        toast.error('Erro ao adicionar sub-tarefa');
        throw error;
      }

      return { taskId, newSubtask };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Sub-tarefa adicionada com sucesso');
    }
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async ({ taskId, subtaskId }: { taskId: string; subtaskId: string }) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      const updatedSubtasks = task.subtasks.map(st =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      ).map(st => ({
        id: st.id,
        title: st.title,
        completed: st.completed
      })) as unknown as Json;

      const { error } = await supabase
        .from('tasks')
        .update({ subtasks: updatedSubtasks })
        .eq('id', taskId);

      if (error) {
        toast.error('Erro ao atualizar sub-tarefa');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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

  const updateTaskDueDateMutation = useMutation({
    mutationFn: async ({ taskId, dueDate }: { taskId: string; dueDate: Date }) => {
      const { error } = await supabase
        .from('tasks')
        .update({ due_date: dueDate.toISOString() })
        .eq('id', taskId);

      if (error) {
        toast.error('Erro ao atualizar data da tarefa');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Data da tarefa atualizada com sucesso');
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

  const handleTaskDrop = (taskId: string, dueDate: Date) => {
    updateTaskDueDateMutation.mutate({ taskId, dueDate });
  };

  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories));
  }, [categories]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso!");
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  const addTask = (newTask: Omit<Task, "id" | "completed" | "user_id" | "subtasks">) => {
    addTaskMutation.mutate(newTask);
  };

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      toggleTaskMutation.mutate({ id, completed: !task.completed });
    }
  };

  const deleteTask = (id: string) => {
    deleteTaskMutation.mutate(id);
  };

  const addCategory = (name: string) => {
    if (!categories.some(cat => cat.name === name)) {
      addCategoryMutation.mutate(name);
    } else {
      toast.error('Esta categoria já existe');
    }
  };

  const filteredTasks = tasks
    .filter((task) => {
      if (filter === "active") return !task.completed;
      if (filter === "completed") return task.completed;
      return true;
    })
    .filter((task) =>
      task.title.toLowerCase().includes(search.toLowerCase())
    )
    .filter((task) => {
      if (categoryFilter === "all") return true;
      return task.category === categoryFilter;
    })
    .filter((task) => {
      if (priorityFilter === "all") return true;
      return task.priority === priorityFilter;
    })
    .filter((task) => {
      if (!dateFilter) return true;
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return (
        taskDate.getFullYear() === dateFilter.getFullYear() &&
        taskDate.getMonth() === dateFilter.getMonth() &&
        taskDate.getDate() === dateFilter.getDate()
      );
    })
    .filter((task) => {
      if (sectionFilter === "all") return true;
      return task.section === sectionFilter;
    });

  const sections = [
    { value: "all", label: "Todas as seções" },
    { value: "inbox", label: "Caixa de entrada" },
    { value: "monday", label: "Segunda-feira" },
    { value: "tuesday", label: "Terça-feira" },
    { value: "wednesday", label: "Quarta-feira" },
    { value: "thursday", label: "Quinta-feira" },
    { value: "friday", label: "Sexta-feira" },
    { value: "weekend", label: "Fim de semana" },
  ];

  const groupTasksByPeriod = (tasks: Task[]) => {
    const completedTasks = tasks.filter(task => task.completed);
    
    const thisWeekTasks = completedTasks.filter(task => 
      isThisWeek(parseISO(task.created_at || ''))
    );

    const thisMonthTasks = completedTasks.filter(task => 
      isThisMonth(parseISO(task.created_at || '')) && 
      !isThisWeek(parseISO(task.created_at || ''))
    );

    const olderTasks = completedTasks.filter(task => 
      !isThisMonth(parseISO(task.created_at || ''))
    );

    return {
      thisWeek: thisWeekTasks,
      thisMonth: thisMonthTasks,
      older: olderTasks
    };
  };

  const activeTasks = filteredTasks.filter(task => !task.completed);
  const groupedCompletedTasks = groupTasksByPeriod(filteredTasks);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4">
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-24 h-24 overflow-hidden">
              <img
                src="/lovable-uploads/edd4e2f7-ee31-4d6c-8b97-6b0b3771a57e.png"
                alt="DILQ ORBE"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          <nav className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400">MÓDULOS</span>
              <div className="space-y-1">
                <Button 
                  variant={activeTab === 'dashboard' ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('dashboard')}
                >
                  <LayoutDashboard size={20} />
                  Painel
                </Button>
                <Button 
                  variant={activeTab === 'tasks' ? "secondary" : "ghost"} 
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('tasks')}
                >
                  <CheckSquare size={20} />
                  Execução
                </Button>
                <Button 
                  variant={activeTab === 'finance' ? "secondary" : "ghost"} 
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('finance')}
                >
                  <Wallet size={20} />
                  Financeiro
                </Button>
                <Button 
                  variant={activeTab === 'budget' ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('budget')}
                >
                  <FileText size={20} />
                  Orçamentos
                </Button>
                <Button 
                  variant={activeTab === 'journals' ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('journals')}
                >
                  <Calendar size={20} />
                  Diários
                </Button>
                <Button 
                  variant={activeTab === 'challenges' ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('challenges')}
                >
                  <Trophy size={20} />
                  Desafios
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400">CONFIGURAÇÕES</span>
              <div className="space-y-1">
                <Button 
                  variant={activeTab === 'profile' ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('profile')}
                >
                  <User size={20} />
                  Perfil
                </Button>
                <Button 
                  variant={activeTab === 'settings' ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings size={20} />
                  Configurações
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut size={20} />
                  Sair
                </Button>
              </div>
            </div>
          </nav>
        </div>
      </aside>

      <main className={`transition-all duration-200 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <Button variant="ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>

          {activeTab === 'dashboard' ? (
            <DashboardTab />
          ) : activeTab === 'tasks' ? (
            <div className="space-y-6 bg-white rounded-lg">
              <div className="mb-8 space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Execução
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    - Tarefas dos últimos 10 dias
                  </span>
                </h2>
                
                <div className="flex gap-4 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Pesquisar..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 bg-white border-gray-200"
                    />
                  </div>

                  <Select value={filter} onValueChange={(v: typeof filter) => setFilter(v)}>
                    <SelectTrigger className="w-[180px] bg-white border-gray-200">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="active">Ativas</SelectItem>
                      <SelectItem value="completed">Concluídas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select 
                    value={categoryFilter} 
                    onValueChange={(v: string) => setCategoryFilter(v)}
                  >
                    <SelectTrigger className="w-[180px] bg-white border-gray-200">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={priorityFilter} 
                    onValueChange={(v: Task["priority"] | "all") => setPriorityFilter(v)}
                  >
                    <SelectTrigger className="w-[180px] bg-white border-gray-200">
                      <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as prioridades</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select 
                    value={sectionFilter} 
                    onValueChange={(v: string) => setSectionFilter(v)}
                  >
                    <SelectTrigger className="w-[180px] bg-white border-gray-200">
                      <SelectValue placeholder="Seção" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section) => (
                        <SelectItem key={section.value} value={section.value}>
                          {section.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={`w-[180px] justify-start text-left font-normal bg-white border-gray-200 ${
                          dateFilter ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dateFilter ? dateFilter.toLocaleDateString() : "Filtrar por data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dateFilter}
                        onSelect={setDateFilter}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {dateFilter && (
                    <Button 
                      variant="ghost" 
                      onClick={() => setDateFilter(null)}
                      className="px-2"
                    >
                      Limpar data
                    </Button>
                  )}
                </div>

                <CategoryManager 
                  categories={categories} 
                  onAddCategory={addCategory} 
                />
                <AddTask onAdd={addTask} categories={categories} sections={sections} />
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Tarefas Ativas</h3>
                  {isLoading ? (
                    <div className="text-center py-12 text-gray-500">
                      Carregando tarefas...
                    </div>
                  ) : activeTasks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      Nenhuma tarefa ativa encontrada
                    </div>
                  ) : (
                    activeTasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onDelete={deleteTask}
                        onAddSubtask={(taskId, title) => addSubtaskMutation.mutate({ taskId, title })}
                        onToggleSubtask={(taskId, subtaskId) => toggleSubtaskMutation.mutate({ taskId, subtaskId })}
                        onUpdateTask={(taskId, updates) => updateTaskMutation.mutate({ id: taskId, updates })}
                        categories={categories}
                      />
                    ))
                  )}
                </div>

                {(groupedCompletedTasks.thisWeek.length > 0 || 
                  groupedCompletedTasks.thisMonth.length > 0 || 
                  groupedCompletedTasks.older.length > 0) && (
                  <div className="space-y-6 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Tarefas Concluídas</h3>
                    
                    {/* Esta Semana */}
                    {groupedCompletedTasks.thisWeek.length > 0 && (
                      <div className="space-y-2">
                        <button
                          onClick={() => setShowThisWeek(!showThisWeek)}
                          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                        >
                          {showThisWeek ? '▼' : '▶'} Esta Semana ({groupedCompletedTasks.thisWeek.length})
                        </button>
                        {showThisWeek && (
                          <div className="space-y-2 pl-4">
                            {groupedCompletedTasks.thisWeek.map((task) => (
                              <TaskItem
                                key={task.id}
                                task={task}
                                onToggle={toggleTask}
                                onDelete={deleteTask}
                                onAddSubtask={(taskId, title) => addSubtaskMutation.mutate({ taskId, title })}
                                onToggleSubtask={(taskId, subtaskId) => toggleSubtaskMutation.mutate({ taskId, subtaskId })}
                                onUpdateTask={(taskId, updates) => updateTaskMutation.mutate({ id: taskId, updates })}
                                categories={categories}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Este Mês */}
                    {groupedCompletedTasks.thisMonth.length > 0 && (
                      <div className="space-y-2">
                        <button
                          onClick={() => setShowThisMonth(!showThisMonth)}
                          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                        >
                          {showThisMonth ? '▼' : '▶'} Este Mês ({groupedCompletedTasks.thisMonth.length})
                        </button>
                        {showThisMonth && (
                          <div className="space-y-2 pl-4">
                            {groupedCompletedTasks.thisMonth.map((task) => (
                              <TaskItem
                                key={task.id}
                                task={task}
                                onToggle={toggleTask}
                                onDelete={deleteTask}
                                onAddSubtask={(taskId, title) => addSubtaskMutation.mutate({ taskId, title })}
                                onToggleSubtask={(taskId, subtaskId) => toggleSubtaskMutation.mutate({ taskId, subtaskId })}
                                onUpdateTask={(taskId, updates) => updateTaskMutation.mutate({ id: taskId, updates })}
                                categories={categories}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mais Antigas */}
                    {groupedCompletedTasks.older.length > 0 && (
                      <div className="space-y-2">
                        <button
                          onClick={() => setShowOlder(!showOlder)}
                          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                        >
                          {showOlder ? '▼' : '▶'} Mais Antigas ({groupedCompletedTasks.older.length})
                        </button>
                        {showOlder && (
                          <div className="space-y-2 pl-4">
                            {groupedCompletedTasks.older.map((task) => (
                              <TaskItem
                                key={task.id}
                                task={task}
                                onToggle={toggleTask}
                                onDelete={deleteTask}
                                onAddSubtask={(taskId, title) => addSubtaskMutation.mutate({ taskId, title })}
                                onToggleSubtask={(taskId, subtaskId) => toggleSubtaskMutation.mutate({ taskId, subtaskId })}
                                onUpdateTask={(taskId, updates) => updateTaskMutation.mutate({ id: taskId, updates })}
                                categories={categories}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Kanban Calendar Section */}
                <div className="pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendário de Tarefas</h3>
                  <KanbanCalendar tasks={tasks} onTaskDrop={handleTaskDrop} />
                </div>
              </div>
            </div>
          ) : activeTab === 'finance' ? (
            <FinanceTab />
          ) : activeTab === 'budget' ? (
            <BudgetTab />
          ) : activeTab === 'journals' ? (
            <JournalsTab />
          ) : activeTab === 'challenges' ? (
            <ChallengesTab />
          ) : activeTab === 'habits' ? (
            <HabitsTab />
          ) : activeTab === 'profile' ? (
            <ProfileTab />
          ) : activeTab === 'settings' ? (
            <SettingsTab />
          ) : activeTab === 'dashboard' ? (
            <DashboardTab />
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default Index;
