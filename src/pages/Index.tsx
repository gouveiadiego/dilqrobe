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
import { Search, Menu, CheckSquare, Wallet, LayoutDashboard, LogOut, Trophy, Calendar, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryManager } from "@/components/CategoryManager";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import { Task } from "@/types/task";
import { FinanceTab } from "@/components/FinanceTab";
import { JournalsTab } from "@/components/JournalsTab";
import { HabitsTab } from "@/components/HabitsTab";
import DashboardTab from "@/components/DashboardTab";
import { ChallengesTab } from "@/components/ChallengesTab";
import { ProfileTab } from "@/components/ProfileTab";

const Index = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem("categories");
    return saved ? JSON.parse(saved) : [];
  });
  
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Task["priority"] | "all">("all");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'finance' | 'journals' | 'habits' | 'challenges' | 'profile'>('tasks');

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

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

  const addTask = (newTask: Omit<Task, "id" | "completed">) => {
    const task: Task = {
      ...newTask,
      id: crypto.randomUUID(),
      completed: false,
    };
    setTasks((prev) => [task, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const addCategory = (category: string) => {
    if (!categories.includes(category)) {
      setCategories((prev) => [...prev, category]);
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
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getFullYear() === dateFilter.getFullYear() &&
        taskDate.getMonth() === dateFilter.getMonth() &&
        taskDate.getDate() === dateFilter.getDate()
      );
    });

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
                <Button variant="ghost" className="w-full justify-start gap-3">
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

      <main className={`transition-all duration-200 bg-white ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
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
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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

                <CategoryManager categories={categories} onAddCategory={addCategory} />
                <AddTask onAdd={addTask} categories={categories} />
              </div>

              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                  />
                ))}
                {filteredTasks.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    Nenhuma tarefa encontrada
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'finance' ? (
            <FinanceTab />
          ) : activeTab === 'journals' ? (
            <JournalsTab />
          ) : activeTab === 'challenges' ? (
            <ChallengesTab />
          ) : activeTab === 'habits' ? (
            <HabitsTab />
          ) : activeTab === 'profile' ? (
            <ProfileTab />
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default Index;
