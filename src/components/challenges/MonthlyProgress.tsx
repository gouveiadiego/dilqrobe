
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RunningRecord {
  id: string;
  user_id: string;
  challenge_id: string;
  distance: number;
  duration: number | null;
  date: string;
  notes: string | null;
}

export function MonthlyProgress() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<Array<{
    date: string;
    distance: number;
    formattedDate: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [monthStats, setMonthStats] = useState({
    totalDistance: 0,
    averagePace: 0,
    totalRuns: 0
  });

  // Formatar o nome do mês para exibição
  const formattedMonth = format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })
    .replace(/^\w/, (c) => c.toUpperCase());

  useEffect(() => {
    fetchMonthlyData();
  }, [currentMonth]);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.error("Usuário não autenticado");
        setLoading(false);
        return;
      }

      // Get current month range
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      // Create array with all days in month
      const daysInMonth = eachDayOfInterval({ start, end });
      
      // Initialize empty data for all days
      const initialData = daysInMonth.map(day => ({
        date: format(day, 'yyyy-MM-dd'),
        formattedDate: format(day, 'dd/MM'),
        distance: 0
      }));

      // Fetch records for this month
      const { data: records, error } = await supabase
        .from('running_records')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (error) {
        console.error("Erro ao buscar registros:", error);
        throw error;
      }

      // Process and aggregate the data by day
      const recordsByDay = new Map();
      let totalDistance = 0;
      let totalDuration = 0;

      if (records && records.length > 0) {
        records.forEach((record: RunningRecord) => {
          const recordDate = record.date.split('T')[0]; // Get YYYY-MM-DD part
          
          // Add to total stats
          totalDistance += Number(record.distance);
          totalDuration += Number(record.duration || 0);
          
          // Aggregate by day
          if (recordsByDay.has(recordDate)) {
            const existing = recordsByDay.get(recordDate);
            recordsByDay.set(recordDate, {
              distance: existing.distance + Number(record.distance),
              duration: existing.duration + Number(record.duration || 0),
              count: existing.count + 1
            });
          } else {
            recordsByDay.set(recordDate, {
              distance: Number(record.distance),
              duration: Number(record.duration || 0),
              count: 1
            });
          }
        });
      }

      // Merge records into the initial data
      const mergedData = initialData.map(day => {
        const dayData = recordsByDay.get(day.date);
        return {
          ...day,
          distance: dayData ? dayData.distance : 0
        };
      });

      setMonthlyData(mergedData);
      
      // Calculate month stats
      setMonthStats({
        totalDistance: Number(totalDistance.toFixed(1)),
        averagePace: totalDistance > 0 && totalDuration > 0 
          ? Number((totalDuration / totalDistance).toFixed(2)) 
          : 0,
        totalRuns: records?.length || 0
      });
      
      setLoading(false);
    } catch (error) {
      console.error("Erro ao processar dados mensais:", error);
      toast.error("Erro ao carregar dados do mês");
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' 
      ? subMonths(prev, 1) 
      : addMonths(prev, 1)
    );
  };

  // Get average distance for the month
  const averageDistance = monthlyData.length > 0
    ? Number((monthStats.totalDistance / daysWithActivity).toFixed(1))
    : 0;

  // Count days with running activity
  const daysWithActivity = monthlyData.filter(day => day.distance > 0).length;

  return (
    <Card className="col-span-2 border-none bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg group">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-600 to-purple-600"></div>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold text-indigo-800 flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-indigo-600 group-hover:text-indigo-700 transition-colors duration-300" />
          Progresso Mensal
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigateMonth('prev')}
            className="h-8 w-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="px-2 h-8 border-indigo-200 bg-white/80 text-indigo-700 hover:bg-indigo-100"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formattedMonth}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="month"
                onSelect={(date) => {
                  if (date) {
                    setCurrentMonth(date);
                    setCalendarOpen(false);
                  }
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigateMonth('next')}
            className="h-8 w-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[280px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="h-[280px]">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={monthlyData}
                  margin={{ top: 20, right: 20, left: 5, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorDistance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818CF8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#818CF8" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
                  <XAxis 
                    dataKey="formattedDate" 
                    stroke="#818CF8"
                    style={{ fontSize: '0.75rem' }}
                    interval={Math.ceil(monthlyData.length / 15)} // Show approximately 15 labels
                  />
                  <YAxis 
                    stroke="#818CF8"
                    style={{ fontSize: '0.75rem' }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)} km`, 'Distância']}
                    labelFormatter={(label) => `Dia ${label}`}
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '0.5rem',
                      border: '1px solid #E0E7FF',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  {daysWithActivity > 0 && (
                    <ReferenceLine 
                      y={averageDistance} 
                      stroke="#6366F1" 
                      strokeDasharray="3 3"
                      label={{ 
                        value: `Média: ${averageDistance} km`, 
                        position: 'insideBottomRight',
                        fill: '#6366F1',
                        fontSize: 12
                      }}
                    />
                  )}
                  <Line 
                    type="monotone" 
                    dataKey="distance" 
                    stroke="#818CF8" 
                    strokeWidth={3}
                    activeDot={{ r: 6, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
                    dot={{ r: 0 }} 
                    connectNulls
                    fillOpacity={1}
                    fill="url(#colorDistance)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-indigo-600">
                  <CalendarIcon className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p className="font-medium">Sem dados de corrida para {formattedMonth}</p>
                  <p className="text-sm text-indigo-500 mt-1">Registre suas corridas para ver estatísticas</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-indigo-100 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
            <div className="text-xs text-indigo-600 mb-1 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Total do Mês
            </div>
            <div className="text-2xl font-bold text-indigo-800">
              {monthStats.totalDistance}
              <span className="text-sm font-normal text-indigo-600 ml-1">km</span>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-indigo-100 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
            <div className="text-xs text-indigo-600 mb-1 flex items-center">
              <CalendarIcon className="h-3 w-3 mr-1" />
              Dias Ativos
            </div>
            <div className="text-2xl font-bold text-indigo-800">
              {daysWithActivity}
              <span className="text-sm font-normal text-indigo-600 ml-1">dias</span>
            </div>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-indigo-100 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]">
            <div className="text-xs text-indigo-600 mb-1 flex items-center">
              <CalendarIcon className="h-3 w-3 mr-1" />
              Corridas
            </div>
            <div className="text-2xl font-bold text-indigo-800">
              {monthStats.totalRuns}
              <span className="text-sm font-normal text-indigo-600 ml-1">total</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
