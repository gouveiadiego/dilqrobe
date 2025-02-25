import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, Trophy, Star, ListCheck, ChartLine, Target } from "lucide-react";
import { toast } from "sonner";

type Habit = {
  id: string;
  name: string;
  description: string;
  frequency: "daily" | "weekly";
  streak: number;
  completed: boolean;
  progress: number;
};

export function HabitsTab() {
  const [habits, setHabits] = useState<Habit[]>([
    {
      id: "1",
      name: "Meditar",
      description: "10 minutos de meditação mindfulness",
      frequency: "daily",
      streak: 5,
      completed: false,
      progress: 70,
    },
    {
      id: "2",
      name: "Exercício",
      description: "30 minutos de atividade física",
      frequency: "daily",
      streak: 3,
      completed: true,
      progress: 85,
    },
    {
      id: "3",
      name: "Leitura",
      description: "Ler 10 páginas",
      frequency: "daily",
      streak: 7,
      completed: false,
      progress: 90,
    },
  ]);

  const completeHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === id ? { ...habit, completed: !habit.completed } : habit
      )
    );
    toast.success("Hábito atualizado com sucesso!");
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Hábitos</h2>
        <p className="text-muted-foreground">
          Acompanhe seus hábitos e construa uma vida melhor, um dia de cada vez.
        </p>
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
                  <CardTitle className="text-lg">{habit.name}</CardTitle>
                  <CardDescription>{habit.description}</CardDescription>
                </div>
                <Button
                  variant={habit.completed ? "default" : "outline"}
                  size="sm"
                  onClick={() => completeHabit(habit.id)}
                >
                  <ListCheck className="h-4 w-4 mr-1" />
                  {habit.completed ? "Concluído" : "Marcar"}
                </Button>
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
                  <span>{habit.frequency === "daily" ? "Diário" : "Semanal"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span>Sequência: {habit.streak} dias</span>
                </div>
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
