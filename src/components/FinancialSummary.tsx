import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, TrendingUpIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
  id: string;
  date: string;
  description: string;
  received_from: string;
  category: string;
  amount: number;
  payment_type: string;
  is_paid: boolean;
}

interface FinancialSummaryProps {
  transactions: Transaction[];
}

export const FinancialSummary = ({ transactions }: FinancialSummaryProps) => {
  const summary = useMemo(() => {
    const income = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const balance = income - expenses;

    return {
      income,
      expenses,
      balance,
    };
  }, [transactions]);

  const chartData = useMemo(() => {
    const data: { date: string; income: number; expenses: number }[] = [];
    const groupedByDate = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date).toLocaleDateString('pt-BR');
      if (!acc[date]) {
        acc[date] = { income: 0, expenses: 0 };
      }
      if (transaction.amount > 0) {
        acc[date].income += transaction.amount;
      } else {
        acc[date].expenses += Math.abs(transaction.amount);
      }
      return acc;
    }, {} as Record<string, { income: number; expenses: number }>);

    Object.entries(groupedByDate).forEach(([date, values]) => {
      data.push({
        date,
        income: values.income,
        expenses: values.expenses,
      });
    });

    return data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {formatCurrency(summary.income)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de receitas no período
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">
              {formatCurrency(summary.expenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de despesas no período
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {formatCurrency(summary.balance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo do período
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receitas vs Despesas</CardTitle>
            <CardDescription>
              Comparativo mensal de receitas e despesas
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="income" name="Receitas" fill="#10b981" />
                <Bar dataKey="expenses" name="Despesas" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fluxo de Caixa</CardTitle>
            <CardDescription>
              Evolução do saldo ao longo do mês
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  name="Receitas"
                  stroke="#10b981" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  name="Despesas"
                  stroke="#ef4444" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};