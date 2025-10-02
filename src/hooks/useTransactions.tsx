
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
  recurrence_type?: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
}

interface UseTransactionsProps {
  currentDate: Date;
}

// Removendo a restrição de data mínima
// const MINIMUM_ALLOWED_DATE = new Date(2025, 1, 1); // February 1, 2025

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
      // Removendo a verificação de data mínima
      // if (currentDate < MINIMUM_ALLOWED_DATE) {
      //   console.log("Skipping fetch for dates before Feb 2025");
      //   setTransactions([]);
      //   setLoading(false);
      //   return;
      // }
      
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
      
      // We'll fetch all transactions for the month
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
          recurring_day,
          recurrence_type
        `)
        .eq("user_id", user.id)
        .gte("date", start.toISOString())
        .lte("date", end.toISOString())
        .order("date", { ascending: false });
        
      if (error) throw error;
      
      console.log("Fetched transactions:", data);
      
      // Remove potential duplicates based on description, date, amount, and payment_type
      const uniqueTransactions = removeDuplicateTransactions(data || []) as Transaction[];
      console.log(`Removed ${(data || []).length - uniqueTransactions.length} duplicate transactions`);
      
      setTransactions(uniqueTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Erro ao carregar transações");
    } finally {
      setLoading(false);
    }
  };

  // New function to remove duplicate transactions
  const removeDuplicateTransactions = (transactions: any[]): Transaction[] => {
    const seen = new Map();
    return transactions.filter(transaction => {
      // Create a unique key for each transaction
      const key = `${transaction.date}|${transaction.description}|${transaction.received_from}|${transaction.payment_type}|${transaction.amount}`;
      
      // If we've seen this key before, filter it out
      if (seen.has(key)) {
        return false;
      }
      
      // Otherwise, mark this key as seen and keep the transaction
      seen.set(key, true);
      return true;
    });
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
        .select("description, received_from, category, payment_type, date, amount")
        .eq("user_id", user.id)
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString());
        
      if (monthError) throw monthError;
      
      // Create a set of transaction keys that already exist in this month
      const existingKeys = new Set();
      
      existingMonthTransactions?.forEach(transaction => {
        const key = `${transaction.date}|${transaction.description}|${transaction.received_from}|${transaction.payment_type}|${transaction.amount}`;
        existingKeys.add(key);
      });

      console.log(`Found ${existingKeys.size} existing transactions for this month`);

      // Helper function to check if transaction should be created this month based on recurrence type
      const shouldCreateThisMonth = (transaction: any, originalDate: Date): boolean => {
        const recurrenceType = transaction.recurrence_type || 'monthly';
        const monthsDiff = (currentYear - originalDate.getFullYear()) * 12 + (currentMonth - originalDate.getMonth());
        
        switch (recurrenceType) {
          case 'monthly':
            return true; // Create every month
          case 'quarterly':
            return monthsDiff % 3 === 0; // Create every 3 months
          case 'semiannual':
            return monthsDiff % 6 === 0; // Create every 6 months
          case 'annual':
            return monthsDiff % 12 === 0; // Create every 12 months
          default:
            return true;
        }
      };

      // Filter transactions that need to be created for the current month
      const transactionsToCreate = recurringTransactions.filter(transaction => {
        // Skip if the recurring day is not set
        if (!transaction.recurring_day) return false;

        // Get original transaction date
        const originalDate = new Date(transaction.date);
        
        // Check if this transaction should be created based on recurrence type
        if (!shouldCreateThisMonth(transaction, originalDate)) return false;

        // Create a new date for this month with the recurring day
        const newDate = new Date(currentYear, currentMonth, transaction.recurring_day);
        
        // Ensure date is valid (handle edge cases like Feb 30)
        if (newDate.getMonth() !== currentMonth) {
          newDate.setDate(0); // Last day of previous month
        }
        
        // Format date to ISO for key creation
        const newDateStr = newDate.toISOString().split('T')[0];
        
        // Create a unique identifier for this transaction
        const key = `${newDateStr}|${transaction.description}|${transaction.received_from}|${transaction.payment_type}|${transaction.amount}`;
        
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
          recurrence_type: transaction.recurrence_type || 'monthly',
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
    
    // Removendo a verificação de data mínima
    // if (currentDate < MINIMUM_ALLOWED_DATE) {
    //   setLoading(false);
    //   return;
    // }
    
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
