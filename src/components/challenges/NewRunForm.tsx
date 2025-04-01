
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parse } from "date-fns";

interface NewRunFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export function NewRunForm({ onSuccess, onClose }: NewRunFormProps) {
  const navigate = useNavigate();
  const today = new Date();
  const formattedToday = format(today, "yyyy-MM-dd");
  
  const [newRun, setNewRun] = useState({
    distance: "",
    duration: "",
    date: formattedToday,
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      if (!newRun.distance || !newRun.date) {
        toast.error("Por favor, preencha os campos obrigatórios");
        setIsSubmitting(false);
        return;
      }

      console.log("Creating new run record...");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.error("No user session found");
        toast.error("Usuário não autenticado");
        navigate("/login");
        setIsSubmitting(false);
        return;
      }

      // Get the latest challenge
      const { data: latestChallenge, error: challengeError } = await supabase
        .from('running_challenges')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (challengeError || !latestChallenge) {
        console.error("Error fetching latest challenge:", challengeError);
        toast.error("Nenhum desafio encontrado");
        setIsSubmitting(false);
        return;
      }

      console.log("Latest challenge found:", latestChallenge);

      // The date string is in format 'YYYY-MM-DD' and should be used directly
      // without any timezone conversion
      const runDate = newRun.date;
      console.log("Run date to be saved:", runDate);

      // Create run record
      const { error: runError } = await supabase.from('running_records').insert({
        user_id: session.user.id,
        challenge_id: latestChallenge.id,
        distance: parseFloat(newRun.distance),
        duration: newRun.duration ? parseInt(newRun.duration) : null,
        date: runDate,
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

      // Update or create weekly stats
      await updateWeeklyStats(session.user.id, latestChallenge.id, {
        distance: parseFloat(newRun.distance),
        duration: newRun.duration ? parseInt(newRun.duration) : 0,
        date: runDate
      });

      console.log("Run record created successfully");
      toast.success("Corrida registrada com sucesso!");
      onSuccess();
      onClose();
      setNewRun({
        distance: "",
        duration: "",
        date: formattedToday,
        notes: ""
      });
    } catch (error) {
      console.error("Error in handleNewRun:", error);
      toast.error("Erro ao registrar corrida");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateWeeklyStats = async (
    userId: string, 
    challengeId: string, 
    record: {distance: number, duration: number, date: string}
  ) => {
    try {
      // Get the start of the week (Sunday)
      // We need to parse the date string to a Date object,
      // but we need to ensure it's parsed in a timezone-safe way
      const recordDate = parse(record.date, "yyyy-MM-dd", new Date());
      const weekStart = new Date(recordDate);
      weekStart.setDate(recordDate.getDate() - recordDate.getDay());
      const weekStartString = format(weekStart, "yyyy-MM-dd");

      // Check if a weekly stats record already exists for this week
      const { data: existingStats, error: statsCheckError } = await supabase
        .from('running_weekly_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .eq('week_start', weekStartString)
        .maybeSingle();

      if (statsCheckError) {
        console.error("Error checking weekly stats:", statsCheckError);
        return;
      }

      if (existingStats) {
        // Update existing weekly stats
        const { error: updateError } = await supabase
          .from('running_weekly_stats')
          .update({
            total_distance: Number(existingStats.total_distance) + record.distance,
            total_duration: Number(existingStats.total_duration || 0) + record.duration,
            avg_pace: calculatePace(
              Number(existingStats.total_distance) + record.distance,
              Number(existingStats.total_duration || 0) + record.duration
            ),
            completed_runs: Number(existingStats.completed_runs || 0) + 1
          })
          .eq('id', existingStats.id);

        if (updateError) {
          console.error("Error updating weekly stats:", updateError);
        }
      } else {
        // Create new weekly stats
        const { error: createError } = await supabase
          .from('running_weekly_stats')
          .insert({
            user_id: userId,
            challenge_id: challengeId,
            week_start: weekStartString,
            total_distance: record.distance,
            total_duration: record.duration,
            avg_pace: record.duration > 0 ? record.duration / record.distance : 0,
            completed_runs: 1
          });

        if (createError) {
          console.error("Error creating weekly stats:", createError);
        }
      }

      console.log("Weekly stats updated successfully");
    } catch (error) {
      console.error("Error updating weekly stats:", error);
    }
  };

  const calculatePace = (distance: number, duration: number): number => {
    if (distance <= 0 || duration <= 0) return 0;
    return Number((duration / distance).toFixed(2));
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
      <Button 
        onClick={handleSubmit} 
        className="w-full" 
        disabled={isSubmitting}
      >
        {isSubmitting ? "Registrando..." : "Registrar Corrida"}
      </Button>
    </div>
  );
}
