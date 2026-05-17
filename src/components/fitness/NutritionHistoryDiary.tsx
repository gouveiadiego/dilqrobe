import { useNutritionHistory } from '@/hooks/useNutritionHistory';
import { useNutrition } from '@/hooks/useNutrition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Trash2, Flame, Moon, CheckCircle2, AlertCircle, Utensils, Dumbbell } from 'lucide-react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function formatDayLabel(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d)) return 'Hoje';
  if (isYesterday(d)) return 'Ontem';
  return format(d, "EEE, dd 'de' MMM", { locale: ptBR });
}

export const NutritionHistoryDiary = () => {
  const { bundles, isLoading, deleteLog, isDeleting } = useNutritionHistory(7);
  const { activeGoals } = useNutrition();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-sm text-muted-foreground">Carregando histórico...</CardContent>
      </Card>
    );
  }

  const proteinGoal = activeGoals?.protein_g || 0;
  const calGoal = activeGoals?.calories || 0;

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
          {bundles.map((day) => {
            const proteinHit = proteinGoal > 0 && day.totals.protein_g >= proteinGoal;
            const hasWorkout = !!day.workout;
            const hasFood = day.logs.length > 0;

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
                        {calGoal > 0 && <span className="text-muted-foreground"> / {calGoal.toFixed(0)}</span>} kcal
                      </span>
                      {proteinGoal > 0 && hasFood && (
                        proteinHit ? (
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
                            {day.workout!.volume_kg != null && <span>{Number(day.workout!.volume_kg).toFixed(0)} kg levantados</span>}
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

                    {/* Macros summary */}
                    {hasFood && (
                      <div className="rounded-lg border p-3 text-xs">
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <div className="text-muted-foreground">Calorias</div>
                            <div className="font-medium text-sm text-foreground">{day.totals.calories.toFixed(0)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Proteína</div>
                            <div className="font-medium text-sm text-foreground">{day.totals.protein_g.toFixed(0)}g</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Carbo</div>
                            <div className="font-medium text-sm text-foreground">{day.totals.carbs_g.toFixed(0)}g</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Gordura</div>
                            <div className="font-medium text-sm text-foreground">{day.totals.fat_g.toFixed(0)}g</div>
                          </div>
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
