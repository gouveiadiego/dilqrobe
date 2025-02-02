import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { Activity, TrendingUp, BookOpen, ListChecks } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DashboardTab = () => {
  // Fetch transactions data
  const { data: transactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate financial metrics
  const totalIncome = transactions?.reduce((acc, curr) => 
    curr.amount > 0 ? acc + Number(curr.amount) : acc, 0
  ) || 0;

  const totalExpenses = transactions?.reduce((acc, curr) => 
    curr.amount < 0 ? acc + Math.abs(Number(curr.amount)) : acc, 0
  ) || 0;

  const balance = totalIncome - totalExpenses;

  // Mock data for demonstration
  const activityData = [
    { name: "Seg", tasks: 4, habits: 3, journals: 1 },
    { name: "Ter", tasks: 6, habits: 4, journals: 1 },
    { name: "Qua", tasks: 3, habits: 2, journals: 1 },
    { name: "Qui", tasks: 5, habits: 4, journals: 0 },
    { name: "Sex", tasks: 7, habits: 5, journals: 1 },
    { name: "Sab", tasks: 2, habits: 3, journals: 1 },
    { name: "Dom", tasks: 1, habits: 2, journals: 1 },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-white border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Activity className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tarefas Pendentes</p>
              <p className="text-2xl font-semibold text-gray-900">12</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Saldo</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(balance)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <BookOpen className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Diários Escritos</p>
              <p className="text-2xl font-semibold text-gray-900">15</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <ListChecks className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hábitos Completos</p>
              <p className="text-2xl font-semibold text-gray-900">85%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card className="p-6 bg-white border shadow-sm">
        <h3 className="text-lg font-semibold mb-6 text-gray-900">Atividade Semanal</h3>
        <ChartContainer className="h-[300px]" config={{
          tasks: { color: "#9333ea" },
          habits: { color: "#eab308" },
          journals: { color: "#3b82f6" },
        }}>
          <BarChart data={activityData}>
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <ChartTooltip>
              <ChartTooltipContent />
            </ChartTooltip>
            <Bar dataKey="tasks" fill="#9333ea" radius={[4, 4, 0, 0]} />
            <Bar dataKey="habits" fill="#eab308" radius={[4, 4, 0, 0]} />
            <Bar dataKey="journals" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>
    </div>
  );
};

export default DashboardTab;