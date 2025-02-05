
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ChallengeRanking } from "./ChallengeRanking";

type Challenge = {
  id: string;
  title: string;
  yearly_goal: number;
  start_date: string;
  end_date: string;
  description?: string;
  difficulty?: string;
  visibility?: string;
};

interface ChallengesListProps {
  challenges: Challenge[];
  onDelete: (id: string) => void;
}

export function ChallengesList({ challenges, onDelete }: ChallengesListProps) {
  const handleDelete = async (id: string) => {
    try {
      // First, delete all associated running records
      const { error: recordsError } = await supabase
        .from('running_records')
        .delete()
        .eq('challenge_id', id);

      if (recordsError) {
        console.error("Error deleting associated records:", recordsError);
        toast.error("Erro ao deletar registros associados");
        return;
      }

      // Delete challenge participants
      const { error: participantsError } = await supabase
        .from('challenge_participants')
        .delete()
        .eq('challenge_id', id);

      if (participantsError) {
        console.error("Error deleting participants:", participantsError);
        toast.error("Erro ao deletar participantes");
        return;
      }

      // Then delete the challenge
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

  if (!challenges?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum desafio criado ainda
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {challenges.map((challenge) => (
        <div key={challenge.id} className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {challenge.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(challenge.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{challenge.yearly_goal} km</div>
              <div className="text-xs text-muted-foreground mt-1">
                De {new Date(challenge.start_date).toLocaleDateString()} até{" "}
                {new Date(challenge.end_date).toLocaleDateString()}
              </div>
              {challenge.description && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {challenge.description}
                </div>
              )}
              {challenge.difficulty && (
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    challenge.difficulty === 'fácil' 
                      ? 'bg-green-100 text-green-700'
                      : challenge.difficulty === 'médio'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {challenge.difficulty}
                  </span>
                  {challenge.visibility && (
                    <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                      {challenge.visibility}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          <ChallengeRanking challengeId={challenge.id} />
        </div>
      ))}
    </div>
  );
}
