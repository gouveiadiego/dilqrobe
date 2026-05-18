import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfDay, format } from 'date-fns';

export function useNutrition() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  // 1. Get today's workout from Hevy Cache
  const { data: todayWorkout, isLoading: isWorkoutLoading } = useQuery({
    queryKey: ['hevy-today-workout', userId],
    queryFn: async () => {
      if (!userId) return null;
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('hevy_workouts_cache')
        .select('*')
        .eq('user_id', userId)
        .eq('workout_date', today)
        .limit(1)
        .maybeSingle();
        
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!userId,
  });

  const isWorkoutDay = !!todayWorkout;

  // 2. Get nutrition goals
  const { data: rawGoals, isLoading: isGoalsLoading } = useQuery({
    queryKey: ['nutrition-goals', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('fitness_nutrition_goals')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Calculate active goals based on workout day
  const activeGoals = rawGoals ? {
    protein_g: rawGoals.protein_g,
    fat_g: rawGoals.fat_g,
    calories: isWorkoutDay ? rawGoals.calories_with_workout : rawGoals.calories_rest,
    carbs_g: isWorkoutDay ? rawGoals.carbs_g_with_workout : rawGoals.carbs_g_rest,
  } : null;

  // 3. Get today's nutrition logs
  const { data: todayLogs, isLoading: isLogsLoading } = useQuery({
    queryKey: ['nutrition-logs-today', userId],
    queryFn: async () => {
      if (!userId) return [];
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('fitness_nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', today);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Calculate totals consumed today
  const consumedToday = todayLogs?.reduce((acc, log) => ({
    protein_g: acc.protein_g + Number(log.protein_g),
    carbs_g: acc.carbs_g + Number(log.carbs_g),
    fat_g: acc.fat_g + Number(log.fat_g),
    calories: acc.calories + Number(log.calories),
  }), { protein_g: 0, carbs_g: 0, fat_g: 0, calories: 0 });

  // 4. Log food via AI
  const processFoodAiMutation = useMutation({
    mutationFn: async (foodText: string) => {
      const { data, error } = await supabase.functions.invoke('ai-nutrition', {
        body: { text: foodText },
      });

      if (error) throw error;
      return data; // { alimentos: [], total: {} }
    },
  });

  // 5. Save log
  const saveLogMutation = useMutation({
    mutationFn: async (logData: {
      food_name: string;
      quantity: number;
      unit: string;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      calories: number;
    }) => {
      if (!userId) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('fitness_nutrition_logs')
        .insert([{
          user_id: userId,
          log_date: format(new Date(), 'yyyy-MM-dd'),
          ...logData
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nutrition-logs-today'] });
    },
  });

  return {
    todayWorkout,
    isWorkoutDay,
    rawGoals,
    activeGoals,
    consumedToday,
    todayLogs,
    isLoading: isWorkoutLoading || isGoalsLoading || isLogsLoading,
    processFoodAi: processFoodAiMutation.mutateAsync,
    isProcessingFood: processFoodAiMutation.isPending,
    saveLog: saveLogMutation.mutateAsync,
    isSavingLog: saveLogMutation.isPending,
  };
}
