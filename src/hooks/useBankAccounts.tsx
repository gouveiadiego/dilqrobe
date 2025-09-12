import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface BankAccount {
  id: string;
  user_id: string;
  bank_name: string;
  account_type: string;
  account_number?: string | null;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useBankAccounts = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Erro ao buscar contas bancárias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as contas bancárias.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createBankAccount = async (accountData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const { data, error } = await supabase
        .from('bank_accounts')
        .insert({
          ...accountData,
          user_id: user.id,
          current_balance: accountData.initial_balance
        })
        .select()
        .single();

      if (error) throw error;

      setBankAccounts(prev => [...prev, data]);
      
      toast({
        title: "Sucesso",
        description: "Conta bancária criada com sucesso!",
      });

      return data;
    } catch (error) {
      console.error('Erro ao criar conta bancária:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a conta bancária.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateBankAccount = async (id: string, updates: Partial<BankAccount>) => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setBankAccounts(prev => 
        prev.map(account => 
          account.id === id ? { ...account, ...data } : account
        )
      );

      toast({
        title: "Sucesso",
        description: "Conta bancária atualizada com sucesso!",
      });

      return data;
    } catch (error) {
      console.error('Erro ao atualizar conta bancária:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a conta bancária.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteBankAccount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setBankAccounts(prev => prev.filter(account => account.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Conta bancária removida com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao remover conta bancária:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a conta bancária.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getTotalBalance = () => {
    return bankAccounts.reduce((total, account) => total + Number(account.current_balance), 0);
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  return {
    bankAccounts,
    loading,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    fetchBankAccounts,
    getTotalBalance
  };
};