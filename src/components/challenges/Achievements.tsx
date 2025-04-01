
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Trophy, Zap, Clock, Check, Star, Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Achievement {
  badge_type: string;
  description: string;
  earned_at: string;
}

interface AchievementsProps {
  achievements: Achievement[];
}

export function Achievements({ achievements }: AchievementsProps) {
  // Get badge icon and color based on type
  const getBadgeConfig = (type: string) => {
    const configs: Record<string, { 
      icon: React.ReactNode, 
      color: string, 
      bgColor: string,
      badgeColor: string
    }> = {
      'distance': { 
        icon: <Trophy className="h-4 w-4 text-amber-600" />, 
        color: 'text-amber-700',
        bgColor: 'bg-amber-100',
        badgeColor: 'bg-amber-500 text-white'
      },
      'streak': { 
        icon: <Zap className="h-4 w-4 text-purple-600" />, 
        color: 'text-purple-700',
        bgColor: 'bg-purple-100',
        badgeColor: 'bg-purple-500 text-white'
      },
      'speed': { 
        icon: <Clock className="h-4 w-4 text-blue-600" />, 
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        badgeColor: 'bg-blue-500 text-white'
      },
      'completion': {
        icon: <Check className="h-4 w-4 text-green-600" />,
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        badgeColor: 'bg-green-500 text-white'
      },
      'special': {
        icon: <Medal className="h-4 w-4 text-indigo-600" />,
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-100',
        badgeColor: 'bg-indigo-500 text-white'
      }
    };
    
    return configs[type.toLowerCase()] || { 
      icon: <Award className="h-4 w-4 text-indigo-600" />, 
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-100',
      badgeColor: 'bg-indigo-500 text-white'
    };
  };

  return (
    <Card className="border-none bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg group">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-500"></div>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-amber-800 flex items-center">
          <Award className="mr-2 h-5 w-5 text-amber-600 group-hover:text-amber-700 transition-colors duration-300" />
          Conquistas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {achievements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 px-4 bg-white/60 backdrop-blur-sm rounded-xl text-center">
            <div className="w-16 h-16 text-amber-300 mb-4">
              <Trophy className="w-full h-full" />
            </div>
            <p className="text-amber-800 mb-4">
              Ainda não há conquistas.<br />
              Continue correndo para ganhar badges!
            </p>
            
            <div className="flex gap-6 mt-4 justify-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-amber-600" />
                </div>
                <span className="text-xs text-amber-600 mt-2">Distância</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-xs text-purple-600 mt-2">Sequência</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-xs text-blue-600 mt-2">Velocidade</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {achievements.map((achievement, index) => {
              const { icon, color, bgColor, badgeColor } = getBadgeConfig(achievement.badge_type);
              return (
                <div 
                  key={index} 
                  className="flex items-center gap-3 bg-white/60 backdrop-blur-sm p-3 rounded-xl border border-amber-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-amber-200"
                >
                  <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center shadow-sm`}>
                    {icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`font-medium ${color}`}>{achievement.badge_type}</div>
                      <Badge className={badgeColor}>Conquistado!</Badge>
                    </div>
                    <div className="text-sm text-amber-700 font-medium">
                      {achievement.description}
                    </div>
                    <div className="text-xs text-amber-600 mt-0.5">
                      {new Date(achievement.earned_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
