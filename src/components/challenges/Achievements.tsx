
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Trophy, Zap, Clock, Check, Star, Medal, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface Achievement {
  badge_type: string;
  description: string;
  earned_at: string;
}

interface AchievementsProps {
  achievements: Achievement[];
}

export function Achievements({ achievements }: AchievementsProps) {
  const [totalDistance, setTotalDistance] = useState(0);
  const [nextAchievement, setNextAchievement] = useState({
    name: "Maratonista Iniciante",
    distance: 5,
    progress: 0,
    month: "" // Add month for display
  });
  const [latestChallenge, setLatestChallenge] = useState<any>(null);

  // Fetch total distance for the current user
  const { data: records } = useQuery({
    queryKey: ['running-records-for-achievements'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No active session");

      const { data, error } = await supabase
        .from('running_records')
        .select('distance')
        .eq('user_id', session.user.id);

      if (error) {
        console.error("Error fetching records for achievements:", error);
        throw error;
      }

      return data || [];
    }
  });

  // Fetch the latest challenge
  const { data: challenges } = useQuery({
    queryKey: ['challenges-for-achievements'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No active session");

      const { data, error } = await supabase
        .from('running_challenges')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching latest challenge:", error);
        throw error;
      }

      return data || [];
    }
  });

  // Calculate total distance and achievement progress
  useEffect(() => {
    if (records && records.length > 0) {
      const distance = records.reduce((total, record) => total + Number(record.distance), 0);
      setTotalDistance(Number(distance.toFixed(1)));
      
      // Calculate progress towards next achievement based on challenge
      if (latestChallenge) {
        const nextMilestone = Math.min(5, Number(latestChallenge.yearly_goal) * 0.1);
        const progress = Math.min((distance / nextMilestone) * 100, 100);
        
        // Get month name from challenge start date
        const startDate = new Date(latestChallenge.start_date);
        const monthName = startDate.toLocaleString('pt-BR', { month: 'long' });
        
        setNextAchievement({
          name: `${latestChallenge.title} - Iniciante`,
          distance: nextMilestone,
          progress: Number(progress.toFixed(0)),
          month: monthName.charAt(0).toUpperCase() + monthName.slice(1) // Capitalize first letter
        });
      } else {
        // Default if no challenge is available
        setNextAchievement({
          name: "Maratonista Iniciante",
          distance: 5,
          progress: Math.min((distance / 5) * 100, 100),
          month: ""
        });
      }
    }
  }, [records, latestChallenge]);

  // Set latest challenge
  useEffect(() => {
    if (challenges && challenges.length > 0) {
      setLatestChallenge(challenges[0]);
    }
  }, [challenges]);

  // Get badge icon based on type
  const getBadgeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      'distance': <Trophy className="h-6 w-6" />,
      'streak': <Zap className="h-6 w-6" />,
      'speed': <Clock className="h-6 w-6" />,
      'completion': <Check className="h-6 w-6" />,
      'special': <Medal className="h-6 w-6" />
    };
    
    return icons[type.toLowerCase()] || <Award className="h-6 w-6" />;
  };

  return (
    <Card className="border-none bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg group">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-500 to-orange-500"></div>
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-semibold text-amber-800">
          Conquistas
        </CardTitle>
        <Trophy className="h-5 w-5 text-amber-500" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <div className="flex items-center justify-center mb-4">
            <div className="text-5xl font-bold text-amber-700">
              {achievements.length}
            </div>
          </div>

          <div className="flex items-center gap-2 justify-center mb-4">
            {achievements.length > 0 ? (
              // Show achievement icons if user has any
              achievements.slice(0, 3).map((achievement, index) => (
                <div 
                  key={index}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: getAchievementColor(achievement.badge_type),
                    boxShadow: `0 0 12px ${getAchievementColor(achievement.badge_type, true)}` 
                  }}
                >
                  {getBadgeIcon(achievement.badge_type)}
                </div>
              ))
            ) : (
              // Show sample achievement icons if no achievements yet
              <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center">
                <Trophy className="h-7 w-7 text-amber-600" />
              </div>
            )}
          </div>

          <p className="text-center text-amber-700 mb-4">
            Continue correndo para ganhar mais conquistas!
          </p>

          {latestChallenge ? (
            <div className="bg-amber-100/70 rounded-lg p-3">
              <div className="text-sm font-medium text-amber-800 mb-1 text-center">
                Próxima conquista: {nextAchievement.distance}km no
              </div>
              <div className="text-sm font-medium text-amber-800 mb-2 text-center">
                {latestChallenge.title} - Iniciante
              </div>
              <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-700"
                  style={{ width: `${nextAchievement.progress}%` }}
                ></div>
              </div>
              <div className="text-xs text-amber-700 mt-1 text-center">
                {totalDistance}km de {nextAchievement.distance}km ({nextAchievement.progress}%)
              </div>
            </div>
          ) : (
            <div className="bg-amber-100/70 rounded-lg p-3">
              <div className="text-sm font-medium text-amber-800 mb-1">
                Próxima conquista: Maratonista Iniciante (5km)
              </div>
              <div className="text-xs text-amber-700">
                Crie um desafio para começar a acumular conquistas!
              </div>
            </div>
          )}

          {achievements.length > 0 && (
            <div className="mt-3 pt-3 border-t border-amber-200">
              <div className="text-sm font-medium text-amber-800 mb-2">Suas Conquistas Recentes</div>
              <div className="space-y-2">
                {achievements.slice(0, 2).map((achievement, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 bg-white/60 p-2 rounded-lg"
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: getAchievementColor(achievement.badge_type) }}
                    >
                      {getBadgeIcon(achievement.badge_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-amber-800 truncate">
                        {achievement.description}
                      </div>
                      <div className="text-xs text-amber-600">
                        {new Date(achievement.earned_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get colors for different achievement types
function getAchievementColor(type: string, transparent: boolean = false): string {
  const colors: Record<string, string> = {
    'distance': transparent ? 'rgba(245, 158, 11, 0.3)' : '#fcd34d',
    'streak': transparent ? 'rgba(139, 92, 246, 0.3)' : '#c4b5fd',
    'speed': transparent ? 'rgba(59, 130, 246, 0.3)' : '#93c5fd',
    'completion': transparent ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0',
    'special': transparent ? 'rgba(99, 102, 241, 0.3)' : '#a5b4fc'
  };
  
  return colors[type.toLowerCase()] || (transparent ? 'rgba(107, 114, 128, 0.3)' : '#d1d5db');
}
