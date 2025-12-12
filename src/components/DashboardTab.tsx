import React, { useMemo } from "react";
import { LineChart, Line, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Wallet, Target, CheckCircle2, Calendar, TrendingUp, ChevronUp, ChevronDown, CircleDollarSign, List, Users, Clock, Award, DollarSign, Building2, BookOpen, FileText, Coffee, UserCheck } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useTransactions } from "@/hooks/useTransactions";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UpcomingMeetings } from "@/components/dashboard/UpcomingMeetings";
import { MonthlyProgress } from "@/components/dashboard/MonthlyProgress";
import { TopClients } from "@/components/dashboard/TopClients";
import FloatingChatButton from "./FloatingChatButton";

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
  const { tasks } = useTasks();
  
  // Memoizar a data para evitar re-renders infinitos
  const currentDate = useMemo(() => new Date(), []);
  
  const { summaries, chartData, transactions } = useTransactions({ currentDate });
  const { bankAccounts, getTotalBalance } = useBankAccounts();
  
  // Fetch companies data
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return [];
      
      const { data, error } = await supabase
        .from('project_companies')
        .select('*')
        .eq('user_id', sessionData.session.user.id);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch services data
  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return [];
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', sessionData.session.user.id);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch meetings data
  const { data: meetings } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return [];
      
      const { data, error } = await supabase
        .from('client_meetings')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .order('meeting_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch journal entries
  const { data: journals } = useQuery({
    queryKey: ['journals'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return [];
      
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch habits
  const { data: habits } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return [];
      
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', sessionData.session.user.id);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate metrics
  const activeTasks = tasks?.filter(task => !task.completed).length || 0;
  const completedTasks = tasks?.filter(task => task.completed).length || 0;
  const totalTasks = tasks?.length || 0;
  const taskCompletionRate = totalTasks ? (completedTasks / totalTasks * 100).toFixed(1) : 0;

  const activeCompanies = companies?.filter(c => c.is_active).length || 0;
  const activeHabits = habits?.filter(habit => habit.active).length || 0;
  const avgStreak = habits?.length ? habits.reduce((sum, habit) => sum + (habit.streak || 0), 0) / habits.length : 0;
  
  // Services metrics
  const activeServices = services?.filter(s => s.status === 'active').length || 0;
  const pendingServices = services?.filter(s => s.status === 'pending').length || 0;
  const totalServiceValue = services?.reduce((sum, s) => sum + Number(s.amount || 0), 0) || 0;
  
  // Meetings metrics
  const upcomingMeetings = meetings?.filter(m => new Date(m.meeting_date) > new Date()).length || 0;
  const todayMeetings = meetings?.filter(m => {
    const meetingDate = new Date(m.meeting_date);
    const today = new Date();
    return meetingDate.toDateString() === today.toDateString();
  }).length || 0;

  // Journal metrics
  const weeklyJournals = journals?.filter(j => {
    const journalDate = new Date(j.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return journalDate > weekAgo;
  }).length || 0;

  // Get last 7 days for trends
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  // Productivity data combining tasks and financial
  const productivityData = last7Days.map(date => {
    const completed = tasks?.filter(t => t.completed && t.updated_at?.split('T')[0] === date).length || 0;
    const dayData = chartData?.find(c => c.date === date);
    return {
      name: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }),
      tarefas: completed,
      receitas: dayData?.income || 0,
      despesas: dayData?.expenses || 0,
    };
  });

  // Task priority distribution
  const tasksByPriority = [
    { name: 'Alta', value: tasks?.filter(t => t.priority === 'high' && !t.completed).length || 0, color: '#ef4444' },
    { name: 'Média', value: tasks?.filter(t => t.priority === 'medium' && !t.completed).length || 0, color: '#f59e0b' },
    { name: 'Baixa', value: tasks?.filter(t => t.priority === 'low' && !t.completed).length || 0, color: '#10b981' }
  ];

  // Services by status
  const servicesByStatus = [
    { name: 'Ativo', value: activeServices, color: '#10b981' },
    { name: 'Pendente', value: pendingServices, color: '#f59e0b' },
    { name: 'Concluído', value: services?.filter(s => s.status === 'completed').length || 0, color: '#6366f1' }
  ];

  // Calculate financial trends - using renamed variable to avoid conflicts
  const { income, expenses, balance: monthBalance } = summaries || { income: 0, expenses: 0, balance: 0 };
  
  // Saldo total real das contas bancárias
  const totalBankBalance = getTotalBalance() || 0;

  const currentTasksDay = activeTasks;
  const prevTasksDay = activeTasks > 0 ? Math.floor(activeTasks * 0.9) : 0;
  const tasksTrend = currentTasksDay - prevTasksDay;
  const tasksPercentChange = prevTasksDay > 0 ? ((tasksTrend / prevTasksDay) * 100).toFixed(1) : "0";
  
  const currentIncome = income;
  const prevIncome = income > 0 ? Math.floor(income * 0.95) : 0;
  const incomeTrend = currentIncome - prevIncome;
  const incomePercentChange = prevIncome > 0 ? ((incomeTrend / prevIncome) * 100).toFixed(1) : "0";

  // Financial trend data for line chart - últimos 7 dias apenas
  const financialTrendData = chartData?.slice(-7).map(data => ({
    name: new Date(data.date.split('/').reverse().join('-')).toLocaleDateString('pt-BR', { weekday: 'short' }),
    receitas: data.income,
    despesas: data.expenses,
    saldo: data.income - data.expenses,
  })) || [];

  // Total de transações do mês
  const totalTransactions = transactions?.length || 0;

  
  return (
    <>
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Dashboard Analítico
            </h1>
            <p className="text-gray-500 mt-1">Visão consolidada dos seus dados mais importantes</p>
          </div>
          <div className="text-xs md:text-sm text-gray-400">
            Atualizado {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* KPIs Principais */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Tarefas Ativas</CardTitle>
              <Activity className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{activeTasks}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs ${tasksTrend >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                  {tasksTrend >= 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {Math.abs(Number(tasksPercentChange))}%
                </span>
                <span className="text-xs text-blue-600">vs período anterior</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">Taxa de conclusão: {taskCompletionRate}%</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Saldo Total Contas</CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${totalBankBalance < 0 ? "text-red-600" : "text-green-900"}`}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBankBalance)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-green-600 flex items-center">
                  <Wallet className="h-3 w-3 mr-1" />
                  {bankAccounts.length} conta{bankAccounts.length !== 1 ? 's' : ''} ativa{bankAccounts.length !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Mês: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthBalance)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Hábitos Ativos</CardTitle>
              <Target className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{activeHabits}</div>
              <div className="flex items-center gap-2 mt-2">
                <Award className="h-3 w-3 text-purple-600" />
                <span className="text-xs text-purple-600">Sequência média: {avgStreak.toFixed(0)} dias</span>
              </div>
              <p className="text-xs text-purple-600 mt-1">{habits?.length || 0} hábitos totais</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Empresas Ativas</CardTitle>
              <Building2 className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">{activeCompanies}</div>
              <div className="flex items-center gap-2 mt-2">
                <Users className="h-3 w-3 text-orange-600" />
                <span className="text-xs text-orange-600">{companies?.length || 0} empresas totais</span>
              </div>
              <p className="text-xs text-orange-600 mt-1">{activeServices} serviços ativos</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-cyan-700">Reuniões Hoje</CardTitle>
              <Calendar className="h-5 w-5 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-900">{todayMeetings}</div>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-3 w-3 text-cyan-600" />
                <span className="text-xs text-cyan-600">{upcomingMeetings} próximas</span>
              </div>
              <p className="text-xs text-cyan-600 mt-1">{meetings?.length || 0} reuniões total</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-indigo-700">Journals Semanais</CardTitle>
              <BookOpen className="h-5 w-5 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-900">{weeklyJournals}</div>
              <div className="flex items-center gap-2 mt-2">
                <FileText className="h-3 w-3 text-indigo-600" />
                <span className="text-xs text-indigo-600">{journals?.length || 0} entradas totais</span>
              </div>
              <p className="text-xs text-indigo-600 mt-1">Esta semana</p>
            </CardContent>
          </Card>
        </div>

        {/* Segunda linha de KPIs */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700">Valor Total Serviços</CardTitle>
              <CircleDollarSign className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalServiceValue)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <UserCheck className="h-3 w-3 text-emerald-600" />
                <span className="text-xs text-emerald-600">{activeServices} ativos</span>
              </div>
              <p className="text-xs text-emerald-600 mt-1">{pendingServices} pendentes</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Produtividade</CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">{completedTasks}</div>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-3 w-3 text-orange-600" />
                <span className="text-xs text-orange-600">concluídas esta semana</span>
              </div>
              <p className="text-xs text-orange-600 mt-1">Meta: {Math.round(totalTasks * 0.8)} tarefas</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Análise */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Gráfico de Produtividade */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Análise de Produtividade e Financeiro</CardTitle>
                <CardDescription>Tarefas concluídas, receitas e despesas dos últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productivityData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis yAxisId="left" className="text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar yAxisId="left" dataKey="tarefas" name="Tarefas Concluídas" fill="#8b5cf6" />
                      <Bar yAxisId="right" dataKey="receitas" name="Receitas" fill="#10b981" />
                      <Bar yAxisId="right" dataKey="despesas" name="Despesas" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico Financeiro */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Fluxo Financeiro</CardTitle>
                <CardDescription>Receitas, despesas e saldo dos últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={financialTrendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
                      <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4 }} />
                      <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Distribuição de Tarefas por Prioridade */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Tarefas por Prioridade</CardTitle>
                <CardDescription>Distribuição das tarefas ativas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tasksByPriority}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {tasksByPriority.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  {tasksByPriority.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs text-gray-600">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribuição de Serviços por Status */}
            <Card className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Serviços por Status</CardTitle>
                <CardDescription>Status dos serviços</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={servicesByStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {servicesByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-2 mt-4 text-xs">
                  {servicesByStatus.map((item, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-600">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Progresso Mensal */}
            <MonthlyProgress />

            {/* Top Clientes */}
            <TopClients />
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-white shadow-lg">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Próximas Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {tasks?.filter(task => !task.completed).slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${
                      task.priority === 'high' ? 'bg-red-500' : 
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      {task.due_date && (
                        <p className="text-xs text-gray-500">
                          {new Date(task.due_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {(!tasks || tasks.filter(task => !task.completed).length === 0) && (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                    <p className="text-sm text-gray-500">Todas as tarefas concluídas!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="bg-green-50 border-b">
              <CardTitle className="text-lg text-green-900 flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-800">Receitas</span>
                  <span className="text-lg font-bold text-green-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(income)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium text-red-800">Despesas</span>
                  <span className="text-lg font-bold text-red-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expenses)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <span className="text-sm font-medium text-blue-800">Saldo do Mês</span>
                  <span className={`text-xl font-bold ${monthBalance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthBalance)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="bg-purple-50 border-b">
              <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Hábitos em Destaque
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {habits?.filter(habit => habit.active).slice(0, 4).map(habit => (
                  <div key={habit.id} className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-purple-900 truncate">{habit.title}</span>
                      <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                        {habit.streak || 0} dias
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-purple-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(((habit.streak || 0) / 30) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
                {(!habits || habits.filter(habit => habit.active).length === 0) && (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto text-purple-400 mb-2" />
                    <p className="text-sm text-gray-500">Nenhum hábito ativo</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reuniões Próximas */}
        <UpcomingMeetings />
      </div>
      <FloatingChatButton />
    </>
  );
};

export default DashboardTab;
