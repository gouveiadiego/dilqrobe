
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleApiError, handleSuccess } from "@/utils/errorHandler";
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
        throw error;
      }

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
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      handleSuccess('Reunião agendada com sucesso');
    },
    onError: (error) => {
      handleApiError(error, 'Erro ao adicionar reunião');
    }
  });

  const updateMeeting = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<NewMeeting> }) => {
      const { error } = await supabase
        .from('client_meetings' as any)
        .update(updates)
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      handleSuccess('Reunião atualizada com sucesso');
    },
    onError: (error) => {
      handleApiError(error, 'Erro ao atualizar reunião');
    }
  });

  const deleteMeeting = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('client_meetings' as any)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      handleSuccess('Reunião removida com sucesso');
    },
    onError: (error) => {
      handleApiError(error, 'Erro ao deletar reunião');
    }
  });

  const updateMeetingStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: Meeting['status'] }) => {
      const { error } = await supabase
        .from('client_meetings' as any)
        .update({ status })
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      handleSuccess('Status da reunião atualizado');
    },
    onError: (error) => {
      handleApiError(error, 'Erro ao atualizar status da reunião');
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
