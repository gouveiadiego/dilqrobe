
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Star, Medal, Trophy, Clock, Zap } from "lucide-react";

interface Achievement {
  badge_type: string;
  description: string;
  earned_at: string;
}

interface AchievementsProps {
  achievements: Achievement[];
}

export function Achievements({ achievements }: AchievementsProps) {
  // Get badge icon based on type
  const getBadgeIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'distance': <Trophy className="h-4 w-4 text-white" />,
      'streak': <Zap className="h-4 w-4 text-white" />,
      'speed': <Clock className="h-4 w-4 text-white" />,
      'achievement': <Star className="h-4 w-4 text-white" />,
      'medal': <Medal className="h-4 w-4 text-white" />,
    };
    
    // Default to Award icon if type not found
    return iconMap[type.toLowerCase()] || <Award className="h-4 w-4 text-white" />;
  };
  
  // Get badge color based on type
  const getBadgeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'distance': 'from-amber-400 to-amber-600',
      'streak': 'from-purple-400 to-purple-600',
      'speed': 'from-blue-400 to-blue-600',
      'achievement': 'from-red-400 to-red-600',
      'medal': 'from-green-400 to-green-600',
    };
    
    // Default color if type not found
    return colorMap[type.toLowerCase()] || 'from-gray-400 to-gray-600';
  };

  return (
    <Card className="border-none bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg group">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-500"></div>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-amber-800 flex items-center">
          <Award className="h-5 w-5 mr-2 text-amber-600 group-hover:text-amber-700 transition-colors duration-300" />
          Conquistas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {achievements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 bg-white/60 backdrop-blur-sm rounded-xl text-center text-amber-800 border border-amber-100">
              <Trophy className="h-12 w-12 text-amber-300 mb-3 opacity-70" />
              <p className="text-sm">
                Ainda não há conquistas. Continue correndo para ganhar badges!
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {['distance', 'streak', 'speed'].map((type) => (
                  <div key={type} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getBadgeColor(type)} flex items-center justify-center shadow-md opacity-50`}>
                      {getBadgeIcon(type)}
                    </div>
                    <div className="text-xs mt-1 capitalize text-amber-700">{type}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            achievements.map((achievement, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-amber-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-amber-200"
              >
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getBadgeColor(achievement.badge_type)} flex items-center justify-center shadow-md`}>
                  {getBadgeIcon(achievement.badge_type)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-amber-800">{achievement.badge_type}</div>
                  <div className="text-sm text-amber-700">
                    {achievement.description}
                  </div>
                  <div className="text-xs text-amber-600 mt-1 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    Conquistado em {new Date(achievement.earned_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
