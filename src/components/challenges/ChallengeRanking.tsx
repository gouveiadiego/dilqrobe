
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ChallengeRankingProps {
  challengeId: string;
}

export function ChallengeRanking({ challengeId }: ChallengeRankingProps) {
  const { data: participants, isLoading } = useQuery({
    queryKey: ['challenge-participants', challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('*, user_id')
        .eq('challenge_id', challengeId)
        .order('ranking', { ascending: true });

      if (error) {
        console.error("Error fetching participants:", error);
        throw error;
      }

      return data || [];
    },
  });

  const handleJoinChallenge = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado para participar");
        return;
      }

      const { error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: session.user.id
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast.error("Você já está participando deste desafio");
        } else {
          console.error("Error joining challenge:", error);
          toast.error("Erro ao participar do desafio");
        }
        return;
      }

      toast.success("Você agora está participando do desafio!");
    } catch (error) {
      console.error("Error in handleJoinChallenge:", error);
      toast.error("Erro ao participar do desafio");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Carregando participantes...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Ranking
        </CardTitle>
        <Button onClick={handleJoinChallenge} variant="outline" size="sm">
          <Users className="mr-2 h-4 w-4" />
          Participar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {participants?.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Nenhum participante ainda. Seja o primeiro!
            </div>
          ) : (
            participants?.map((participant, index) => (
              <div
                key={participant.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                  index === 1 ? 'bg-gray-50 dark:bg-gray-800/50' :
                  index === 2 ? 'bg-amber-50 dark:bg-amber-900/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-500 text-white' :
                    index === 2 ? 'bg-amber-500 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {participant.ranking}
                  </div>
                  <div>
                    <div className="font-medium">Participante {participant.ranking}</div>
                    <div className="text-sm text-muted-foreground">
                      {participant.total_distance.toFixed(1)} km percorridos
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {participant.total_runs} corridas
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
