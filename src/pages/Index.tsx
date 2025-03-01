
import { useState } from "react";
import { AddTask } from "@/components/AddTask";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryManager } from "@/components/CategoryManager";
import { Task } from "@/types/task";
import { FinanceTab } from "@/components/FinanceTab";
import { JournalsTab } from "@/components/JournalsTab";
import DashboardTab from "@/components/DashboardTab";
import { ChallengesTab } from "@/components/ChallengesTab";
import { ProfileTab } from "@/components/ProfileTab";
import { SettingsTab } from "@/components/SettingsTab";
import { BudgetTab } from "@/components/BudgetTab";
import { KanbanCalendar } from "@/components/KanbanCalendar";
import { TaskFilters } from "@/components/TaskFilters";
import { TaskList } from "@/components/TaskList";
import { Sidebar } from "@/components/Sidebar";
import { useTasks } from "@/hooks/useTasks";
import { useCategories } from "@/hooks/useCategories";
import { ServicesTab } from "@/components/ServicesTab";
import { WrittenProjectsTab } from "@/components/WrittenProjectsTab";
import { HabitsTab } from "@/components/HabitsTab";

type TabType = 'dashboard' | 'tasks' | 'finance' | 'habits' | 'journals' | 'challenges' | 'profile' | 'settings' | 'budget' | 'services' | 'projects';

const Index = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Task["priority"] | "all">("all");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [showThisWeek, setShowThisWeek] = useState(false);
  const [showThisMonth, setShowThisMonth] = useState(false);
  const [showOlder, setShowOlder] = useState(false);

  const {
    tasks,
    isLoading,
    addTask,
    toggleTask,
    deleteTask,
    updateTask
  } = useTasks();

  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory
  } = useCategories();

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

  const handleTaskDrop = (taskId: string, dueDate: Date) => {
    updateTask({
      id: taskId,
      updates: {
        due_date: dueDate.toISOString()
      }
    });
  };

  const sections = [{
    value: "all",
    label: "Todas as seções"
  }, {
    value: "inbox",
    label: "Caixa de entrada"
  }, {
    value: "monday",
    label: "Segunda-feira"
  }, {
    value: "tuesday",
    label: "Terça-feira"
  }, {
    value: "wednesday",
    label: "Quarta-feira"
  }, {
    value: "thursday",
    label: "Quinta-feira"
  }, {
    value: "friday",
    label: "Sexta-feira"
  }, {
    value: "weekend",
    label: "Fim de semana"
  }];

  const filteredTasks = tasks.filter(task => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  }).filter(task => task.title.toLowerCase().includes(search.toLowerCase())).filter(task => {
    if (categoryFilter === "all") return true;
    return task.category === categoryFilter;
  }).filter(task => {
    if (priorityFilter === "all") return true;
    return task.priority === priorityFilter;
  }).filter(task => {
    if (!dateFilter) return true;
    if (!task.due_date) return false;
    const taskDate = new Date(task.due_date);
    return taskDate.getFullYear() === dateFilter.getFullYear() && taskDate.getMonth() === dateFilter.getMonth() && taskDate.getDate() === dateFilter.getDate();
  }).filter(task => {
    if (sectionFilter === "all") return true;
    return task.section === sectionFilter;
  });

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleUpdateTask = (taskId: string, updates: any) => {
    updateTask({
      id: taskId,
      updates
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} onLogout={handleLogout} />
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
                <h2 className="text-2xl font-bold text-gray-900">Execução</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-2">
                    <TaskFilters
                      search={search}
                      setSearch={setSearch}
                      filter={filter}
                      setFilter={setFilter}
                      categoryFilter={categoryFilter}
                      setCategoryFilter={setCategoryFilter}
                      priorityFilter={priorityFilter}
                      setPriorityFilter={setPriorityFilter}
                      dateFilter={dateFilter}
                      setDateFilter={setDateFilter}
                      sectionFilter={sectionFilter}
                      setSectionFilter={setSectionFilter}
                      categories={categories}
                      sections={sections}
                    />
                  </div>
                  <div>
                    <CategoryManager 
                      categories={categories} 
                      onAddCategory={addCategory}
                      onUpdateCategory={updateCategory}
                      onDeleteCategory={deleteCategory}
                    />
                  </div>
                </div>
                
                <AddTask onAdd={addTask} categories={categories} sections={sections} />
                
                <TaskList
                  tasks={filteredTasks}
                  onToggleTask={toggleTask}
                  onDeleteTask={deleteTask}
                  onUpdateTask={handleUpdateTask}
                  categories={categories}
                  showThisWeek={showThisWeek}
                  setShowThisWeek={setShowThisWeek}
                  showThisMonth={showThisMonth}
                  setShowThisMonth={setShowThisMonth}
                  showOlder={showOlder}
                  setShowOlder={setShowOlder}
                  onAddSubtask={() => {}}
                  onToggleSubtask={() => {}}
                />

                <KanbanCalendar tasks={tasks} onTaskDrop={handleTaskDrop} />
              </div>
            </div>
          ) : activeTab === 'finance' ? (
            <FinanceTab />
          ) : activeTab === 'habits' ? (
            <HabitsTab />
          ) : activeTab === 'journals' ? (
            <JournalsTab />
          ) : activeTab === 'challenges' ? (
            <ChallengesTab />
          ) : activeTab === 'profile' ? (
            <ProfileTab />
          ) : activeTab === 'settings' ? (
            <SettingsTab />
          ) : activeTab === 'budget' ? (
            <BudgetTab />
          ) : activeTab === 'services' ? (
            <ServicesTab />
          ) : activeTab === 'projects' ? (
            <WrittenProjectsTab />
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default Index;
