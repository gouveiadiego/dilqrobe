
import React from "react";
import { Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HabitLog {
  id: string;
  habit_id: string;
  completed_at: string;
  date: string;
  notes?: string;
  mood?: string;
}

interface HabitShameDashboardProps {
  habitLogs: HabitLog[];
  habitTitle: string;
  createdAt: string; // string ISO date
}

function arrayFromDateRange(startDate: Date, endDate: Date) {
  const arr = [];
  for (let dt = new Date(startDate); dt <= endDate; dt.setDate(dt.getDate() + 1)) {
    arr.push(dt.toISOString().slice(0, 10));
  }
  return arr;
}

export const HabitShameDashboard: React.FC<HabitShameDashboardProps> = ({ habitLogs, habitTitle, createdAt }) => {
  // Calcular datas
  const startDate = new Date(createdAt);
  const today = new Date();

  // Lista de dias do início até hoje
  const allDays = arrayFromDateRange(startDate, today);

  // Lista de datas completadas (YYYY-MM-DD)
  const completedDays = new Set(
    habitLogs.map(l => new Date(l.date).toISOString().slice(0, 10))
  );

  // Métrica de falha
  const failedDays = allDays.filter(day => !completedDays.has(day));
  const failureRate = allDays.length > 0 ? Math.round((failedDays.length / allDays.length) * 100) : 0;

  // Calcular streak máximo
  let maxStreak = 0;
  let currentStreak = 0;
  allDays.forEach(day => {
    if (completedDays.has(day)) {
      currentStreak += 1;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  });

  // Streak perdido mais doloroso
  let streakDrops: number[] = [];
  let ongoing = 0;
  allDays.forEach(day => {
    if (completedDays.has(day)) {
      ongoing += 1;
    } else {
      if (ongoing > 1) streakDrops.push(ongoing);
      ongoing = 0;
    }
  });

  const biggestStreakLost = Math.max(...streakDrops, 0);

  // Mensagens de pressão psicológica
  const shameMessages = [
    failureRate >= 80
      ? "Coragem! Você está deixando passar MUITOS dias em branco."
      : failureRate >= 50
      ? "Atenção! Sua taxa de falha está perigosa."
      : failureRate >= 30
      ? "Pode melhorar! Que tal refazer sua rotina?"
      : "Não desista! Seus hábitos precisam de mais dedicação.",
    `Seu pior streak perdido foi de ${biggestStreakLost > 0 ? biggestStreakLost : "menos de 2"} dias.`,
    `Você deixou de cumprir seu hábito em ${failedDays.length} dias (${failureRate}%).`,
    maxStreak < 7
      ? "Nunca passou sequer de uma semana em sequência. Tem certeza que esse hábito é importante?"
      : maxStreak < 21
      ? "Passe dos 21 dias seguidos! Dizem que aí torna-se um hábito de verdade..."
      : "Já conseguiu sequências boas antes, mas está escorregando agora!"
  ];

  return (
    <Card className="mb-6 border-l-4 border-red-400">
      <CardHeader className="flex flex-row items-center space-y-0 gap-3">
        <Calendar className="text-red-500 h-6 w-6" />
        <CardTitle className="text-lg font-bold text-red-500">
          Dashboard de Vergonha: {habitTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-2 space-y-2">
          {shameMessages.map((msg, idx) => (
            <div key={idx} className="text-sm text-red-500 font-semibold">
              {msg}
            </div>
          ))}
        </div>
        {/* Pequeno calendário visual dos dias */}
        <div className="flex flex-wrap gap-[2px]">
          {allDays.map((day, idx) => {
            const isFail = !completedDays.has(day);
            return (
              <div
                key={idx}
                title={isFail ? `FALHA: ${day}` : `OK: ${day}`}
                className={cn(
                  "w-3 h-3 rounded-full",
                  isFail ? "bg-red-400 opacity-90" : "bg-gray-200"
                )}
              ></div>
            );
          })}
        </div>
        <div className="text-xs text-gray-400 mt-1">• Vermelho: dias não cumpridos</div>
      </CardContent>
    </Card>
  );
};
