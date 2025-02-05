import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Challenge = {
  id: string;
  title: string;
  yearly_goal: number;
  start_date: string;
  end_date: string;
};

interface ChallengesListProps {
  challenges: Challenge[];
  onDelete: (id: string) => void;
}

export function ChallengesList({ challenges, onDelete }: ChallengesListProps) {
  const handleDelete = async (id: string) => {
    try {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {challenges.map((challenge) => (
        <Card key={challenge.id}>
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}