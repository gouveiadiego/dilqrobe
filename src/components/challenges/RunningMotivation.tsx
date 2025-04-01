
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Heart, Zap, Target, Medal, Rocket, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export function RunningMotivation() {
  const [quote, setQuote] = useState("");
  const [streak, setStreak] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);

  // Lista de citações motivacionais
  const motivationalQuotes = [
    "Correr não é apenas sobre a distância, mas sobre o que você descobre ao longo do caminho.",
    "Cada passo que você dá é uma vitória contra a inércia.",
    "A corrida de hoje é um investimento na saúde de amanhã.",
    "Se você está cansado demais para correr, corra para não ficar cansado.",
    "O único mau treino é aquele que não aconteceu.",
    "A dor é temporária, mas a satisfação de superar seus limites é para sempre.",
    "Não importa o quão devagar você vá, desde que não pare.",
    "O corpo atinge o que a mente acredita.",
    "Não conte os dias, faça os dias contarem."
  ];

  // Fetch total distance for the current user
  const { data: records } = useQuery({
    queryKey: ['running-records-for-motivation'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No active session");

      const { data, error } = await supabase
        .from('running_records')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error("Error fetching records for motivation:", error);
        throw error;
      }

      return data || [];
    }
  });

  // Calculate stats based on records
  useEffect(() => {
    if (records && records.length > 0) {
      // Calcular distância total
      const distance = records.reduce((total, record) => total + Number(record.distance), 0);
      setTotalDistance(Number(distance.toFixed(1)));
      
      // Calcular calorias (estimativa: ~62 calorias por km)
      setCaloriesBurned(Math.round(distance * 62));
      
      // Calcular sequência atual
      if (records.length > 0) {
        // Ordenar registros por data (mais recente primeiro)
        const sortedRecords = [...records].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        let currentStreak = 1;
        let lastDate = new Date(sortedRecords[0].date);
        
        // Verificar dias consecutivos
        for (let i = 1; i < sortedRecords.length; i++) {
          const currentDate = new Date(sortedRecords[i].date);
          const diffDays = Math.round(
            (lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (diffDays === 1) {
            currentStreak++;
            lastDate = currentDate;
          } else {
            break;
          }
        }
        
        setStreak(currentStreak);
      }
    }
    
    // Definir citação aleatória
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setQuote(motivationalQuotes[randomIndex]);
  }, [records]);

  return (
    <Card className="border-none bg-gradient-to-br from-amber-50 to-rose-50 overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg group">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-500 to-rose-500"></div>
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-semibold text-amber-800">
          Motivação
        </CardTitle>
        <Flame className="h-5 w-5 text-orange-500" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {/* Citação motivacional */}
          <div className="bg-white/60 p-3 rounded-xl mb-4 italic text-sm text-amber-800 border border-amber-100/50">
            "{quote}"
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white/40 p-2 rounded-lg flex flex-col items-center">
              <Zap className="h-4 w-4 text-orange-500 mb-1" />
              <span className="text-lg font-bold text-amber-800">{streak}</span>
              <span className="text-xs text-amber-600">Dias seguidos</span>
            </div>
            
            <div className="bg-white/40 p-2 rounded-lg flex flex-col items-center">
              <Target className="h-4 w-4 text-green-500 mb-1" />
              <span className="text-lg font-bold text-amber-800">{totalDistance}</span>
              <span className="text-xs text-amber-600">Km total</span>
            </div>
            
            <div className="bg-white/40 p-2 rounded-lg flex flex-col items-center">
              <Flame className="h-4 w-4 text-rose-500 mb-1" />
              <span className="text-lg font-bold text-amber-800">{caloriesBurned}</span>
              <span className="text-xs text-amber-600">Kcal</span>
            </div>
          </div>
          
          {/* Próximo treino recomendado */}
          <div className="bg-gradient-to-r from-orange-100 to-rose-100 p-3 rounded-lg border border-amber-200/50">
            <div className="flex items-center text-amber-800 font-medium mb-1">
              <Rocket className="h-4 w-4 mr-1 text-orange-500" />
              <span>Próximo treino recomendado</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-amber-600" />
                <span className="text-sm text-amber-700">
                  {new Date().toLocaleDateString('pt-BR', {weekday: 'long', month: 'long', day: 'numeric'})}
                </span>
              </div>
              <div className="text-xs font-medium px-2 py-1 bg-amber-100 rounded-full text-amber-800">
                30 min
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
