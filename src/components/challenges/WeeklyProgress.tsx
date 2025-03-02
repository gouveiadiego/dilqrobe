
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartLine, Calendar, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface WeeklyStatsProps {
  weeklyStats: {
    week_start: string;
    total_distance: number;
    avg_pace: number;
    completed_runs: number;
  }[];
}

export function WeeklyProgress({ weeklyStats }: WeeklyStatsProps) {
  // Calculate week-over-week change
  const calculateChange = () => {
    if (weeklyStats.length < 2) return { percent: 0, trend: 'neutral' };
    
    const currentWeek = weeklyStats[weeklyStats.length - 1]?.total_distance || 0;
    const previousWeek = weeklyStats[weeklyStats.length - 2]?.total_distance || 0;
    
    if (previousWeek === 0) return { percent: 100, trend: 'up' };
    
    const change = ((currentWeek - previousWeek) / previousWeek) * 100;
    return {
      percent: Math.abs(change.toFixed(1)),
      trend: change >= 0 ? 'up' : 'down'
    };
  };

  const change = calculateChange();
  
  // Get average distance
  const getAverageDistance = () => {
    if (weeklyStats.length === 0) return 0;
    const total = weeklyStats.reduce((acc, curr) => acc + curr.total_distance, 0);
    return (total / weeklyStats.length).toFixed(1);
  };

  return (
    <Card className="col-span-2 border-none bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg group">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-600 to-indigo-600"></div>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold text-blue-800 flex items-center">
          <ChartLine className="mr-2 h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" />
          Progresso Semanal
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className={`text-xs px-3 py-1 rounded-full flex items-center 
            ${change.trend === 'up' 
              ? 'bg-green-100 text-green-700' 
              : change.trend === 'down' 
                ? 'bg-red-100 text-red-700' 
                : 'bg-gray-100 text-gray-700'}`}>
            {change.trend === 'up' ? (
              <ArrowUp className="h-3 w-3 mr-1" />
            ) : change.trend === 'down' ? (
              <ArrowDown className="h-3 w-3 mr-1" />
            ) : null}
            {change.percent}%
          </div>
          <Calendar className="h-4 w-4 text-blue-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={weeklyStats}
              margin={{ top: 20, right: 20, left: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
              <XAxis 
                dataKey="week_start" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                stroke="#6366F1"
                style={{ fontSize: '0.75rem' }}
              />
              <YAxis 
                stroke="#6366F1"
                style={{ fontSize: '0.75rem' }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)} km`, 'Distância']}
                labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '0.5rem',
                  border: '1px solid #E0E7FF',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <ReferenceLine 
                y={parseFloat(getAverageDistance())} 
                stroke="#4F46E5" 
                strokeDasharray="3 3"
                label={{ 
                  value: `Média: ${getAverageDistance()} km`, 
                  position: 'insideBottomRight',
                  fill: '#4F46E5',
                  fontSize: 12
                }}
              />
              <Line 
                type="monotone" 
                dataKey="total_distance" 
                stroke="#6366F1" 
                strokeWidth={3}
                activeDot={{ r: 6, fill: '#4F46E5', stroke: '#fff', strokeWidth: 2 }}
                dot={{ fill: '#6366F1', r: 4, strokeWidth: 2, stroke: '#fff' }}
                fillOpacity={1}
                fill="url(#colorDistance)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-blue-100 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
            <div className="text-xs text-blue-600 mb-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Esta Semana
            </div>
            <div className="text-2xl font-bold text-blue-800">
              {weeklyStats[weeklyStats.length - 1]?.total_distance.toFixed(1) || 0}
              <span className="text-sm font-normal text-blue-600 ml-1">km</span>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-blue-100 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
            <div className="text-xs text-blue-600 mb-1">Ritmo Médio</div>
            <div className="text-2xl font-bold text-blue-800">
              {weeklyStats[weeklyStats.length - 1]?.avg_pace.toFixed(2) || 0}
              <span className="text-sm font-normal text-blue-600 ml-1">min/km</span>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-blue-100 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
            <div className="text-xs text-blue-600 mb-1">Corridas</div>
            <div className="text-2xl font-bold text-blue-800">
              {weeklyStats[weeklyStats.length - 1]?.completed_runs || 0}
              <span className="text-sm font-normal text-blue-600 ml-1">total</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
