
import React from "react";
import { LineChart, Line, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Wallet, Target, CheckCircle2, Calendar, TrendingUp, ChevronUp, ChevronDown, CircleDollarSign, List } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UpcomingMeetings } from "@/components/dashboard/UpcomingMeetings";
import { MonthlyProgress } from "@/components/dashboard/MonthlyProgress";
import { TopClients } from "@/components/dashboard/TopClients";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="neo-blur p-3 border rounded-lg shadow-lg">
        <p className="text-sm font-medium">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
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
  const prevTasksDay = activeTasks > 0 ? Math.floor(activeTasks * 0.9) : 0; // Simulate previous day data
  const tasksTrend = currentTasksDay - prevTasksDay;
  const tasksPercentChange = prevTasksDay > 0 ? ((tasksTrend / prevTasksDay) * 100).toFixed(1) : "0";
  
  const currentIncome = income;
  const prevIncome = income > 0 ? Math.floor(income * 0.95) : 0; // Simulate previous income
  const incomeTrend = currentIncome - prevIncome;
  const incomePercentChange = prevIncome > 0 ? ((incomeTrend / prevIncome) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-dilq-accent to-dilq-teal bg-clip-text text-transparent">
          Painel de Controle
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Atualizado {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-5 md:grid-cols-4">
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-dilq-accent/10 dark-hover-glow">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-dilq-accent to-dilq-teal"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 p-1.5 flex items-center justify-center">
              <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <div className="flex items-center mt-1">
              <div className={`text-xs ${tasksTrend >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                {tasksTrend >= 0 ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                {Math.abs(Number(tasksPercentChange))}% 
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">desde ontem</span>
            </div>
            <p className="text-xs text-green-500 mt-2 flex items-center">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1"></span>
              {activeTasks} tarefas ativas
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-dilq-accent/10 dark-hover-glow">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-dilq-teal to-green-400"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Financeiro</CardTitle>
            <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-900/30 p-1.5 flex items-center justify-center">
              <CircleDollarSign className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
            </div>
            <div className="flex items-center mt-1">
              <div className={`text-xs ${incomeTrend >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                {incomeTrend >= 0 ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                {Math.abs(Number(incomePercentChange))}% 
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">em receitas</span>
            </div>
            <p className="text-xs text-blue-500 mt-2 flex items-center">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mr-1"></span>
              {transactions?.length || 0} transações no total
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-dilq-accent/10 dark-hover-glow">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desafios</CardTitle>
            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 p-1.5 flex items-center justify-center">
              <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChallenges}</div>
            <div className="flex items-center mt-1">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Progresso
              </div>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 dark:bg-gray-800">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: '45%' }}></div>
            </div>
            <p className="text-xs text-indigo-500 mt-2 truncate flex items-center">
              <span className="inline-block h-2 w-2 rounded-full bg-indigo-500 mr-1"></span>
              {activeChallenge ? activeChallenge.title : 'Nenhum desafio ativo'}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-dilq-accent/10 dark-hover-glow">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-1.5 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCompletionRate}%</div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 dark:bg-gray-800">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500" 
                style={{ width: `${taskCompletionRate}%` }}
              ></div>
            </div>
            <p className="text-xs text-emerald-500 mt-2 flex items-center">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 mr-1"></span>
              {completedTasks} tarefas concluídas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <MonthlyProgress />
          <TopClients />
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-dilq-accent/10 dark-hover-glow">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-100/50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Resumo Financeiro</CardTitle>
                  <CardDescription>Visão de receitas e despesas</CardDescription>
                </div>
                <div className="h-10 w-10 rounded-lg bg-white/80 dark:bg-gray-800/80 shadow-sm flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={financialTrendData}>
                    <defs>
                      <linearGradient id="receitasGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="despesasGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="receitas" 
                      name="Receitas" 
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="despesas" 
                      name="Despesas" 
                      stroke="#f43f5e"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#f43f5e", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#f43f5e", stroke: "#fff", strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="saldo" 
                      name="Saldo" 
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <UpcomingMeetings />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-dilq-accent/10 dark-hover-glow">
          <CardHeader className="bg-gradient-to-r from-purple-50/50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/20 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Próximas Tarefas</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-white/80 dark:bg-gray-800/80 shadow-sm flex items-center justify-center">
                <List className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks?.filter(task => !task.completed)
                .slice(0, 3)
                .map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block truncate">{task.title}</span>
                      {task.due_date && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(task.due_date).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: 'short' 
                          })}
                        </span>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${task.priority === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                      {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto flex items-center justify-center mb-3">
                      <CheckCircle2 className="h-6 w-6 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Nenhuma tarefa pendente</span>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-dilq-accent/10 dark-hover-glow">
          <CardHeader className="bg-gradient-to-r from-teal-50/50 to-green-100/50 dark:from-teal-900/20 dark:to-green-900/20 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Resumo Financeiro</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-white/80 dark:bg-gray-800/80 shadow-sm flex items-center justify-center">
                <Wallet className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <span className="text-sm">Receitas</span>
                </div>
                <span className="text-sm font-medium text-green-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(income)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />
                  </div>
                  <span className="text-sm">Despesas</span>
                </div>
                <span className="text-sm font-medium text-red-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expenses)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <CircleDollarSign className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-sm">Saldo</span>
                </div>
                <span className="text-sm font-medium text-blue-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-dilq-accent/10 dark-hover-glow">
          <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-blue-100/50 dark:from-indigo-900/20 dark:to-blue-900/20 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Desafios</CardTitle>
              <div className="h-7 w-7 rounded-lg bg-white/80 dark:bg-gray-800/80 shadow-sm flex items-center justify-center">
                <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {challenges?.slice(0, 3).map(challenge => (
                <div key={challenge.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block truncate">{challenge.title}</span>
                    <div className="w-full h-1 bg-gray-100 rounded-full mt-1 dark:bg-gray-800">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                        style={{ width: `${Math.random() * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto flex items-center justify-center mb-3">
                    <Target className="h-6 w-6 text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Nenhum desafio ativo</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardTab;
