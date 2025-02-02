import React from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, TrendingUp, Users, BookText, Wallet, Target, CheckCircle2, Calendar } from "lucide-react";

const activityData = [
  { name: "Jan", tarefas: 40, financeiro: 30, diarios: 20 },
  { name: "Fev", tarefas: 30, financeiro: 25, diarios: 15 },
  { name: "Mar", tarefas: 20, financeiro: 35, diarios: 25 },
  { name: "Abr", tarefas: 27, financeiro: 40, diarios: 30 },
  { name: "Mai", tarefas: 18, financeiro: 30, diarios: 22 },
  { name: "Jun", tarefas: 23, financeiro: 28, diarios: 28 },
  { name: "Jul", tarefas: 34, financeiro: 45, diarios: 35 },
];

const habitosData = [
  { name: "Concluídos", value: 75, color: "#10b981" },
  { name: "Pendentes", value: 25, color: "#f43f5e" },
];

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
  return (
    <div className="space-y-6">
      {/* Primeira linha - Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-green-500">+12% em relação ao mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 12.580</div>
            <p className="text-xs text-green-500">+8% em relação ao mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas no Diário</CardTitle>
            <BookText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-green-500">+15% em relação ao mês anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hábitos Ativos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-green-500">+2 novos hábitos</p>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha - Gráficos principais */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividades por Área</CardTitle>
            <CardDescription>Visão geral das atividades mensais</CardDescription>
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
                  <Bar dataKey="diarios" name="Diários" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progresso dos Hábitos</CardTitle>
            <CardDescription>Distribuição de hábitos concluídos</CardDescription>
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

      {/* Terceira linha - Cards de informações detalhadas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Próximas Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Reunião de planejamento</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Revisão de documentos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-red-500" />
                <span className="text-sm">Entrega do relatório</span>
              </div>
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
                <span className="text-sm font-medium text-green-500">R$ 8.500</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Despesas</span>
                <span className="text-sm font-medium text-red-500">R$ 4.200</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Saldo</span>
                <span className="text-sm font-medium text-blue-500">R$ 4.300</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Últimas Reflexões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">Reflexão sobre objetivos</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">Gratidão diária</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">Planejamento semanal</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardTab;