
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Client } from "@/hooks/useClients";

export interface Meeting {
  id: string;
  user_id: string;
  client_id?: string | null;
  title: string;
  description?: string | null;
  meeting_date: string;
  duration: number;
  location?: string | null;
  status: 'scheduled' | 'completed' | 'canceled';
  notes?: string | null;
  created_at: string;
  updated_at: string;
  client?: Client;
}

export type NewMeeting = Omit<Meeting, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'client'>;

export const useMeetings = () => {
  const queryClient = useQueryClient();

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('client_meetings' as any)
        .select(`
          *,
          client:clients(*)
        `)
        .eq('user_id', user.id)
        .order('meeting_date', { ascending: true });

      if (error) {
        toast.error('Erro ao carregar reuniões');
        throw error;
      }

      // Cast the data to the Meeting type after converting it to unknown first
      return (data as unknown) as Meeting[];
    }
  });

  const addMeeting = useMutation({
    mutationFn: async (newMeeting: NewMeeting) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('client_meetings' as any)
        .insert({
          ...newMeeting,
          user_id: user.id
        })
        .select()
        .single();

      if (error) {
        toast.error('Erro ao adicionar reunião');
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Reunião agendada com sucesso');
    }
  });

  const updateMeeting = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<NewMeeting> }) => {
      const { error } = await supabase
        .from('client_meetings' as any)
        .update(updates)
        .eq('id', id);

      if (error) {
        toast.error('Erro ao atualizar reunião');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Reunião atualizada com sucesso');
    }
  });

  const deleteMeeting = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('client_meetings' as any)
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Erro ao deletar reunião');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Reunião removida com sucesso');
    }
  });

  const updateMeetingStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: Meeting['status'] }) => {
      const { error } = await supabase
        .from('client_meetings' as any)
        .update({ status })
        .eq('id', id);

      if (error) {
        toast.error('Erro ao atualizar status da reunião');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Status da reunião atualizado');
    }
  });

  return {
    meetings,
    isLoading,
    addMeeting: addMeeting.mutate,
    updateMeeting: updateMeeting.mutate,
    deleteMeeting: deleteMeeting.mutate,
    updateMeetingStatus: updateMeetingStatus.mutate
  };
};
