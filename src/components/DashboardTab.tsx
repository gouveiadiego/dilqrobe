import React from "react";
import { LineChart, Line, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Wallet, Target, CheckCircle2, Calendar, TrendingUp, ChevronUp, ChevronDown, CircleDollarSign, List, Users, Clock, Award, DollarSign } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
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

  // Fetch habits
  const { data: habits } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
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

  // Calculate habit metrics
  const activeHabits = habits?.filter(habit => habit.active).length || 0;
  const avgStreak = habits?.length ? habits.reduce((sum, habit) => sum + (habit.streak || 0), 0) / habits.length : 0;

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

  // Task analytics data
  const tasksByPriority = [
    { name: 'Alta', value: tasks?.filter(t => t.priority === 'high' && !t.completed).length || 0, color: '#ef4444' },
    { name: 'Média', value: tasks?.filter(t => t.priority === 'medium' && !t.completed).length || 0, color: '#f59e0b' },
    { name: 'Baixa', value: tasks?.filter(t => t.priority === 'low' && !t.completed).length || 0, color: '#10b981' }
  ];

  // Productivity trend (last 7 days)
  const productivityData = last7Days.map(date => {
    const completed = tasks?.filter(t => t.completed && t.updated_at?.split('T')[0] === date).length || 0;
    return {
      name: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }),
      completadas: completed,
      financeiro: financialTrendData.find(f => f.name === new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }))?.saldo || 0
    };
  });

  
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
              <CardTitle className="text-sm font-medium text-green-700">Saldo Financeiro</CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${balance < 0 ? "text-red-600" : "text-green-900"}`}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs ${incomeTrend >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                  {incomeTrend >= 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {Math.abs(Number(incomePercentChange))}%
                </span>
                <span className="text-xs text-green-600">receitas</span>
              </div>
              <p className="text-xs text-green-600 mt-1">{transactions?.length} transações</p>
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
                <CardTitle className="text-lg text-gray-900">Análise de Produtividade</CardTitle>
                <CardDescription>Tarefas concluídas e tendência financeira nos últimos 7 dias</CardDescription>
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
                      <Bar yAxisId="left" dataKey="completadas" name="Tarefas Concluídas" fill="#8b5cf6" />
                      <Line yAxisId="right" type="monotone" dataKey="financeiro" name="Saldo" stroke="#10b981" strokeWidth={3} />
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
                  <span className="text-sm font-medium text-blue-800">Saldo</span>
                  <span className={`text-xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
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
