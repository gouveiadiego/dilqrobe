
import React from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Wallet, BookText, Target, CheckCircle2, Calendar } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded-lg shadow-sm">
        <p className="text-sm font-medium">{`${label}`}</p>
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

  // Calculate completion rate for pie chart
  const habitosData = [
    { name: "Concluídos", value: Number(taskCompletionRate), color: "#10b981" },
    { name: "Pendentes", value: 100 - Number(taskCompletionRate), color: "#f43f5e" },
  ];

  // Calculate activity data based on last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  });

  const activityData = last7Days.reverse().map(date => {
    const dayTasks = tasks?.filter(t => t.created_at?.startsWith(date)).length || 0;
    const dayTransactions = transactions?.filter(t => t.date === date).length || 0;
    
    return {
      name: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short' }),
      tarefas: dayTasks,
      financeiro: dayTransactions,
    };
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-green-500">{activeTasks} tarefas ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
            </div>
            <p className="text-xs text-green-500">
              {transactions?.length || 0} transações no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desafios</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChallenges}</div>
            <p className="text-xs text-green-500">
              {activeChallenge ? activeChallenge.title : 'Nenhum desafio ativo'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskCompletionRate}%</div>
            <p className="text-xs text-green-500">{completedTasks} tarefas concluídas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividades por Área</CardTitle>
            <CardDescription>Visão geral das atividades diárias</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="tarefas" name="Tarefas" fill="#8884d8" />
                  <Bar dataKey="financeiro" name="Financeiro" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taxa de Conclusão</CardTitle>
            <CardDescription>Distribuição de tarefas concluídas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={habitosData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {habitosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {habitosData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm text-gray-600">{entry.name}: {entry.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Próximas Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks?.filter(task => !task.completed)
                .slice(0, 3)
                .map(task => (
                  <div key={task.id} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{task.title}</span>
                  </div>
                )) || (
                  <span className="text-sm text-gray-500">Nenhuma tarefa pendente</span>
                )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Receitas</span>
                <span className="text-sm font-medium text-green-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(income)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Despesas</span>
                <span className="text-sm font-medium text-red-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expenses)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Saldo</span>
                <span className="text-sm font-medium text-blue-500">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(balance)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Desafios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {challenges?.slice(0, 3).map(challenge => (
                <div key={challenge.id} className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{challenge.title}</span>
                </div>
              )) || (
                <span className="text-sm text-gray-500">Nenhum desafio ativo</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardTab;
