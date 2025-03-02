
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Trash2, Users, Calendar, Flag, Target, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ChallengeRanking } from "./ChallengeRanking";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";

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
        <div key={challenge.id} className="space-y-4 animate-fade-in">
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
                    onClick={() => handleDelete(challenge.id)}
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
                    onClick={() => toggleExpand(challenge.id)}
                  >
                    {expandedChallenges[challenge.id] ? 'Ocultar detalhes' : 'Ver detalhes'}
                    <ArrowRight className={`h-3 w-3 ml-1 transition-transform duration-200 ${expandedChallenges[challenge.id] ? 'rotate-90' : ''}`} />
                  </Button>
                </div>
              </div>
              
              {challenge.description && (
                <div className="mt-2 text-sm text-gray-600">
                  {challenge.description}
                </div>
              )}
              
              {expandedChallenges[challenge.id] && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Progresso atual</div>
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-semibold text-indigo-800">65 km</div>
                        <div className="text-xs text-gray-600">65% concluído</div>
                      </div>
                      <Progress value={65} className="h-1.5" />
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Média semanal</div>
                      <div className="font-semibold text-indigo-800">12.5 km</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Participantes</div>
                      <div className="font-semibold text-indigo-800">8 corredores</div>
                    </div>
                  </div>
                  
                  <ChallengeRanking challengeId={challenge.id} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
