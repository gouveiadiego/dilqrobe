
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  received_from: string;
  category: string;
  amount: number;
  payment_type: string;
  is_paid: boolean;
  recurring?: boolean;
  recurring_day?: number;
}

interface UseTransactionsProps {
  currentDate: Date;
}

export const useTransactions = ({ currentDate }: UseTransactionsProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const formatMonth = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      month: 'short',
      year: 'numeric'
    }).replace('.', '').toUpperCase();
  };

  const fetchTransactions = async () => {
    try {
      console.log("Fetching transactions for:", formatMonth(currentDate));
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          id,
          date,
          description,
          received_from,
          category,
          amount,
          payment_type,
          is_paid,
          recurring,
          recurring_day
        `)
        .gte("date", startOfMonth.toISOString())
        .lte("date", endOfMonth.toISOString())
        .order("date", { ascending: false });
        
      if (error) throw error;
      
      console.log("Fetched transactions:", data);
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Erro ao carregar transações");
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on selected filter and search query
  useEffect(() => {
    filterTransactions();
  }, [transactions, selectedFilter, searchQuery]);

  const filterTransactions = () => {
    let filtered = [...transactions];
    
    if (selectedFilter !== "all") {
      filtered = filtered.filter(transaction => {
        switch (selectedFilter) {
          case "recebimentos":
            return transaction.amount > 0;
          case "despesas-fixas":
            return transaction.amount < 0 && transaction.category === "fixed";
          case "despesas-variaveis":
            return transaction.amount < 0 && transaction.category === "variable";
          case "pessoas":
            return transaction.category === "people";
          case "impostos":
            return transaction.category === "taxes";
          case "transferencias":
            return transaction.category === "transfer";
          default:
            return true;
        }
      });
    }
    
    if (searchQuery) {
      filtered = filtered.filter(transaction => 
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
        transaction.received_from.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredTransactions(filtered);
  };

  // Create transaction summaries for the financial dashboard
  const summaries = useMemo(() => {
    const income = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const balance = income - expenses;
    
    const pending = transactions
      .filter((t) => !t.is_paid)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return { income, expenses, balance, pending };
  }, [transactions]);

  // Get chart data for visualizations
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

  // Handle transaction actions
  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      toast.success("Transação excluída com sucesso");
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error("Erro ao excluir transação");
    }
  };

  const togglePaymentStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ is_paid: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      toast.success("Status de pagamento atualizado");
      fetchTransactions();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error("Erro ao atualizar status de pagamento");
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentDate]);

  return {
    transactions,
    filteredTransactions,
    loading,
    selectedFilter,
    setSelectedFilter,
    searchQuery, 
    setSearchQuery,
    summaries,
    chartData,
    fetchTransactions,
    handleDeleteTransaction,
    togglePaymentStatus,
    formatMonth
  };
};
