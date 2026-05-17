import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays } from 'date-fns';
import { useMemo } from 'react';

export interface NutritionLog {
  id: string;
  log_date: string;
  food_name: string;
  quantity: number | null;
  unit: string | null;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calories: number;
  created_at: string;
}

export interface WorkoutDay {
  workout_date: string;
  title: string | null;
  volume_kg: number | null;
  muscle_groups: string[] | null;
  duration_seconds: number | null;
}

export interface DayBundle {
  date: string; // yyyy-MM-dd
  workout: WorkoutDay | null;
  logs: NutritionLog[];
  totals: { protein_g: number; carbs_g: number; fat_g: number; calories: number };
}

export function useNutritionHistory(days = 7) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const range = useMemo(() => {
    const today = new Date();
    const start = subDays(today, days - 1);
    return {
      startStr: format(start, 'yyyy-MM-dd'),
      endStr: format(today, 'yyyy-MM-dd'),
    };
  }, [days]);

  const { data, isLoading } = useQuery({
    queryKey: ['nutrition-history', userId, range.startStr, range.endStr],
    queryFn: async (): Promise<DayBundle[]> => {
      if (!userId) return [];

      const [logsRes, workoutsRes] = await Promise.all([
        supabase
          .from('fitness_nutrition_logs')
          .select('*')
          .eq('user_id', userId)
          .gte('log_date', range.startStr)
          .lte('log_date', range.endStr)
          .order('created_at', { ascending: true }),
        supabase
          .from('hevy_workouts_cache')
          .select('workout_date, title, volume_kg, muscle_groups, duration_seconds')
          .eq('user_id', userId)
          .gte('workout_date', range.startStr)
          .lte('workout_date', range.endStr),
      ]);

      if (logsRes.error) throw logsRes.error;
      if (workoutsRes.error) throw workoutsRes.error;

      const logs = (logsRes.data || []) as NutritionLog[];
      const workouts = (workoutsRes.data || []) as WorkoutDay[];

      // Build day buckets from endStr backwards
      const bundles: DayBundle[] = [];
      for (let i = 0; i < days; i++) {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const dayLogs = logs.filter((l) => l.log_date === d);
        const totals = dayLogs.reduce(
          (acc, l) => ({
            protein_g: acc.protein_g + Number(l.protein_g),
            carbs_g: acc.carbs_g + Number(l.carbs_g),
            fat_g: acc.fat_g + Number(l.fat_g),
            calories: acc.calories + Number(l.calories),
          }),
          { protein_g: 0, carbs_g: 0, fat_g: 0, calories: 0 }
        );
        bundles.push({
          date: d,
          workout: workouts.find((w) => w.workout_date === d) || null,
          logs: dayLogs,
          totals,
        });
      }
      return bundles;
    },
    enabled: !!userId,
  });

  const deleteLogMutation = useMutation({
    mutationFn: async (logId: string) => {
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('fitness_nutrition_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-history', userId] });
      queryClient.invalidateQueries({ queryKey: ['nutrition-logs-today', userId] });
    },
  });

  return {
    bundles: data || [],
    isLoading,
    deleteLog: deleteLogMutation.mutateAsync,
    isDeleting: deleteLogMutation.isPending,
  };
}
