import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays } from 'date-fns';

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  water_ml: number;
  sleep_hours: number | null;
  steps: number;
  cardio_minutes: number;
  mood: number | null;
  notes: string | null;
}

const DAILY_TARGETS = {
  water_ml: 2500,
  sleep_hours: 8,
  steps: 8000,
  cardio_minutes: 20,
};

export function useFitnessDailyLog() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;
  const today = format(new Date(), 'yyyy-MM-dd');
  const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');

  const { data: todayLog, isLoading } = useQuery({
    queryKey: ['fitness-daily-log', userId, today],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('fitness_daily_log' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', today)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return (data as unknown) as DailyLog | null;
    },
    enabled: !!userId,
  });

  const { data: weekLogs } = useQuery({
    queryKey: ['fitness-daily-log-week', userId, sevenDaysAgo],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('fitness_daily_log' as any)
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', sevenDaysAgo)
        .order('log_date', { ascending: true });
      if (error) throw error;
      return ((data as unknown) as DailyLog[]) || [];
    },
    enabled: !!userId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (updates: Partial<DailyLog>) => {
      if (!userId) throw new Error('Not authenticated');
      const payload = {
        user_id: userId,
        log_date: today,
        water_ml: todayLog?.water_ml ?? 0,
        steps: todayLog?.steps ?? 0,
        cardio_minutes: todayLog?.cardio_minutes ?? 0,
        sleep_hours: todayLog?.sleep_hours ?? null,
        mood: todayLog?.mood ?? null,
        notes: todayLog?.notes ?? null,
        ...updates,
      };
      const { data, error } = await supabase
        .from('fitness_daily_log' as any)
        .upsert(payload, { onConflict: 'user_id,log_date' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fitness-daily-log', userId, today] });
      queryClient.invalidateQueries({ queryKey: ['fitness-daily-log-week', userId] });
    },
  });

  return {
    todayLog,
    weekLogs: weekLogs || [],
    targets: DAILY_TARGETS,
    isLoading,
    upsert: upsertMutation.mutateAsync,
    isSaving: upsertMutation.isPending,
  };
}
