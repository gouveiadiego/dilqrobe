
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, PersonStanding, Medal, Target, Calendar, Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ChallengeStatsProps {
  currentStats: {
    totalDistance: number;
    percentageComplete: number;
    currentChallenge: any | null;
  };
}

export function ChallengeStats({ currentStats }: ChallengeStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <Card className="border-none bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-600 to-purple-600"></div>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-indigo-700">Desafio Atual</CardTitle>
          <Trophy className="h-5 w-5 text-indigo-500 group-hover:text-amber-500 transition-colors duration-300" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-indigo-800">
            {currentStats.currentChallenge?.yearly_goal || 0} <span className="text-lg font-medium">km</span>
          </div>
          <p className="text-xs text-indigo-600 mt-1">
            {currentStats.currentChallenge?.description || "Meta para o ano"}
          </p>
          <div className="mt-2 space-x-2">
            {currentStats.currentChallenge?.difficulty && (
              <span className={`text-xs px-2 py-1 rounded-full inline-flex items-center ${
                currentStats.currentChallenge.difficulty === 'fácil' 
                  ? 'bg-green-100 text-green-700'
                  : currentStats.currentChallenge.difficulty === 'médio'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                <Flame className="h-3 w-3 mr-1" />
                {currentStats.currentChallenge.difficulty}
              </span>
            )}
            {currentStats.currentChallenge?.visibility && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 inline-flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {currentStats.currentChallenge.visibility}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-gradient-to-br from-green-50 to-emerald-50 overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-green-600 to-emerald-600"></div>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700">Progresso</CardTitle>
          <PersonStanding className="h-5 w-5 text-green-500 group-hover:text-green-600 transition-colors duration-300" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-green-800">{currentStats.totalDistance.toFixed(1)} <span className="text-lg font-medium">km</span></div>
          <div className="mt-3 h-2.5 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700 ease-out shimmer-effect"
              style={{ width: `${Math.min(currentStats.percentageComplete, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-xs text-green-700">
              {currentStats.percentageComplete.toFixed(1)}% concluído
            </p>
            <p className="text-xs text-green-700 font-medium">
              Meta: {currentStats.currentChallenge?.yearly_goal || 0} km
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-gradient-to-br from-amber-50 to-yellow-50 overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-yellow-500"></div>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-amber-700">Conquistas</CardTitle>
          <Medal className="h-5 w-5 text-amber-500 group-hover:text-amber-600 transition-colors duration-300" />
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-amber-800">
            {currentStats.currentChallenge?.reward_badges?.length || 0}
          </div>
          <div className="flex items-center mt-2 mb-2">
            <div className="relative flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-sm">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 flex items-center justify-center shadow-sm">
                <Medal className="h-4 w-4 text-white" />
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-300 to-green-500 flex items-center justify-center shadow-sm">
                <Target className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="ml-4 text-xs text-amber-700">
              Continue correndo para ganhar mais conquistas!
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-100/50 to-amber-200/50 p-2 rounded-lg text-xs text-amber-800 mt-2 backdrop-blur-sm">
            <div className="flex items-center">
              <Target className="h-3 w-3 mr-1 text-amber-600" />
              <div>Próxima conquista: <span className="font-medium">Maratonista Iniciante</span> (5km)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
