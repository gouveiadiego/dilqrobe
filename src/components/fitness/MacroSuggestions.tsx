import { useState } from 'react';
import { useNutrition } from '@/hooks/useNutrition';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Sparkles, Loader2, Plus, CheckCircle2 } from 'lucide-react';

interface SuggestedItem {
  nome: string;
  quantidade: number;
  unidade: string;
  proteina_g: number;
  carbo_g: number;
  gordura_g: number;
  calorias: number;
}
interface SuggestedMeal {
  titulo: string;
  descricao?: string;
  itens: SuggestedItem[];
}

function sumItems(itens: SuggestedItem[]) {
  return itens.reduce(
    (acc, i) => ({
      protein_g: acc.protein_g + Number(i.proteina_g || 0),
      carbs_g: acc.carbs_g + Number(i.carbo_g || 0),
      fat_g: acc.fat_g + Number(i.gordura_g || 0),
      calories: acc.calories + Number(i.calorias || 0),
    }),
    { protein_g: 0, carbs_g: 0, fat_g: 0, calories: 0 }
  );
}

export const MacroSuggestions = () => {
  const { activeGoals, consumedToday, isWorkoutDay, saveLog, isSavingLog } = useNutrition();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [opcoes, setOpcoes] = useState<SuggestedMeal[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);

  if (!activeGoals) return null;

  const remaining = {
    calories: Math.max(0, activeGoals.calories - (consumedToday?.calories || 0)),
    protein_g: Math.max(0, activeGoals.protein_g - (consumedToday?.protein_g || 0)),
    carbs_g: Math.max(0, activeGoals.carbs_g - (consumedToday?.carbs_g || 0)),
    fat_g: Math.max(0, activeGoals.fat_g - (consumedToday?.fat_g || 0)),
  };

  const allDone =
    remaining.calories < 50 && remaining.protein_g < 5 && remaining.carbs_g < 10 && remaining.fat_g < 5;

  const handleSuggest = async () => {
    setLoading(true);
    setOpcoes([]);
    try {
      const { data, error } = await supabase.functions.invoke('ai-nutrition-suggest', {
        body: { remaining, isWorkoutDay },
      });
      if (error) throw error;
      setOpcoes(data?.opcoes || []);
    } catch (e: any) {
      toast({ title: 'Erro ao gerar sugestões', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (meal: SuggestedMeal, idx: number) => {
    setSavingIdx(idx);
    try {
      for (const item of meal.itens) {
        await saveLog({
          food_name: item.nome,
          quantity: Number(item.quantidade) || 0,
          unit: item.unidade || 'porção',
          protein_g: Number(item.proteina_g) || 0,
          carbs_g: Number(item.carbo_g) || 0,
          fat_g: Number(item.gordura_g) || 0,
          calories: Number(item.calorias) || 0,
        });
      }
      toast({ title: 'Refeição registrada!', description: meal.titulo });
      setOpcoes((prev) => prev.filter((_, i) => i !== idx));
    } catch (e: any) {
      toast({ title: 'Erro ao registrar', description: e.message, variant: 'destructive' });
    } finally {
      setSavingIdx(null);
    }
  };

  return (
    <Card className="w-full shadow-lg border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          O que comer para fechar o dia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {allDone ? (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
            <CheckCircle2 className="h-4 w-4" /> Metas do dia batidas — bom descanso!
          </div>
        ) : (
          <>
            <div className="text-xs text-muted-foreground">
              Faltam <span className="font-medium text-foreground">{remaining.calories.toFixed(0)} kcal</span> ·{' '}
              <span className="font-medium text-foreground">{remaining.protein_g.toFixed(0)}g P</span> ·{' '}
              <span className="font-medium text-foreground">{remaining.carbs_g.toFixed(0)}g C</span> ·{' '}
              <span className="font-medium text-foreground">{remaining.fat_g.toFixed(0)}g G</span>
            </div>

            <Button onClick={handleSuggest} disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Sugerir refeições com IA
            </Button>

            {opcoes.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 pt-2">
                {opcoes.map((meal, idx) => {
                  const totals = sumItems(meal.itens);
                  return (
                    <div key={idx} className="rounded-lg border p-3 space-y-2 bg-card">
                      <div className="font-medium text-sm">{meal.titulo}</div>
                      {meal.descricao && <p className="text-xs text-muted-foreground">{meal.descricao}</p>}
                      <ul className="text-xs space-y-0.5">
                        {meal.itens.map((it, i) => (
                          <li key={i} className="text-muted-foreground">
                            • {it.nome} — {it.quantidade} {it.unidade}
                          </li>
                        ))}
                      </ul>
                      <div className="text-[11px] text-muted-foreground border-t pt-2">
                        {totals.calories.toFixed(0)} kcal · P {totals.protein_g.toFixed(0)}g · C {totals.carbs_g.toFixed(0)}g · G {totals.fat_g.toFixed(0)}g
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full gap-1"
                        onClick={() => handleRegister(meal, idx)}
                        disabled={savingIdx === idx || isSavingLog}
                      >
                        {savingIdx === idx ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        Registrar esta refeição
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
