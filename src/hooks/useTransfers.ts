import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface TransferData {
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  amount: number;
  description: string;
  date: Date;
}

export const useTransfers = () => {
  const validateTransfer = (data: TransferData): string | null => {
    if (data.fromAccountId === data.toAccountId) {
      return "As contas de origem e destino devem ser diferentes";
    }
    
    if (data.amount <= 0) {
      return "O valor deve ser maior que zero";
    }
    
    return null;
  };

  const createTransfer = async (data: TransferData) => {
    try {
      // Validate transfer
      const validationError = validateTransfer(data);
      if (validationError) {
        toast({
          title: "Erro de validação",
          description: validationError,
          variant: "destructive",
        });
        return { success: false, error: validationError };
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Generate unique transfer ID to link both transactions
      const transferId = crypto.randomUUID();
      const dateStr = data.date.toISOString().split('T')[0];

      // Create withdrawal transaction (negative amount from source account)
      const withdrawal = {
        user_id: user.id,
        bank_account_id: data.fromAccountId,
        amount: -Math.abs(data.amount),
        description: `Transferência para ${data.toAccountName}`,
        received_from: data.toAccountName,
        category: "transfer",
        payment_type: "transfer",
        is_paid: true,
        is_transfer: true,
        transfer_id: transferId,
        transfer_destination_account_id: data.toAccountId,
        date: dateStr,
        recurring: false,
      };

      // Create deposit transaction (positive amount to destination account)
      const deposit = {
        user_id: user.id,
        bank_account_id: data.toAccountId,
        amount: Math.abs(data.amount),
        description: `Transferência de ${data.fromAccountName}`,
        received_from: data.fromAccountName,
        category: "transfer",
        payment_type: "transfer",
        is_paid: true,
        is_transfer: true,
        transfer_id: transferId,
        transfer_destination_account_id: data.fromAccountId,
        date: dateStr,
        recurring: false,
      };

      // Insert both transactions atomically
      const { error } = await supabase
        .from('transactions')
        .insert([withdrawal, deposit]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Transferência realizada com sucesso!",
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao criar transferência:', error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar a transferência.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  const getTransferHistory = async (accountId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_transfer', true)
        .order('date', { ascending: false });

      if (accountId) {
        query = query.eq('bank_account_id', accountId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Erro ao buscar histórico de transferências:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de transferências.",
        variant: "destructive",
      });
      return [];
    }
  };

  const cancelTransfer = async (transferId: string) => {
    try {
      // Delete both transactions with the same transfer_id
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('transfer_id', transferId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Transferência cancelada com sucesso!",
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao cancelar transferência:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a transferência.",
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return {
    createTransfer,
    getTransferHistory,
    cancelTransfer,
    validateTransfer,
  };
};
