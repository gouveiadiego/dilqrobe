
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Client {
  id: string;
  name: string;
  email: string; // We're keeping this as required to match the database schema
  document?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  stripe_customer_id?: string;
}

export interface ServiceSummary {
  paidCount: number;
  pendingCount: number;
  canceledCount: number;
  paidAmount: number;
  pendingAmount: number;
  canceledAmount: number;
}

export const useClients = () => {
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) {
        toast.error('Erro ao carregar clientes');
        throw error;
      }

      return data as Client[];
    }
  });

  const getClientServiceSummary = async (clientId: string): Promise<ServiceSummary> => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('payment_status, amount')
        .eq('client_id', clientId);

      if (error) {
        console.error('Erro ao carregar resumo de serviços:', error);
        return {
          paidCount: 0,
          pendingCount: 0,
          canceledCount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          canceledAmount: 0
        };
      }

      const summary: ServiceSummary = {
        paidCount: 0,
        pendingCount: 0,
        canceledCount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        canceledAmount: 0
      };

      data.forEach(service => {
        switch (service.payment_status) {
          case 'paid':
            summary.paidCount++;
            summary.paidAmount += service.amount || 0;
            break;
          case 'pending':
            summary.pendingCount++;
            summary.pendingAmount += service.amount || 0;
            break;
          case 'canceled':
            summary.canceledCount++;
            summary.canceledAmount += service.amount || 0;
            break;
        }
      });

      return summary;
    } catch (error) {
      console.error('Erro ao calcular resumo:', error);
      return {
        paidCount: 0,
        pendingCount: 0,
        canceledCount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        canceledAmount: 0
      };
    }
  };

  const addClientMutation = useMutation({
    mutationFn: async (newClient: Omit<Client, "id" | "created_at">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Garantir que name esteja presente, os outros campos são opcionais
      if (!newClient.name) {
        throw new Error('Nome do cliente é obrigatório');
      }

      // Fornecer um valor padrão para email se estiver vazio, para satisfazer a validação do banco de dados
      const clientToInsert = {
        ...newClient,
        user_id: user.id,
        email: newClient.email || `${newClient.name.toLowerCase().replace(/\s+/g, '.')}@exemplo.com` // Gera um email fictício baseado no nome se não fornecido
      };

      const { data, error } = await supabase
        .from('clients')
        .insert([clientToInsert])
        .select()
        .single();

      if (error) {
        toast.error('Erro ao adicionar cliente');
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente adicionado com sucesso');
    }
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Client> }) => {
      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id);

      if (error) {
        toast.error('Erro ao atualizar cliente');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente atualizado com sucesso');
    }
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Erro ao deletar cliente');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente removido com sucesso');
    }
  });

  return {
    clients,
    isLoading,
    addClient: addClientMutation.mutate,
    updateClient: updateClientMutation.mutate,
    deleteClient: deleteClientMutation.mutate,
    getClientServiceSummary
  };
};
