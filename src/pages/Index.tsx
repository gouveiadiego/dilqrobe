import { useState, useEffect } from "react";
import { AddTask } from "@/components/AddTask";
import { TaskItem } from "@/components/TaskItem";
import { Task } from "@/types/task";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Menu, Moon, User, Settings, BarChart2, BookOpen, Calendar, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

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

  const filteredTasks = tasks
    .filter((task) => {
      if (filter === "active") return !task.completed;
      if (filter === "completed") return task.completed;
      return true;
    })
    .filter((task) =>
      task.title.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-[#1A1F2C] text-white">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#221F26] transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Néctar
            </h1>
          </div>
          
          <nav className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400">MÓDULOS</span>
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <CheckSquare size={20} />
                  Execução
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Calendar size={20} />
                  Tarefas
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <BarChart2 size={20} />
                  Hábitos
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <BookOpen size={20} />
                  Biblioteca
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-400">CONFIGURAÇÕES</span>
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <User size={20} />
                  Perfil
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Settings size={20} />
                  Configurações
                </Button>
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`transition-all duration-200 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <Button variant="ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="w-10 h-10 rounded-full p-0">
                <Moon className="h-5 w-5" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-6">
            <h2 className="text-2xl font-bold">
              Execução
              <span className="text-sm font-normal text-gray-400 ml-2">
                - Tarefas dos últimos 10 dias
              </span>
            </h2>
            
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-[#2A2F3C] border-none"
                />
              </div>
              <Select value={filter} onValueChange={(v: typeof filter) => setFilter(v)}>
                <SelectTrigger className="w-[180px] bg-[#2A2F3C] border-none">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Ativas</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <AddTask onAdd={addTask} />
          </div>

          {/* Tasks List */}
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
              <div className="text-center py-12 text-gray-400">
                Nenhuma tarefa encontrada
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;