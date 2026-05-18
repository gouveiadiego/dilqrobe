import { useNutritionHistory, type DayBundle } from '@/hooks/useNutritionHistory';
import { useNutrition } from '@/hooks/useNutrition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trash2, Flame, Moon, CheckCircle2, AlertCircle, Utensils, Dumbbell } from 'lucide-react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function formatDayLabel(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d)) return 'Hoje';
  if (isYesterday(d)) return 'Ontem';
  return format(d, "EEE, dd 'de' MMM", { locale: ptBR });
}

type MacroKey = 'calories' | 'protein_g' | 'carbs_g' | 'fat_g';

function getDayGoals(rawGoals: any, hadWorkout: boolean) {
  if (!rawGoals) return null;
  return {
    protein_g: Number(rawGoals.protein_g) || 0,
    fat_g: Number(rawGoals.fat_g) || 0,
    calories: Number(hadWorkout ? rawGoals.calories_with_workout : rawGoals.calories_rest) || 0,
    carbs_g: Number(hadWorkout ? rawGoals.carbs_g_with_workout : rawGoals.carbs_g_rest) || 0,
  };
}

function statusColor(consumed: number, goal: number) {
  if (goal <= 0) return 'bg-muted-foreground/40';
  const pct = consumed / goal;
  if (pct >= 0.9 && pct <= 1.1) return 'bg-emerald-500';
  if (pct > 1.1) return 'bg-destructive';
  return 'bg-amber-500';
}

function MacroRow({ label, consumed, goal, unit = 'g' }: { label: string; consumed: number; goal: number; unit?: string }) {
  const pct = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0;
  const diff = goal - consumed;
  const isOver = diff < 0;
  const hit = goal > 0 && Math.abs(diff) / goal <= 0.1;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">
          {consumed.toFixed(0)}{unit} {goal > 0 && <span className="text-muted-foreground">/ {goal.toFixed(0)}{unit}</span>}
        </span>
      </div>
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${statusColor(consumed, goal)}`} style={{ width: `${pct}%` }} />
      </div>
      {goal > 0 && (
        <div className="text-[10px] text-muted-foreground">
          {hit ? '✓ na meta' : isOver ? `+${Math.abs(diff).toFixed(0)}${unit} acima` : `faltam ${diff.toFixed(0)}${unit}`}
        </div>
      )}
    </div>
  );
}

export const NutritionHistoryDiary = () => {
  const { bundles, isLoading, deleteLog, isDeleting } = useNutritionHistory(7);
  const { rawGoals } = useNutrition();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-sm text-muted-foreground">Carregando histórico...</CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Utensils className="h-5 w-5 text-primary" />
          Diário Treino × Comida (últimos 7 dias)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Veja se sua alimentação está alinhada com seus treinos.
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue={bundles[0]?.date} className="w-full">
          {bundles.map((day: DayBundle) => {
            const hasWorkout = !!day.workout;
            const hasFood = day.logs.length > 0;
            const goals = getDayGoals(rawGoals, hasWorkout);
            const allHit =
              !!goals &&
              hasFood &&
              (['calories', 'protein_g', 'carbs_g', 'fat_g'] as MacroKey[]).every((k) => {
                const g = goals[k];
                const c = day.totals[k];
                return g > 0 && Math.abs(g - c) / g <= 0.15;
              });
            const proteinDiff = goals ? goals.protein_g - day.totals.protein_g : 0;
            const calDiff = goals ? goals.calories - day.totals.calories : 0;

            return (
              <AccordionItem key={day.date} value={day.date}>
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center justify-between w-full pr-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-medium text-sm capitalize">{formatDayLabel(day.date)}</span>
                      {hasWorkout ? (
                        <Badge variant="outline" className="gap-1 border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:border-orange-900/40 dark:text-orange-300">
                          <Flame className="h-3 w-3" /> Treino
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-900/40 dark:text-indigo-300">
                          <Moon className="h-3 w-3" /> Descanso
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                      <span className="font-medium text-foreground">
                        {day.totals.calories.toFixed(0)}
                        {goals && goals.calories > 0 && <span className="text-muted-foreground"> / {goals.calories.toFixed(0)}</span>} kcal
                      </span>
                      {hasFood && goals && (
                        allHit ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                        )
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-1">
                    {/* Workout summary */}
                    {hasWorkout && (
                      <div className="rounded-lg border bg-orange-50/40 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/30 p-3 flex items-start gap-3">
                        <Dumbbell className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                        <div className="flex-1 text-sm">
                          <div className="font-medium">{day.workout!.title || 'Treino registrado'}</div>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 mt-1">
                            {day.workout!.volume_kg != null && Number(day.workout!.volume_kg) > 0 && (
                              <span>{Number(day.workout!.volume_kg).toFixed(0)} kg levantados</span>
                            )}
                            {day.workout!.duration_seconds != null && (
                              <span>{Math.round(day.workout!.duration_seconds / 60)} min</span>
                            )}
                            {day.workout!.muscle_groups?.length ? (
                              <span>{day.workout!.muscle_groups.join(', ')}</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Macros vs goals */}
                    {hasFood && goals && (
                      <div className="rounded-lg border p-3 space-y-3">
                        {allHit ? (
                          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                            <CheckCircle2 className="h-4 w-4" /> Metas batidas neste dia
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            {proteinDiff > 0 && <>Faltaram <span className="font-medium text-foreground">{proteinDiff.toFixed(0)}g</span> de proteína</>}
                            {proteinDiff > 0 && calDiff > 0 && ' · '}
                            {calDiff > 0 && <><span className="font-medium text-foreground">{calDiff.toFixed(0)}</span> kcal abaixo</>}
                            {proteinDiff <= 0 && calDiff <= 0 && 'Acima da meta — ajuste se for cutting'}
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <MacroRow label="Calorias" consumed={day.totals.calories} goal={goals.calories} unit="" />
                          <MacroRow label="Proteína" consumed={day.totals.protein_g} goal={goals.protein_g} />
                          <MacroRow label="Carbo" consumed={day.totals.carbs_g} goal={goals.carbs_g} />
                          <MacroRow label="Gordura" consumed={day.totals.fat_g} goal={goals.fat_g} />
                        </div>
                      </div>
                    )}

                    {/* Food list */}
                    {hasFood ? (
                      <div className="space-y-1.5">
                        {day.logs.map((log) => (
                          <div key={log.id} className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{log.food_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {log.quantity != null && `${log.quantity}${log.unit ? ` ${log.unit}` : ''} · `}
                                {Number(log.calories).toFixed(0)} kcal · P {Number(log.protein_g).toFixed(0)}g · C {Number(log.carbs_g).toFixed(0)}g · G {Number(log.fat_g).toFixed(0)}g
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => deleteLog(log.id)}
                              disabled={isDeleting}
                              aria-label="Excluir refeição"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Nenhuma refeição registrada neste dia.</p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
};
