
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Target, Calendar } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useTransactions } from "@/hooks/useTransactions";
import { endOfMonth, format, startOfMonth } from "date-fns";

export const MonthlyProgress = () => {
  const { tasks } = useTasks();
  const { transactions } = useTransactions();
  const [progress, setProgress] = useState({
    tasks: { total: 0, completed: 0, percent: 0 },
    income: { target: 5000, current: 0, percent: 0 },
    expenses: { budget: 3000, current: 0, percent: 0 }
  });
  
  useEffect(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    
    // Calculate task progress
    const monthlyTasks = tasks.filter(task => {
      if (!task.created_at) return false;
      const taskDate = new Date(task.created_at);
      return taskDate >= monthStart && taskDate <= monthEnd;
    });
    
    const totalTasks = monthlyTasks.length;
    const completedTasks = monthlyTasks.filter(task => task.completed).length;
    const taskPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Calculate financial progress
    const monthlyTransactions = transactions.filter(tx => {
      if (!tx.date) return false;
      const txDate = new Date(tx.date);
      return txDate >= monthStart && txDate <= monthEnd;
    });
    
    const monthlyIncome = monthlyTransactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
      
    const monthlyExpenses = monthlyTransactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);
    
    // Calculate percentages (cap at 100%)
    const incomePercent = Math.min(Math.round((monthlyIncome / progress.income.target) * 100), 100);
    const expensesPercent = Math.min(Math.round((monthlyExpenses / progress.expenses.budget) * 100), 100);
    
    setProgress({
      tasks: { total: totalTasks, completed: completedTasks, percent: taskPercent },
      income: { target: progress.income.target, current: monthlyIncome, percent: incomePercent },
      expenses: { budget: progress.expenses.budget, current: monthlyExpenses, percent: expensesPercent }
    });
  }, [tasks, transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-dilq-accent/10 dark-hover-glow h-full">
      <CardHeader className="bg-gradient-to-r from-teal-50/50 to-green-100/50 dark:from-teal-900/20 dark:to-green-900/20 pb-3 border-b dark:border-gray-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Progresso do Mês</CardTitle>
          <div className="h-7 w-7 rounded-lg bg-white/80 dark:bg-gray-800/80 shadow-sm flex items-center justify-center">
            <Calendar className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Tarefas Concluídas</span>
              </div>
              <span className="text-sm font-semibold">{progress.tasks.completed}/{progress.tasks.total}</span>
            </div>
            <div className="space-y-1">
              <Progress value={progress.tasks.percent} className="h-2" />
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>{progress.tasks.percent}% concluído</span>
                <span>{format(new Date(), "MMMM/yyyy")}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Meta de Receitas</span>
              </div>
              <span className="text-sm font-semibold">{formatCurrency(progress.income.current)}/{formatCurrency(progress.income.target)}</span>
            </div>
            <div className="space-y-1">
              <Progress value={progress.income.percent} className="h-2" />
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>{progress.income.percent}% da meta</span>
                <span>{format(new Date(), "MMMM/yyyy")}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Orçamento de Despesas</span>
              </div>
              <span className="text-sm font-semibold">{formatCurrency(progress.expenses.current)}/{formatCurrency(progress.expenses.budget)}</span>
            </div>
            <div className="space-y-1">
              <Progress 
                value={progress.expenses.percent} 
                className={`h-2 ${progress.expenses.percent >= 90 ? 'bg-red-200 dark:bg-red-900/30' : ''}`} 
              />
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>{progress.expenses.percent}% utilizado</span>
                <span>{format(new Date(), "MMMM/yyyy")}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
