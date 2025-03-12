
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Trash2, Users, Calendar, Flag, Target, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ChallengeRanking } from "./ChallengeRanking";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";

type Challenge = {
  id: string;
  title: string;
  yearly_goal: number;
  start_date: string;
  end_date: string;
  description?: string;
  difficulty?: string;
  visibility?: string;
  user_id: string;
};

interface ChallengesListProps {
  challenges: Challenge[];
  onDelete: (id: string) => void;
}

export function ChallengesList({ challenges, onDelete }: ChallengesListProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [expandedChallenges, setExpandedChallenges] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);
    };
    getUser();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedChallenges(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDelete = async (id: string) => {
    try {
      console.log("Deleting challenge:", id);
      const { error } = await supabase
        .from('running_challenges')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting challenge:", error);
        toast.error("Erro ao deletar desafio");
        return;
      }

      toast.success("Desafio deletado com sucesso!");
      onDelete(id);
    } catch (error) {
      console.error("Error in handleDelete:", error);
      toast.error("Erro ao deletar desafio");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'fácil': return 'bg-green-100 text-green-700 border-green-200';
      case 'médio': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'difícil': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  if (!challenges?.length) {
    return (
      <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
        <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h4 className="text-lg font-medium text-gray-700 mb-2">Nenhum desafio disponível</h4>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          Crie seu primeiro desafio para começar a acompanhar seu progresso de corrida.
        </p>
        <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700">
          <Trophy className="h-4 w-4 mr-2" />
          Criar Novo Desafio
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {challenges.map((challenge) => (
        <ChallengeItem 
          key={challenge.id} 
          challenge={challenge} 
          currentUserId={currentUserId} 
          isExpanded={expandedChallenges[challenge.id] || false}
          onToggleExpand={() => toggleExpand(challenge.id)}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}

interface ChallengeItemProps {
  challenge: Challenge;
  currentUserId: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: (id: string) => void;
}

function ChallengeItem({ challenge, currentUserId, isExpanded, onToggleExpand, onDelete }: ChallengeItemProps) {
  // Fetch challenge records to calculate stats
  const { data: records } = useQuery({
    queryKey: ['challenge-records', challenge.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('running_records')
        .select('*')
        .eq('challenge_id', challenge.id);

      if (error) {
        console.error("Error fetching records:", error);
        throw error;
      }
      
      return data || [];
    },
  });

  // Fetch challenge participants
  const { data: participants } = useQuery({
    queryKey: ['challenge-participants', challenge.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select(`
          *,
          profiles:profiles(username, full_name, avatar_url)
        `)
        .eq('challenge_id', challenge.id);

      if (error) {
        console.error("Error fetching participants:", error);
        throw error;
      }

      return data || [];
    },
  });

  // Calculate current user's progress
  const userRecords = records?.filter(record => record.user_id === currentUserId) || [];
  const totalDistance = userRecords.reduce((sum, record) => sum + Number(record.distance), 0);
  const percentComplete = challenge.yearly_goal > 0 
    ? Math.min(100, (totalDistance / challenge.yearly_goal) * 100) 
    : 0;
  
  // Calculate weekly average distance
  const calculateWeeklyAverage = () => {
    if (!records || records.length === 0) return 0;
    
    // Get the earliest and latest record dates
    const dates = records
      .filter(record => record.user_id === currentUserId)
      .map(record => new Date(record.date).getTime());
    
    if (dates.length === 0) return 0;
    
    const earliestDate = new Date(Math.min(...dates));
    const latestDate = new Date(Math.max(...dates));
    
    // Calculate number of weeks (minimum 1)
    const weeksDiff = Math.max(1, Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    
    return parseFloat((totalDistance / weeksDiff).toFixed(1));
  };

  const weeklyAverage = calculateWeeklyAverage();

  // Get participants count
  const participantsCount = participants?.length || 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'fácil': return 'bg-green-100 text-green-700 border-green-200';
      case 'médio': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'difícil': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="border-none overflow-hidden bg-white backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md group">
        <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-indigo-500 to-purple-600"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold text-indigo-900 flex items-center">
            <Trophy className="h-4 w-4 mr-2 text-indigo-500" />
            {challenge.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {challenge.visibility === 'público' && (
              <div className="text-xs flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                <Users className="h-3 w-3 mr-1" />
                Público
              </div>
            )}
            {currentUserId === challenge.user_id && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => onDelete(challenge.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div>
              <div className="text-2xl font-bold text-indigo-800">{challenge.yearly_goal} <span className="text-lg font-normal text-indigo-600">km</span></div>
              <div className="text-xs text-gray-500 mt-1 flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                De {new Date(challenge.start_date).toLocaleDateString('pt-BR')} até{" "}
                {new Date(challenge.end_date).toLocaleDateString('pt-BR')}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {challenge.difficulty && (
                <span className={`text-xs px-3 py-1 rounded-full border ${getDifficultyColor(challenge.difficulty)} flex items-center`}>
                  <Flag className="h-3 w-3 mr-1" />
                  {challenge.difficulty}
                </span>
              )}
              
              <Button 
                variant="outline"
                size="sm"
                className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                onClick={onToggleExpand}
              >
                {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                <ArrowRight className={`h-3 w-3 ml-1 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
              </Button>
            </div>
          </div>
          
          {challenge.description && (
            <div className="mt-2 text-sm text-gray-600">
              {challenge.description}
            </div>
          )}
          
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Progresso atual</div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-semibold text-indigo-800">{totalDistance.toFixed(1)} km</div>
                    <div className="text-xs text-gray-600">{percentComplete.toFixed(0)}% concluído</div>
                  </div>
                  <Progress value={percentComplete} className="h-1.5" />
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Média semanal</div>
                  <div className="font-semibold text-indigo-800">{weeklyAverage} km</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Participantes</div>
                  <div className="font-semibold text-indigo-800">{participantsCount} corredores</div>
                </div>
              </div>
              
              <ChallengeRanking challengeId={challenge.id} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
