
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, PersonStanding, Medal } from "lucide-react";

interface ChallengeStatsProps {
  currentStats: {
    totalDistance: number;
    percentageComplete: number;
    currentChallenge: any | null;
  };
}

export function ChallengeStats({ currentStats }: ChallengeStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Desafio Atual</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {currentStats.currentChallenge?.yearly_goal || 0} km
          </div>
          <p className="text-xs text-muted-foreground">
            {currentStats.currentChallenge?.description || "Meta para o ano"}
          </p>
          {currentStats.currentChallenge?.difficulty && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              currentStats.currentChallenge.difficulty === 'fácil' 
                ? 'bg-green-100 text-green-700'
                : currentStats.currentChallenge.difficulty === 'médio'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {currentStats.currentChallenge.difficulty}
            </span>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Progresso</CardTitle>
          <PersonStanding className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentStats.totalDistance.toFixed(1)} km</div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-green-500 rounded-full transition-all"
              style={{ width: `${Math.min(currentStats.percentageComplete, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {currentStats.percentageComplete.toFixed(1)}% concluído
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conquistas</CardTitle>
          <Medal className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {currentStats.currentChallenge?.reward_badges?.length || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Badges conquistadas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
