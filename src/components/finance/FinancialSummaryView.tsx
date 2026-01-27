
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  TrendingUpIcon, 
  Clock, 
  DollarSign, 
  CreditCard, 
  PiggyBank,
  ArrowRight
} from "lucide-react";
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
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
  ComposedChart
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChartData {
  date: string;
  income: number;
  expenses: number;
}

interface FinancialSummaryViewProps {
  income: number;
  expenses: number;
  balance: number;
  pending: number;
  chartData: ChartData[];
}

const COLORS = ["#10b981", "#ef4444", "#f59e0b", "#3b82f6"];

export const FinancialSummaryView = ({ 
  income, 
  expenses, 
  balance, 
  pending,
  chartData
}: FinancialSummaryViewProps) => {
  
  // Calculate distribution data for pie chart
  const pieData = [
    { name: 'Receitas', value: income > 0 ? income : 0 },
    { name: 'Despesas', value: expenses > 0 ? expenses : 0 },
    { name: 'Pendentes', value: pending > 0 ? pending : 0 }
  ];

  // Format date for charts and ensure chronological order
  const formattedChartData = [...chartData]
    .map(item => ({
      ...item,
      formattedDate: new Date(item.date.split('/').reverse().join('-')).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      }),
      // Add balance calculation to chart data
      balance: item.income - item.expenses
    }))
    .sort((a, b) => {
      const dateA = new Date(a.date.split('/').reverse().join('-'));
      const dateB = new Date(b.date.split('/').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    });

  // Calculate growth rates for metrics compared to first data point (if available)
  const calculateGrowthRate = () => {
    if (formattedChartData.length < 2) return { income: 0, expenses: 0, balance: 0 };
    
    const first = formattedChartData[0];
    const last = formattedChartData[formattedChartData.length - 1];
    
    const incomeGrowth = first.income > 0 ? ((last.income - first.income) / first.income) * 100 : 0;
    const expenseGrowth = first.expenses > 0 ? ((last.expenses - first.expenses) / first.expenses) * 100 : 0;
    const balanceGrowth = first.balance > 0 ? ((last.balance - first.balance) / first.balance) * 100 : 0;
    
    return {
      income: Math.round(incomeGrowth),
      expenses: Math.round(expenseGrowth),
      balance: Math.round(balanceGrowth)
    };
  };
  
  const growthRates = calculateGrowthRate();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="overflow-hidden border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {formatCurrency(income)}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Total de receitas no período
              </p>
              {growthRates.income !== 0 && (
                <div className={`flex items-center text-xs ${growthRates.income > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {growthRates.income > 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                  {Math.abs(growthRates.income)}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <CreditCard className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">
              {formatCurrency(expenses)}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Total de despesas no período
              </p>
              {growthRates.expenses !== 0 && (
                <div className={`flex items-center text-xs ${growthRates.expenses > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {growthRates.expenses > 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                  {Math.abs(growthRates.expenses)}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balanço Mensal</CardTitle>
            <PiggyBank className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {formatCurrency(balance)}
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                Receitas - Despesas do mês
              </p>
              {growthRates.balance !== 0 && (
                <div className={`flex items-center text-xs ${growthRates.balance > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {growthRates.balance > 0 ? <ArrowUpIcon className="h-3 w-3 mr-1" /> : <ArrowDownIcon className="h-3 w-3 mr-1" />}
                  {Math.abs(growthRates.balance)}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {formatCurrency(pending)}
            </div>
            <div className="flex items-center mt-1">
              <p className="text-xs text-muted-foreground">
                Pagamentos pendentes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Fluxo Financeiro</CardTitle>
              <div className="flex space-x-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-muted-foreground">Receitas</span>
                <div className="h-3 w-3 rounded-full bg-rose-500 ml-2"></div>
                <span className="text-xs text-muted-foreground">Despesas</span>
                <div className="h-3 w-3 rounded-full bg-blue-500 ml-2"></div>
                <span className="text-xs text-muted-foreground">Saldo</span>
              </div>
            </div>
            <CardDescription>
              Fluxo de caixa mensal
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={formattedChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="formattedDate" 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickFormatter={(value) => `${value >= 1000 ? `${value / 1000}k` : value}`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), null]}
                  labelFormatter={(label) => `Data: ${label}`}
                  contentStyle={{ borderRadius: '6px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  name="Saldo" 
                  stroke="#3b82f6" 
                  dot={{ stroke: '#3b82f6', strokeWidth: 2, r: 4, fill: 'white' }}
                  activeDot={{ stroke: '#3b82f6', strokeWidth: 2, r: 6, fill: 'white' }}
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle>Distribuição Financeira</CardTitle>
            <CardDescription>
              Composição do fluxo financeiro
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), null]}
                  contentStyle={{ borderRadius: '6px', border: '1px solid #e5e7eb' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  iconType="circle"
                  iconSize={10}
                  layout="horizontal"
                  formatter={(value, entry, index) => (
                    <span style={{ color: '#64748b' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Tendência de Receitas e Despesas</CardTitle>
          <CardDescription>
            Evolução do fluxo financeiro ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `${value >= 1000 ? `${value / 1000}k` : value}`}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), null]}
                labelFormatter={(label) => `Data: ${label}`}
                contentStyle={{ borderRadius: '6px', border: '1px solid #e5e7eb' }}
              />
              <Area 
                type="monotone" 
                dataKey="income" 
                name="Receitas" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorIncome)" 
              />
              <Area 
                type="monotone" 
                dataKey="expenses" 
                name="Despesas" 
                stroke="#ef4444" 
                fillOpacity={1} 
                fill="url(#colorExpenses)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
