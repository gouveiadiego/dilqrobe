
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface NewGymSessionFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export function NewGymSessionForm({ onSuccess, onClose }: NewGymSessionFormProps) {
  const [newSession, setNewSession] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: "",
  });

  const handleSubmit = async () => {
    try {
      if (!newSession.duration || !newSession.date) {
        toast.error("Por favor, preencha todos os campos");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Get the latest gym challenge
      const { data: latestChallenge, error: challengeError } = await supabase
        .from('running_challenges')
        .select('id')
        .eq('challenge_type', 'gym')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (challengeError || !latestChallenge) {
        console.error("Error fetching latest challenge:", challengeError);
        toast.error("Nenhum desafio de academia encontrado");
        return;
      }

      const { error: recordError } = await supabase
        .from('gym_records')
        .insert({
          user_id: session.user.id,
          challenge_id: latestChallenge.id,
          date: newSession.date,
          duration: parseInt(newSession.duration),
        });

      if (recordError) {
        if (recordError.code === '23505') {
          toast.error("Já existe um registro para esta data");
        } else {
          throw recordError;
        }
        return;
      }

      toast.success("Sessão registrada com sucesso!");
      onSuccess();
      onClose();
      setNewSession({
        date: new Date().toISOString().split('T')[0],
        duration: "",
      });
    } catch (error) {
      console.error("Error in handleNewGymSession:", error);
      toast.error("Erro ao registrar sessão");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="date">Data</Label>
        <Input
          id="date"
          type="date"
          value={newSession.date}
          onChange={(e) => setNewSession(prev => ({ ...prev, date: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="duration">Duração (minutos)</Label>
        <Input
          id="duration"
          type="number"
          value={newSession.duration}
          onChange={(e) => setNewSession(prev => ({ ...prev, duration: e.target.value }))}
          placeholder="Ex: 60"
        />
      </div>
      <Button onClick={handleSubmit} className="w-full">
        Registrar Sessão
      </Button>
    </div>
  );
}
