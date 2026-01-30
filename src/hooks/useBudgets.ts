import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Budget, BudgetItem, NewBudget } from "@/components/budget/types";

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Erro ao carregar orçamentos');
        throw error;
      }

      const formattedBudgets = data?.map(budget => ({
        ...budget,
        items: Array.isArray(budget.items) ? budget.items as unknown as BudgetItem[] : []
      })) || [];

      setBudgets(formattedBudgets);
    } catch (error: any) {
      console.error('Erro ao buscar orçamentos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const createBudget = async (newBudget: Omit<NewBudget, 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (newBudget.items.length === 0) {
        toast.error('Adicione pelo menos um item ao orçamento');
        return null;
      }

      const budgetToAdd: NewBudget = {
        ...newBudget,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          ...budgetToAdd,
          items: budgetToAdd.items as unknown as any
        }])
        .select()
        .single();

      if (error) {
        toast.error('Erro ao criar orçamento');
        throw error;
      }

      const createdBudget = {
        ...data,
        items: Array.isArray(data.items) ? data.items as unknown as BudgetItem[] : []
      };

      setBudgets(prev => [createdBudget, ...prev]);
      toast.success('Orçamento criado com sucesso!');
      return createdBudget;
    } catch (error: any) {
      console.error('Erro ao criar orçamento:', error);
      return null;
    }
  };

  const updateBudget = async (id: string, updates: Partial<Omit<NewBudget, 'user_id'>>) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .update({
          ...updates,
          items: updates.items as unknown as any
        })
        .eq('id', id);

      if (error) {
        toast.error('Erro ao atualizar orçamento');
        throw error;
      }

      setBudgets(prev => prev.map(budget => 
        budget.id === id 
          ? { ...budget, ...updates } 
          : budget
      ));

      toast.success('Orçamento atualizado com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar orçamento:', error);
      return false;
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Erro ao deletar orçamento');
        throw error;
      }

      setBudgets(prev => prev.filter(budget => budget.id !== id));
      toast.success('Orçamento removido com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Erro ao deletar orçamento:', error);
      return false;
    }
  };

  const duplicateBudget = async (budget: Budget) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const duplicatedItems = budget.items.map(item => ({
        ...item,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      }));

      const duplicatedBudget: NewBudget = {
        client_name: budget.client_name,
        client_email: budget.client_email,
        client_phone: budget.client_phone,
        client_document: budget.client_document,
        client_address: budget.client_address,
        company_name: budget.company_name,
        company_document: budget.company_document,
        company_address: budget.company_address,
        company_phone: budget.company_phone,
        company_logo: budget.company_logo,
        items: duplicatedItems,
        total_amount: budget.total_amount,
        notes: budget.notes,
        delivery_time: budget.delivery_time,
        payment_terms: budget.payment_terms,
        valid_until: budget.valid_until,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          ...duplicatedBudget,
          items: duplicatedBudget.items as unknown as any
        }])
        .select()
        .single();

      if (error) {
        toast.error('Erro ao duplicar orçamento');
        throw error;
      }

      const result = {
        ...data,
        items: Array.isArray(data.items) ? data.items as unknown as BudgetItem[] : []
      };

      setBudgets(prev => [result, ...prev]);
      toast.success('Orçamento duplicado com sucesso!');
      return result;
    } catch (error: any) {
      console.error('Erro ao duplicar orçamento:', error);
      return null;
    }
  };

  // Statistics
  const stats = {
    total: budgets.length,
    totalValue: budgets.reduce((sum, b) => sum + b.total_amount, 0),
    thisMonth: budgets.filter(b => {
      const date = new Date(b.created_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
    thisMonthValue: budgets.filter(b => {
      const date = new Date(b.created_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).reduce((sum, b) => sum + b.total_amount, 0),
    averageValue: budgets.length > 0 
      ? budgets.reduce((sum, b) => sum + b.total_amount, 0) / budgets.length 
      : 0
  };

  return {
    budgets,
    isLoading,
    stats,
    createBudget,
    updateBudget,
    deleteBudget,
    duplicateBudget,
    refetch: fetchBudgets
  };
}
