import React, { useState } from "react";
import { LineChart, Line, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Activity, Wallet, Target, CheckCircle2, Calendar, TrendingUp, ChevronUp, ChevronDown, CircleDollarSign, List, Home, Sparkles, FileText, BookOpen, Briefcase, User, Settings } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UpcomingMeetings } from "@/components/dashboard/UpcomingMeetings";
import { MonthlyProgress } from "@/components/dashboard/MonthlyProgress";
import { TopClients } from "@/components/dashboard/TopClients";
import FloatingChatButton from "./FloatingChatButton";

// Import all tab components
import { AIAssistantTab } from "./ai-chat/AIAssistantTab";
import { FinanceTab } from "./FinanceTab";
import { BudgetTab } from "./BudgetTab";
import { HabitsTab } from "./HabitsTab";
import { JournalsTab } from "./JournalsTab";
import { ChallengesTab } from "./ChallengesTab";
import { ServicesTab } from "./ServicesTab";
import { WrittenProjectsTab } from "./WrittenProjectsTab";
import { MeetingsTab } from "./MeetingsTab";
import { ProfileTab } from "./ProfileTab";
import { SettingsTab } from "./SettingsTab";
import { TaskList } from "./TaskList";
import { AddTask } from "./AddTask";
import { TaskFilters } from "./TaskFilters";
import { useCategories } from "@/hooks/useCategories";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-gray-600" style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardTab = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const { categories } = useCategories();
  
  // Fetch transactions
  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch running challenges
  const { data: challenges } = useQuery({
    queryKey: ['running-challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('running_challenges')
        .select('*');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate task metrics
  const activeTasks = tasks?.filter(task => !task.completed).length || 0;
  const completedTasks = tasks?.filter(task => task.completed).length || 0;
  const totalTasks = tasks?.length || 0;
  const taskCompletionRate = totalTasks ? (completedTasks / totalTasks * 100).toFixed(1) : 0;

  // Calculate financial metrics
  const income = transactions?.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) || 0;
  const expenses = transactions?.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
  const balance = income - expenses;

  // Calculate challenge metrics
  const activeChallenge = challenges?.[0];
  const totalChallenges = challenges?.length || 0;

  // Financial trend data for line chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  });

  const financialTrendData = last7Days.map(date => {
    const dayIncome = transactions?.filter(t => t.date === date && t.amount > 0).reduce((sum, t) => sum + t.amount, 0) || 0;
    const dayExpenses = transactions?.filter(t => t.date === date && t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
    
    return {
      name: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }),
      receitas: dayIncome,
      despesas: dayExpenses,
      saldo: dayIncome - dayExpenses,
    };
  });

  // Get trends
  const currentTasksDay = activeTasks;
  const prevTasksDay = activeTasks > 0 ? Math.floor(activeTasks * 0.9) : 0;
  const tasksTrend = currentTasksDay - prevTasksDay;
  const tasksPercentChange = prevTasksDay > 0 ? ((tasksTrend / prevTasksDay) * 100).toFixed(1) : "0";
  
  const currentIncome = income;
  const prevIncome = income > 0 ? Math.floor(income * 0.95) : 0;
  const incomeTrend = currentIncome - prevIncome;
  const incomePercentChange = prevIncome > 0 ? ((incomeTrend / prevIncome) * 100).toFixed(1) : "0";

  // Sections for tasks
  const sections = [
    { value: "today", label: "Hoje" },
    { value: "tomorrow", label: "Amanhã" },
    { value: "week", label: "Esta Semana" },
    { value: "later", label: "Mais Tarde" }
  ];

  // Overview content (current dashboard)
  const OverviewContent = () => (
    <div className="space-y-8 animate-fade-in">
      {/* Main Stats */}
      <div className="grid gap-5 md:grid-cols-4">
        <Card className="!bg-white shadow-none border border-gray-100 hover:shadow transition-all duration-300 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-gray-500">Total de Tarefas</CardTitle>
            <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
              <Activity className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-gray-800">{totalTasks}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs ${tasksTrend >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                {tasksTrend >= 0 ? <ChevronUp className="h-3 w-3 mr-0.5" /> : <ChevronDown className="h-3 w-3 mr-0.5" />}
                {Math.abs(Number(tasksPercentChange))}%
              </span>
              <span className="text-xs text-gray-400">vs ontem</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">{activeTasks} ativas</p>
          </CardContent>
        </Card>

        <Card className="!bg-white shadow-none border border-gray-100 hover:shadow transition-all duration-300 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-gray-500">Saldo Financeiro</CardTitle>
            <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
              <CircleDollarSign className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-extrabold ${balance < 0 ? "text-red-600" : "text-gray-800"}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs ${incomeTrend >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                {incomeTrend >= 0 ? <ChevronUp className="h-3 w-3 mr-0.5" /> : <ChevronDown className="h-3 w-3 mr-0.5" />}
                {Math.abs(Number(incomePercentChange))}%
              </span>
              <span className="text-xs text-gray-400">receitas</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">{transactions?.length} transações</p>
          </CardContent>
        </Card>

        <Card className="!bg-white shadow-none border border-gray-100 hover:shadow transition-all duration-300 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-gray-500">Desafios</CardTitle>
            <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
              <Target className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-gray-800">{totalChallenges}</div>
            <div className="text-xs text-gray-400 mt-1">
              {activeChallenge ? <>{activeChallenge.title}</> : 'Nenhum desafio ativo'}
            </div>
          </CardContent>
        </Card>

        <Card className="!bg-white shadow-none border border-gray-100 hover:shadow transition-all duration-300 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-medium text-gray-500">Conclusão</CardTitle>
            <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-gray-800">{taskCompletionRate}%</div>
            <div className="w-full h-1 rounded-full bg-gray-100 mt-2">
              <div className="h-full rounded-full bg-purple-400 transition-all duration-500" style={{ width: `${taskCompletionRate}%` }}></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{completedTasks} concluídas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <MonthlyProgress />
          <TopClients />
        </div>
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white border border-gray-100 shadow-none hover:shadow-md">
            <CardHeader className="bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900">Resumo Financeiro</CardTitle>
                  <CardDescription className="text-gray-600">Receitas e despesas</CardDescription>
                </div>
                <div className="h-8 w-8 rounded bg-white flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="h-[220px] md:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={financialTrendData}>
                    <CartesianGrid strokeDasharray="2 2" className="stroke-gray-100" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#a78bfa" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#f87171" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <UpcomingMeetings />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white border border-gray-100 shadow-none hover:shadow">
          <CardHeader className="bg-gray-50 pb-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-gray-700">Próximas Tarefas</CardTitle>
              <div className="h-6 w-6 rounded-lg bg-white flex items-center justify-center">
                <List className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              {tasks?.filter(task => !task.completed).slice(0, 3).map(task => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate text-gray-700">{task.title}</span>
                    {task.due_date && (
                      <span className="text-xs text-gray-400 ml-2">
                        {new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${task.priority === 'high' ? 'bg-red-50 text-red-500' : task.priority === 'medium' ? 'bg-yellow-50 text-yellow-500' : 'bg-green-50 text-green-500'}`}>
                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                  </div>
                </div>
              ))}
              {tasks?.filter(task => !task.completed).length === 0 && (
                <div className="text-center py-6">
                  <div className="w-10 h-10 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-2">
                    <CheckCircle2 className="h-5 w-5 text-gray-300" />
                  </div>
                  <span className="text-xs text-gray-400">Nenhuma tarefa pendente</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-none hover:shadow">
          <CardHeader className="bg-gray-50 pb-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-gray-700">Resumo Financeiro</CardTitle>
              <div className="h-6 w-6 rounded-lg bg-white flex items-center justify-center">
                <Wallet className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              <div className="flex justify-between items-center p-1">
                <span className="text-xs text-gray-600">Receitas</span>
                <span className="text-xs font-semibold text-green-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(income)}
                </span>
              </div>
              <div className="flex justify-between items-center p-1">
                <span className="text-xs text-gray-600">Despesas</span>
                <span className="text-xs font-semibold text-red-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expenses)}
                </span>
              </div>
              <div className="flex justify-between items-center p-1">
                <span className="text-xs text-gray-600">Saldo</span>
                <span className="text-xs font-semibold text-gray-700">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100 shadow-none hover:shadow">
          <CardHeader className="bg-gray-50 pb-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-gray-700">Desafios</CardTitle>
              <div className="h-6 w-6 rounded-lg bg-white flex items-center justify-center">
                <Target className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              {challenges?.slice(0, 3).map(challenge => (
                <div key={challenge.id} className="flex items-center gap-2 p-1">
                  <Calendar className="h-4 w-4 text-gray-300" />
                  <span className="text-xs font-medium truncate text-gray-700">{challenge.title}</span>
                </div>
              ))}
              {(!challenges || challenges.length === 0) && (
                <div className="text-center py-4">
                  <Target className="h-5 w-5 mx-auto text-gray-300" />
                  <span className="text-xs text-gray-400 block mt-1">Nenhum desafio ativo</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Tasks content
  const TasksContent = () => {
    const [search, setSearch] = React.useState("");
    const [filter, setFilter] = React.useState<"all" | "active" | "completed">("all");
    const [categoryFilter, setCategoryFilter] = React.useState<string | "all">("all");
    const [priorityFilter, setPriorityFilter] = React.useState<"high" | "medium" | "low" | "all">("all");
    const [dateFilter, setDateFilter] = React.useState<Date | null>(null);
    const [sectionFilter, setSectionFilter] = React.useState("today");
    const [showThisWeek, setShowThisWeek] = React.useState(true);
    const [showThisMonth, setShowThisMonth] = React.useState(false);
    const [showOlder, setShowOlder] = React.useState(false);

    return (
      <div className="space-y-6">
        <AddTask 
          onAdd={addTask}
          categories={categories}
          sections={sections}
        />
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
        <TaskList 
          tasks={tasks || []}
          onToggleTask={(id: string) => updateTask({ id, updates: { completed: !tasks?.find(t => t.id === id)?.completed } })}
          onDeleteTask={deleteTask}
          onAddSubtask={(taskId: string, title: string) => {}}
          onToggleSubtask={(taskId: string, subtaskId: string) => {}}
          onUpdateTask={(taskId: string, updates: any) => updateTask({ id: taskId, updates })}
          categories={categories}
          showThisWeek={showThisWeek}
          setShowThisWeek={setShowThisWeek}
          showThisMonth={showThisMonth}
          setShowThisMonth={setShowThisMonth}
          showOlder={showOlder}
          setShowOlder={setShowOlder}
        />
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Painel de Controle
          </h1>
          <div className="text-xs md:text-sm text-gray-400">
            Atualizado {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-12 gap-1 h-auto p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2 px-3 py-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="ai-assistant" className="flex items-center gap-2 px-3 py-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">IA</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2 px-3 py-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Tarefas</span>
            </TabsTrigger>
            <TabsTrigger value="meetings" className="flex items-center gap-2 px-3 py-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Reuniões</span>
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center gap-2 px-3 py-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Financeiro</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-2 px-3 py-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Orçamento</span>
            </TabsTrigger>
            <TabsTrigger value="habits" className="flex items-center gap-2 px-3 py-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Hábitos</span>
            </TabsTrigger>
            <TabsTrigger value="journals" className="flex items-center gap-2 px-3 py-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Diário</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2 px-3 py-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Serviços</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2 px-3 py-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Projetos</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2 px-3 py-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2 px-3 py-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewContent />
          </TabsContent>

          <TabsContent value="ai-assistant" className="mt-6">
            <AIAssistantTab />
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <TasksContent />
          </TabsContent>

          <TabsContent value="meetings" className="mt-6">
            <MeetingsTab />
          </TabsContent>

          <TabsContent value="finance" className="mt-6">
            <FinanceTab />
          </TabsContent>

          <TabsContent value="budget" className="mt-6">
            <BudgetTab />
          </TabsContent>

          <TabsContent value="habits" className="mt-6">
            <HabitsTab />
          </TabsContent>

          <TabsContent value="journals" className="mt-6">
            <JournalsTab />
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <ServicesTab />
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <WrittenProjectsTab />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
      <FloatingChatButton />
    </>
  );
};

export default DashboardTab;
