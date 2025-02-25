
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface NewRunFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export function NewRunForm({ onSuccess, onClose }: NewRunFormProps) {
  const navigate = useNavigate();
  const [newRun, setNewRun] = useState({
    distance: "",
    duration: "",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });

  const handleSubmit = async () => {
    try {
      if (!newRun.distance || !newRun.date) {
        toast.error("Por favor, preencha os campos obrigatórios");
        return;
      }

      console.log("Creating new run record...");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.error("No user session found");
        toast.error("Usuário não autenticado");
        navigate("/login");
        return;
      }

      // Get the latest running challenge
      const { data: latestChallenge, error: challengeError } = await supabase
        .from('running_challenges')
        .select('id')
        .eq('challenge_type', 'running')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (challengeError || !latestChallenge) {
        console.error("Error fetching latest challenge:", challengeError);
        toast.error("Nenhum desafio de corrida encontrado");
        return;
      }

      console.log("Latest challenge found:", latestChallenge);

      // Create run record
      const { error: runError } = await supabase.from('running_records').insert({
        user_id: session.user.id,
        challenge_id: latestChallenge.id,
        distance: parseFloat(newRun.distance),
        duration: newRun.duration ? parseInt(newRun.duration) : null,
        date: newRun.date,
        notes: newRun.notes
      });

      if (runError) {
        console.error("Error creating run record:", runError);
        throw runError;
      }

      // Update participant's total distance and runs
      const { error: participantError } = await supabase.rpc('update_challenge_rankings', {
        challenge_id: latestChallenge.id
      });

      if (participantError) {
        console.error("Error updating rankings:", participantError);
        toast.error("Erro ao atualizar ranking");
      }

      console.log("Run record created successfully");
      toast.success("Corrida registrada com sucesso!");
      onSuccess();
      onClose();
      setNewRun({
        distance: "",
        duration: "",
        date: new Date().toISOString().split('T')[0],
        notes: ""
      });
    } catch (error) {
      console.error("Error in handleNewRun:", error);
      toast.error("Erro ao registrar corrida");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="distance">Distância (km)</Label>
        <Input
          id="distance"
          type="number"
          step="0.01"
          value={newRun.distance}
          onChange={(e) => setNewRun(prev => ({ ...prev, distance: e.target.value }))}
          placeholder="Ex: 5.5"
        />
      </div>
      <div>
        <Label htmlFor="duration">Duração (minutos)</Label>
        <Input
          id="duration"
          type="number"
          value={newRun.duration}
          onChange={(e) => setNewRun(prev => ({ ...prev, duration: e.target.value }))}
          placeholder="Ex: 30"
        />
      </div>
      <div>
        <Label htmlFor="date">Data</Label>
        <Input
          id="date"
          type="date"
          value={newRun.date}
          onChange={(e) => setNewRun(prev => ({ ...prev, date: e.target.value }))}
        />
      </div>
      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={newRun.notes}
          onChange={(e) => setNewRun(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Adicione observações sobre sua corrida..."
        />
      </div>
      <Button onClick={handleSubmit} className="w-full">
        Registrar Corrida
      </Button>
    </div>
  );
}
