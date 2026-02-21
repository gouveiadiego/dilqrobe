import { useState, useMemo } from "react";
import { AddTask } from "@/components/AddTask";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { handleApiError, handleSuccess } from "@/utils/errorHandler";
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
import { HabitReminder } from "@/components/HabitReminder";
import { MeetingsTab } from "@/components/MeetingsTab";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { AIAssistantTab } from "@/components/ai-chat/AIAssistantTab";
import { AIChatWidget } from "@/components/ai-chat/AIChatWidget";
import { QuickActionsMenu } from "@/components/QuickActionsMenu";
import { MotivationDashboardTab } from "@/components/motivation-dashboard/MotivationDashboardTab";

type TabType = 'dashboard' | 'motivation' | 'tasks' | 'finance' | 'habits' | 'journals' | 'profile' | 'settings' | 'budget' | 'services' | 'projects' | 'meetings' | 'ai-assistant';

const Index = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [categoryFilter, setCategoryFilter] = useState<string | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Task["priority"] | "all">("all");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [showThisWeek, setShowThisWeek] = useState(false);
  const [showThisMonth, setShowThisMonth] = useState(false);
  const [showOlder, setShowOlder] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

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
    isLoading: categoriesLoading,
    addCategory,
    updateCategory,
    deleteCategory
  } = useCategories();

  const taskCategories = useMemo(() => {
    return categories.filter(c => !c.type);
  }, [categories]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      handleSuccess("Logout realizado com sucesso!");
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      handleApiError(error, "Erro ao fazer logout");
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

  const sections = useMemo(() => [
    { value: "all", label: "Todas as seções" },
    { value: "inbox", label: "Caixa de entrada" },
    { value: "monday", label: "Segunda-feira" },
    { value: "tuesday", label: "Terça-feira" },
    { value: "wednesday", label: "Quarta-feira" },
    { value: "thursday", label: "Quinta-feira" },
    { value: "friday", label: "Sexta-feira" },
    { value: "weekend", label: "Fim de semana" }
  ], []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter === "active") return !task.completed;
      if (filter === "completed") return task.completed;
      return true;
    }).filter(task =>
      task.title.toLowerCase().includes(search.toLowerCase())
    ).filter(task => {
      if (categoryFilter === "all") return true;
      return task.category === categoryFilter;
    }).filter(task => {
      if (priorityFilter === "all") return true;
      return task.priority === priorityFilter;
    }).filter(task => {
      if (!dateFilter) return true;
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.getFullYear() === dateFilter.getFullYear() &&
        taskDate.getMonth() === dateFilter.getMonth() &&
        taskDate.getDate() === dateFilter.getDate();
    }).filter(task => {
      if (sectionFilter === "all") return true;
      return task.section === sectionFilter;
    });
  }, [tasks, filter, search, categoryFilter, priorityFilter, dateFilter, sectionFilter]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleUpdateTask = (taskId: string, updates: any) => {
    updateTask({
      id: taskId,
      updates
    });
  };

  const handleCompleteAll = () => {
    // Marcar todas as tarefas ativas como concluídas
    filteredTasks
      .filter(t => !t.completed)
      .forEach(t => toggleTask(t.id));
  };

  const handlePostponeAll = () => {
    // Só adia tarefas ativas "de hoje" para amanhã
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    console.log('🗓️ Postponing tasks:', {
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString(),
      totalFilteredTasks: filteredTasks.length
    });

    const tasksToPostpone = filteredTasks
      .filter(t => {
        if (t.completed) return false;
        if (!t.due_date) return false;
        const due = new Date(t.due_date);
        due.setHours(0, 0, 0, 0);
        const isToday = due.getTime() === today.getTime();
        console.log('📋 Task check:', {
          taskTitle: t.title,
          taskDueDate: t.due_date,
          dueNormalized: due.toISOString(),
          isToday
        });
        return isToday;
      });

    console.log('📅 Tasks to postpone:', tasksToPostpone.length, tasksToPostpone.map(t => ({ title: t.title, dueDate: t.due_date })));

    tasksToPostpone.forEach(t => {
      console.log('⏰ Postponing task:', t.title, 'from', t.due_date, 'to', tomorrow.toISOString());
      handleUpdateTask(t.id, { due_date: tomorrow.toISOString() });
    });
  };

  // Modo Foco: exibe só tarefas de prioridade alta ou vencidas
  const tasksFocusFiltered = focusMode
    ? filteredTasks.filter(task =>
    (!task.completed &&
      (
        task.priority === "high" ||
        (task.due_date && new Date(task.due_date) < new Date())
      )
    ))
    : filteredTasks;

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Carregando..." className="h-screen" />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'motivation':
        return <MotivationDashboardTab />;
      case 'ai-assistant':
        return <AIAssistantTab />;
      case 'tasks':
        return (
          <div className="space-y-4 md:space-y-6 rounded-lg animate-fade-in">
            {/* Quick Actions */}
            <QuickActionsMenu
              onPostponeAll={handlePostponeAll}
              focusMode={focusMode}
              onToggleFocus={() => setFocusMode(f => !f)}
            />
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center">
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-dilq-accent to-dilq-teal bg-clip-text text-transparent">Execução</h2>
                <div className="h-1 flex-grow ml-4 bg-gradient-to-r from-dilq-accent to-dilq-teal rounded-full opacity-50"></div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:gap-6">
                <div className="glass-card p-3 md:p-4 backdrop-blur-md bg-white/50 border border-gray-200/50 rounded-xl shadow-lg">
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
                    categories={taskCategories}
                    sections={sections}
                  />
                </div>
              </div>

              <div className="gradient-border p-4 md:p-6 bg-white/80 backdrop-blur-sm shadow-md rounded-xl transition-all duration-300 hover:shadow-lg">
                <AddTask onAdd={addTask} categories={taskCategories} sections={sections} />
              </div>

              <div className="p-4 md:p-6 bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-sm border border-gray-100 rounded-xl shadow-md">
                {tasksFocusFiltered.length === 0 ? (
                  <EmptyState
                    title="Nenhuma tarefa encontrada"
                    description="Adicione sua primeira tarefa para começar a organizar seu trabalho."
                    action={{
                      label: "Nova Tarefa",
                      onClick: () => { }
                    }}
                  />
                ) : (
                  <TaskList
                    tasks={tasksFocusFiltered}
                    onToggleTask={toggleTask}
                    onDeleteTask={deleteTask}
                    onUpdateTask={handleUpdateTask}
                    categories={taskCategories}
                    showThisWeek={showThisWeek}
                    setShowThisWeek={setShowThisWeek}
                    showThisMonth={showThisMonth}
                    setShowThisMonth={setShowThisMonth}
                    showOlder={showOlder}
                    setShowOlder={setShowOlder}
                    onAddSubtask={() => { }}
                    onToggleSubtask={() => { }}
                  />
                )}
              </div>

              <div className="p-4 md:p-6 bg-white/90 backdrop-blur-lg border border-gray-100 rounded-xl shadow-md transition-all duration-300 hover:shadow-xl">
                <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-gradient">Visualização em Calendário</h3>
                <KanbanCalendar tasks={tasks} onTaskDrop={handleTaskDrop} />
              </div>
            </div>
          </div>
        );
      case 'meetings':
        return <MeetingsTab />;
      case 'finance':
        return <FinanceTab />;
      case 'habits':
        return <HabitsTab />;
      case 'journals':
        return <JournalsTab />;
      case 'profile':
        return <ProfileTab />;
      case 'settings':
        return <SettingsTab />;
      case 'budget':
        return <BudgetTab />;
      case 'services':
        return <ServicesTab />;
      case 'ai-assistant':
        return <AIAssistantTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 transition-colors duration-300">
      <HabitReminder />

      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out z-30 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />
      </aside>

      <main className={`transition-all duration-200 ${sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0'}`}>
        <div className="p-2 md:p-4">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <Button variant="ghost" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>

          {renderTabContent()}
        </div>
      </main>

      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  );
};

export default Index;
