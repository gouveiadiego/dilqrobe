
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, Trophy, Star, ListCheck, ChartLine, Target, Edit, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HabitForm } from "./HabitForm";

type Habit = {
  id: string;
  title: string;
  description?: string;
  frequency: "daily" | "weekly";
  streak: number;
  completed: boolean;
  progress: number;
  schedule_days: string[];
  schedule_time?: string;
};

type DBHabit = {
  id: string;
  title: string;
  description?: string;
  active: boolean;
  streak: number;
  best_streak: number;
  schedule_days: string[];
  schedule_time?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  positive_reinforcement?: string[];
};

export function HabitsTab() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchHabits();
  }, []);

  const transformDBHabitToHabit = (dbHabit: DBHabit): Habit => {
    // For now, we'll set some default values. In a real app, you might want to
    // calculate these based on habit logs or other data
    return {
      id: dbHabit.id,
      title: dbHabit.title,
      description: dbHabit.description,
      frequency: "daily", // Default to daily for now
      streak: dbHabit.streak,
      completed: false, // This should be calculated based on today's completion status
      progress: 0, // This should be calculated based on monthly completion rate
      schedule_days: dbHabit.schedule_days,
      schedule_time: dbHabit.schedule_time,
    };
  };

  const fetchHabits = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("active", true);

      if (error) throw error;
      
      // Transform the database habits into our component's Habit type
      const transformedHabits = (data || []).map(transformDBHabitToHabit);
      setHabits(transformedHabits);
    } catch (error) {
      console.error("Erro ao carregar hábitos:", error);
      toast.error("Erro ao carregar hábitos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditHabit = (habit: Habit) => {
    setSelectedHabit(habit);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedHabit(null);
    fetchHabits();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedHabit(null);
  };

  if (showForm) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">
          {selectedHabit ? "Editar Hábito" : "Novo Hábito"}
        </h2>
        <HabitForm
          initialData={selectedHabit || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Hábitos</h2>
          <p className="text-muted-foreground">
            Acompanhe seus hábitos e construa uma vida melhor, um dia de cada vez.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Hábito
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sequência Atual</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 dias</div>
            <p className="text-xs text-muted-foreground">
              Continue mantendo a consistência!
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <ChartLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              Média dos últimos 30 dias
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontos</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">520</div>
            <p className="text-xs text-muted-foreground">
              Continue acumulando pontos!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Habits List */}
      <div className="space-y-4">
        {habits.map((habit) => (
          <Card key={habit.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{habit.title}</CardTitle>
                  <CardDescription>{habit.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditHabit(habit)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant={habit.completed ? "default" : "outline"}
                    size="sm"
                  >
                    <ListCheck className="h-4 w-4 mr-1" />
                    {habit.completed ? "Concluído" : "Marcar"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progresso mensal</span>
                <span className="font-medium">{habit.progress}%</span>
              </div>
              <Progress value={habit.progress} className="h-2" />
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {habit.schedule_days.map((day) => day.charAt(0).toUpperCase()).join(", ")}
                  </span>
                </div>
                {habit.schedule_time && (
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>às {habit.schedule_time}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dicas para Sucesso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">• Comece com hábitos pequenos e alcançáveis</p>
            <p className="text-sm">• Mantenha a consistência acima da perfeição</p>
            <p className="text-sm">• Celebre suas pequenas vitórias</p>
            <p className="text-sm">• Use lembretes visuais para manter o foco</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Próximas Conquistas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">🏆 10 dias consecutivos</p>
            <p className="text-sm">⭐ 1000 pontos acumulados</p>
            <p className="text-sm">🎯 5 hábitos completados em um dia</p>
            <p className="text-sm">🌟 30 dias de consistência</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
