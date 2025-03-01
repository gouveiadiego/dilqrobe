
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, isSameDay, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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

// Define minimum date constant - no transactions before Feb 2025
const MINIMUM_ALLOWED_DATE = new Date(2025, 1, 1); // February 1, 2025

export const useTransactions = ({ currentDate }: UseTransactionsProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const formatMonth = (date: Date) => {
    return format(date, "MMMM 'de' yyyy", { locale: ptBR })
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  const fetchTransactions = async () => {
    try {
      // If selected month is before our minimum date, don't fetch any transactions
      if (currentDate < MINIMUM_ALLOWED_DATE) {
        console.log("Skipping fetch for dates before Feb 2025");
        setTransactions([]);
        setLoading(false);
        return;
      }
      
      console.log("Fetching transactions for:", formatMonth(currentDate));
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user found");
        setTransactions([]);
        setLoading(false);
        return;
      }
      
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
        .eq("user_id", user.id)
        .gte("date", start.toISOString())
        .lte("date", end.toISOString())
        .order("date", { ascending: false });
        
      if (error) throw error;
      
      console.log("Fetched transactions:", data);
      
      // Filter out any transactions with dates before our minimum date
      const filteredData = data?.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= MINIMUM_ALLOWED_DATE;
      }) || [];
      
      setTransactions(filteredData);
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
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(transaction => 
        transaction.description.toLowerCase().includes(query) || 
        transaction.received_from.toLowerCase().includes(query) ||
        transaction.payment_type.toLowerCase().includes(query) ||
        new Date(transaction.date).toLocaleDateString('pt-BR').includes(query) ||
        (transaction.amount.toString().includes(query))
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
    
    // Create all dates in the month for complete chart data
    const daysInMonth = Array.from(
      { length: endOfMonth(currentDate).getDate() },
      (_, i) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
        return format(date, 'yyyy-MM-dd');
      }
    );
    
    // Initialize with zero values for all days
    const initialData = daysInMonth.reduce((acc, dateStr) => {
      const displayDate = new Date(dateStr).toLocaleDateString('pt-BR');
      acc[displayDate] = { income: 0, expenses: 0 };
      return acc;
    }, {} as Record<string, { income: number; expenses: number }>);
    
    // Populate with actual transaction data
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const displayDate = date.toLocaleDateString('pt-BR');
      
      if (!initialData[displayDate]) {
        initialData[displayDate] = { income: 0, expenses: 0 };
      }
      
      if (transaction.amount > 0) {
        initialData[displayDate].income += transaction.amount;
      } else {
        initialData[displayDate].expenses += Math.abs(transaction.amount);
      }
    });

    // Convert to array and sort by date
    Object.entries(initialData).forEach(([date, values]) => {
      data.push({
        date,
        income: values.income,
        expenses: values.expenses,
      });
    });

    return data.sort((a, b) => {
      const [aDay, aMonth, aYear] = a.date.split('/').map(Number);
      const [bDay, bMonth, bYear] = b.date.split('/').map(Number);
      
      return new Date(aYear, aMonth - 1, aDay).getTime() - 
             new Date(bYear, bMonth - 1, bDay).getTime();
    });
  }, [transactions, currentDate]);

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

  const createRecurringTransactions = async () => {
    try {
      // If selected month is before our minimum date, don't create recurring transactions
      if (currentDate < MINIMUM_ALLOWED_DATE) {
        console.log("Skipping recurring transaction creation for dates before Feb 2025");
        return;
      }
      
      // Get user id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log("Checking for recurring transactions to create for:", formatMonth(currentDate));

      // Get recurring transactions from previous months
      const { data: recurringTransactions, error: fetchError } = await supabase
        .from("transactions")
        .select("*")
        .eq("recurring", true)
        .eq("user_id", user.id)
        .not("recurring_day", "is", null);

      if (fetchError) throw fetchError;
      if (!recurringTransactions || recurringTransactions.length === 0) {
        console.log("No recurring transactions found");
        return;
      }

      // Check if we already have transactions for this month
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // Fetch all transactions for the current month to check for duplicates
      const startDate = new Date(currentYear, currentMonth, 1);
      const endDate = new Date(currentYear, currentMonth + 1, 0);
      
      const { data: existingMonthTransactions, error: monthError } = await supabase
        .from("transactions")
        .select("description, received_from, category, payment_type, date")
        .eq("user_id", user.id)
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString());
        
      if (monthError) throw monthError;
      
      // Create a set of transaction keys that already exist in this month
      const existingKeys = new Set();
      
      existingMonthTransactions?.forEach(transaction => {
        const key = `${transaction.description}|${transaction.received_from}|${transaction.category}|${transaction.payment_type}`;
        existingKeys.add(key);
      });

      console.log(`Found ${existingKeys.size} existing transactions for this month`);

      // Filter transactions that need to be created for the current month
      const transactionsToCreate = recurringTransactions.filter(transaction => {
        // Skip if the recurring day is not set
        if (!transaction.recurring_day) return false;

        // Create a unique identifier for this transaction
        const key = `${transaction.description}|${transaction.received_from}|${transaction.category}|${transaction.payment_type}`;
        
        // Only create if this transaction doesn't already exist in the current month
        return !existingKeys.has(key);
      });

      if (transactionsToCreate.length === 0) {
        console.log("No new recurring transactions needed for this month");
        return;
      }

      console.log(`Creating ${transactionsToCreate.length} recurring transactions for this month`);

      // Create the recurring transactions for this month
      const newTransactions = transactionsToCreate.map(transaction => {
        // Create date for the recurring day in current month
        const newDate = new Date(currentYear, currentMonth, transaction.recurring_day);
        
        // Ensure date is valid (handle edge cases like Feb 30)
        if (newDate.getMonth() !== currentMonth) {
          newDate.setDate(0); // Last day of previous month
        }
        
        return {
          date: newDate.toISOString().split('T')[0],
          description: transaction.description,
          received_from: transaction.received_from,
          amount: transaction.amount,
          category: transaction.category,
          payment_type: transaction.payment_type,
          is_paid: false, // Always set to false (pending) for new months
          recurring: true,
          recurring_day: transaction.recurring_day,
          user_id: user.id
        };
      });

      if (newTransactions.length > 0) {
        const { error: insertError } = await supabase
          .from("transactions")
          .insert(newTransactions);

        if (insertError) throw insertError;
        
        console.log(`Created ${newTransactions.length} recurring transactions for ${formatMonth(currentDate)}`);
        // Refresh transactions after adding recurring ones
        fetchTransactions();
      }
    } catch (error) {
      console.error("Error creating recurring transactions:", error);
      toast.error("Erro ao criar transações recorrentes");
    }
  };

  useEffect(() => {
    setLoading(true);
    // Clear existing transactions before fetching new ones
    setTransactions([]);
    
    // Don't fetch data for dates before Feb 2025
    if (currentDate < MINIMUM_ALLOWED_DATE) {
      setLoading(false);
      return;
    }
    
    fetchTransactions();
    createRecurringTransactions();
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
