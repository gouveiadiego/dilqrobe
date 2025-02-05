
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartLine } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WeeklyStatsProps {
  weeklyStats: {
    week_start: string;
    total_distance: number;
    avg_pace: number;
    completed_runs: number;
  }[];
}

export function WeeklyProgress({ weeklyStats }: WeeklyStatsProps) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartLine className="h-5 w-5" />
          Progresso Semanal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="week_start" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)} km`, 'Distância']}
                labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              />
              <Line 
                type="monotone" 
                dataKey="total_distance" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {weeklyStats[weeklyStats.length - 1]?.total_distance.toFixed(1) || 0}
            </div>
            <div className="text-xs text-muted-foreground">km esta semana</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {weeklyStats[weeklyStats.length - 1]?.avg_pace.toFixed(2) || 0}
            </div>
            <div className="text-xs text-muted-foreground">min/km (média)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {weeklyStats[weeklyStats.length - 1]?.completed_runs || 0}
            </div>
            <div className="text-xs text-muted-foreground">corridas</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
