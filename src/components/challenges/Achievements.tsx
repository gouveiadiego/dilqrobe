
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";

interface Achievement {
  badge_type: string;
  description: string;
  earned_at: string;
}

interface AchievementsProps {
  achievements: Achievement[];
}

export function Achievements({ achievements }: AchievementsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Conquistas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {achievements.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Ainda não há conquistas. Continue correndo para ganhar badges!
            </div>
          ) : (
            achievements.map((achievement, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                  <Award className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="font-medium">{achievement.badge_type}</div>
                  <div className="text-sm text-muted-foreground">
                    {achievement.description}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
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
