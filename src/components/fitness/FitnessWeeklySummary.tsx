import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNutrition } from '@/hooks/useNutrition';
import { useFitnessDailyLog } from '@/hooks/useFitnessDailyLog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Loader2, Dumbbell, Flame, Droplet, Moon } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

function pct(num: number, total: number) {
  if (!total) return 0;
  return Math.round((num / total) * 100);
}

export function FitnessWeeklySummary() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { rawGoals } = useNutrition();
  const { weekLogs, targets, todayLog } = useFitnessDailyLog();
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const sevenDaysAgo = useMemo(() => format(subDays(new Date(), 6), 'yyyy-MM-dd'), []);
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // Workouts last 7 days
  const { data: weekWorkouts } = useQuery({
    queryKey: ['hevy-week-workouts', userId, sevenDaysAgo],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('hevy_workouts_cache')
        .select('workout_date, title, volume_kg, duration_seconds')
        .eq('user_id', userId)
        .gte('workout_date', sevenDaysAgo);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Nutrition logs last 7 days
  const { data: weekNutrition } = useQuery({
    queryKey: ['nutrition-week', userId, sevenDaysAgo],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('fitness_nutrition_logs')
        .select('log_date, protein_g, carbs_g, fat_g, calories')
        .eq('user_id', userId)
        .gte('log_date', sevenDaysAgo);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Aggregations
  const workoutDays = new Set((weekWorkouts || []).map(w => w.workout_date)).size;
  const totalVolume = (weekWorkouts || []).reduce((s, w) => s + (Number(w.volume_kg) || 0), 0);

  // Nutrition aderência: dia bateu meta se proteína >= 90% do alvo
  const nutritionByDay: Record<string, { protein_g: number; calories: number }> = {};
  (weekNutrition || []).forEach(l => {
    const d = l.log_date;
    if (!nutritionByDay[d]) nutritionByDay[d] = { protein_g: 0, calories: 0 };
    nutritionByDay[d].protein_g += Number(l.protein_g) || 0;
    nutritionByDay[d].calories += Number(l.calories) || 0;
  });
  const proteinTarget = rawGoals?.protein_g || 0;
  const daysProteinHit = proteinTarget
    ? Object.values(nutritionByDay).filter(d => d.protein_g >= proteinTarget * 0.9).length
    : 0;
  const trackedNutritionDays = Object.keys(nutritionByDay).length;

  // Daily log aggregates
  const avgWater = weekLogs.length
    ? Math.round(weekLogs.reduce((s, l) => s + (l.water_ml || 0), 0) / weekLogs.length)
    : 0;
  const avgSleep = weekLogs.filter(l => l.sleep_hours).length
    ? (weekLogs.reduce((s, l) => s + (Number(l.sleep_hours) || 0), 0) / weekLogs.filter(l => l.sleep_hours).length)
    : 0;

  // Consistency score (0-100)
  const score = useMemo(() => {
    const trainScore = pct(workoutDays, 5); // 5 dias = 100%
    const proteinScore = trackedNutritionDays ? pct(daysProteinHit, 7) : 0;
    const waterScore = pct(avgWater, targets.water_ml);
    const sleepScore = avgSleep ? pct(avgSleep, targets.sleep_hours) : 0;
    return Math.round((trainScore + proteinScore + waterScore + sleepScore) / 4);
  }, [workoutDays, daysProteinHit, trackedNutritionDays, avgWater, avgSleep, targets]);

  const scoreColor = score >= 75 ? 'text-emerald-600' : score >= 50 ? 'text-amber-600' : 'text-rose-600';
  const scoreBg = score >= 75 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40' :
                  score >= 50 ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40' :
                  'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40';

  const requestCoach = async () => {
    setIsAnalyzing(true);
    setAiMessage(null);
    try {
      const todaySummary = {
        date: today,
        nutrition: nutritionByDay[today] || { protein_g: 0, calories: 0 },
        daily_log: todayLog || null,
        treinou_hoje: (weekWorkouts || []).some(w => w.workout_date === today),
      };
      const weekSummary = {
        treinos: workoutDays,
        volume_kg_total: Math.round(totalVolume),
        dias_proteina_batida: daysProteinHit,
        dias_nutricao_registrados: trackedNutritionDays,
        media_agua_ml: avgWater,
        media_sono_h: Number(avgSleep.toFixed(1)),
        score_consistencia: score,
      };
      const { data, error } = await supabase.functions.invoke('ai-fitness-coach', {
        body: {
          weekSummary,
          todaySummary,
          goals: rawGoals,
          profile: { metas_diarias: targets },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiMessage(data?.message || 'Sem resposta da IA.');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao consultar o coach');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full shadow-lg overflow-hidden border-primary/10">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
      <CardContent className="p-5 space-y-5">
        {/* Header com score */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Sua semana</h3>
              <p className="text-xs text-muted-foreground">Últimos 7 dias</p>
            </div>
          </div>

          <div className={`text-center rounded-xl px-4 py-2 border ${scoreBg}`}>
            <div className={`text-3xl font-extrabold leading-none ${scoreColor}`}>{score}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">Consistência</div>
          </div>
        </div>

        {/* Grid de métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric icon={<Dumbbell className="h-3.5 w-3.5 text-orange-500" />}
            label="Treinos" value={`${workoutDays}/7`} sub={`${Math.round(totalVolume).toLocaleString()}kg`} />
          <Metric icon={<Flame className="h-3.5 w-3.5 text-rose-500" />}
            label="Proteína na meta" value={`${daysProteinHit}/${Math.max(trackedNutritionDays, 1)}`}
            sub={trackedNutritionDays ? `${trackedNutritionDays} dias logados` : 'sem registro'} />
          <Metric icon={<Droplet className="h-3.5 w-3.5 text-blue-500" />}
            label="Água/dia" value={`${(avgWater / 1000).toFixed(1)}L`} sub={`meta ${(targets.water_ml / 1000).toFixed(1)}L`} />
          <Metric icon={<Moon className="h-3.5 w-3.5 text-indigo-500" />}
            label="Sono/dia" value={avgSleep ? `${avgSleep.toFixed(1)}h` : '--'} sub={`meta ${targets.sleep_hours}h`} />
        </div>

        {/* Coach IA */}
        <div className="border-t pt-4 space-y-3">
          <Button
            onClick={requestCoach}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-none gap-2"
          >
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isAnalyzing ? 'Analisando seus dados...' : 'Pedir análise do coach IA'}
          </Button>

          {aiMessage && (
            <div className="rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 border border-violet-100 dark:border-violet-900/40 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-violet-600" />
                <span className="text-xs font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wide">Coach IA</span>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {aiMessage}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
