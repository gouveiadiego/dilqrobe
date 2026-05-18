import React, { useState } from 'react';
import { useNutrition } from '@/hooks/useNutrition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Flame, Moon, CheckCircle2, Loader2, Plus, Brain } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { NutritionSetupForm } from './NutritionSetupForm';
import { MacroSuggestions } from './MacroSuggestions';

export const NutritionTrainingSync = () => {
  const {
    todayWorkout,
    isWorkoutDay,
    activeGoals,
    consumedToday,
    isLoading,
    processFoodAi,
    isProcessingFood,
    saveLog,
    isSavingLog
  } = useNutrition();
  
  const { toast } = useToast();
  const [foodText, setFoodText] = useState('');

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // If no profile / goals are set yet, show the setup form
  if (!activeGoals) {
    return <NutritionSetupForm />;
  }

  const proteinLeft = activeGoals.protein_g - (consumedToday?.protein_g || 0);
  const isGoalMet = proteinLeft <= 0;
  
  const handleAiSubmit = async () => {
    if (!foodText.trim()) return;
    
    try {
      const result = await processFoodAi(foodText);
      
      // Save each identified food
      for (const alimento of result.alimentos) {
        await saveLog({
          food_name: alimento.nome,
          quantity: alimento.quantidade,
          unit: alimento.unidade,
          protein_g: alimento.proteina_g,
          carbs_g: alimento.carbo_g,
          fat_g: alimento.gordura_g,
          calories: alimento.calorias
        });
      }
      
      setFoodText('');
      toast({
        title: 'Alimento registrado!',
        description: `IA identificou e registrou com sucesso (${result.total.calorias.toFixed(0)} kcal).`,
      });
      
    } catch (error: any) {
      toast({
        title: 'Erro ao processar',
        description: error.message || 'Falha ao conectar com a IA.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
    <Card className="w-full shadow-lg border-primary/10 overflow-hidden relative">
      {/* Visual background gradient based on workout status */}
      <div className={`absolute top-0 w-full h-1 bg-gradient-to-r ${isWorkoutDay ? 'from-orange-500 to-rose-500' : 'from-indigo-400 to-blue-600'}`} />
      
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-lg gap-2">
          {isWorkoutDay ? (
            <>
              <Flame className="h-5 w-5 text-orange-500" />
              <span>Sincronização Ativa</span>
            </>
          ) : (
            <>
              <Moon className="h-5 w-5 text-indigo-400" />
              <span>Modo Descanso</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Dynamic Status Banner */}
        <div className={`rounded-xl p-4 border ${isWorkoutDay ? 'bg-orange-50/50 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30' : 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30'}`}>
          
          <div className="flex flex-col gap-1 mb-3">
            {isWorkoutDay ? (
              <h3 className="font-semibold text-orange-700 dark:text-orange-400">
                🔥 Treino: {todayWorkout.title || 'Sessão Registrada'} - {todayWorkout.volume_kg || 0}kg levantados
              </h3>
            ) : (
              <h3 className="font-semibold text-indigo-700 dark:text-indigo-400">
                🌙 Dia de descanso - meta de calorias reduzida em 10%
              </h3>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isGoalMet ? (
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-md">
                <CheckCircle2 className="h-5 w-5" />
                <span>Meta batida — +{Math.abs(proteinLeft).toFixed(0)}g acima</span>
              </div>
            ) : (
              <div className="text-muted-foreground font-medium flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {proteinLeft.toFixed(0)}g
                </span>
                <span>de proteína para fechar o dia</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Progress Bar for Macros */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Proteína</span>
              <span className="font-medium">{consumedToday?.protein_g.toFixed(0)} / {activeGoals.protein_g.toFixed(0)}g</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (consumedToday?.protein_g || 0) / activeGoals.protein_g * 100)}%` }} />
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Carbo</span>
              <span className="font-medium">{consumedToday?.carbs_g.toFixed(0)} / {activeGoals.carbs_g.toFixed(0)}g</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (consumedToday?.carbs_g || 0) / activeGoals.carbs_g * 100)}%` }} />
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Gordura</span>
              <span className="font-medium">{consumedToday?.fat_g.toFixed(0)} / {activeGoals.fat_g.toFixed(0)}g</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, (consumedToday?.fat_g || 0) / activeGoals.fat_g * 100)}%` }} />
            </div>
          </div>
        </div>

        {/* AI Food Input */}
        <div className="pt-4 border-t space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-500" />
            Adicionar Refeição via IA
          </h4>
          <Textarea 
            placeholder="Ex: Comi 2 ovos cozidos, 1 pão francês e tomei 30g de whey..."
            className="resize-none h-20 text-sm"
            value={foodText}
            onChange={(e) => setFoodText(e.target.value)}
          />
          <Button 
            className="w-full flex gap-2" 
            onClick={handleAiSubmit}
            disabled={!foodText.trim() || isProcessingFood || isSavingLog}
          >
            {isProcessingFood || isSavingLog ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Processar Refeição
          </Button>
        </div>
      </CardContent>
    </Card>
    <MacroSuggestions />
    </div>
  );
};
