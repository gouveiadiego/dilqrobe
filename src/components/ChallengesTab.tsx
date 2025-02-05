import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, PersonStanding } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChallengesList } from "./challenges/ChallengesList";
import { ChallengeStats } from "./challenges/ChallengeStats";
import { WeeklyProgress } from "./challenges/WeeklyProgress";
import { Achievements } from "./challenges/Achievements";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChallengeRanking } from "./challenges/ChallengeRanking";

export function ChallengesTab() {
  const navigate = useNavigate();
  const [newChallengeOpen, setNewChallengeOpen] = useState(false);
  const [newRunOpen, setNewRunOpen] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    yearlyGoal: "",
    endDate: "",
    description: "",
    category: "",
    difficulty: "médio",
    visibility: "público"
  });
  const [newRun, setNewRun] = useState({
    distance: "",
    duration: "",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });
  const [currentStats, setCurrentStats] = useState({
    totalDistance: 0,
    percentageComplete: 0,
    currentChallenge: null
  });

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("No active session found, redirecting to login");
        toast.error("Por favor, faça login para acessar esta página");
        navigate("/login");
      }
    };

    checkAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        console.log("Auth state changed: no session, redirecting to login");
        toast.error("Sua sessão expirou. Por favor, faça login novamente");
        navigate("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const { data: challenges, isLoading, refetch } = useQuery({
    queryKey: ['running-challenges'],
    queryFn: async () => {
      console.log("Fetching challenges...");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("No session found during challenges fetch");
        throw new Error("No active session");
      }

      const { data, error } = await supabase
        .from('running_challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching challenges:", error);
        toast.error("Erro ao carregar desafios");
        throw error;
      }

      console.log("Challenges fetched:", data);
      return data;
    },
    retry: false,
    meta: {
      onError: (error: Error) => {
        console.error("Query error:", error);
        if (error.message === "No active session") {
          navigate("/login");
        }
      }
    }
  });

  const { data: records } = useQuery({
    queryKey: ['running-records'],
    queryFn: async () => {
      console.log("Fetching running records...");
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("No session found during records fetch");
        throw new Error("No active session");
      }

      const { data, error } = await supabase
        .from('running_records')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error("Error fetching records:", error);
        toast.error("Erro ao carregar registros");
        throw error;
      }

      console.log("Records fetched:", data);
      return data;
    },
    retry: false,
    meta: {
      onError: (error: Error) => {
        console.error("Query error:", error);
        if (error.message === "No active session") {
          navigate("/login");
        }
      }
    }
  });

  useEffect(() => {
    if (challenges?.length > 0 && records) {
      const latestChallenge = challenges[0];
      const challengeRecords = records.filter(r => r.challenge_id === latestChallenge.id);
      const totalDistance = challengeRecords.reduce((acc, curr) => acc + Number(curr.distance), 0);
      const percentageComplete = (totalDistance / Number(latestChallenge.yearly_goal)) * 100;

      setCurrentStats({
        totalDistance,
        percentageComplete,
        currentChallenge: latestChallenge
      });
    }
  }, [challenges, records]);

  const { data: weeklyStats } = useQuery({
    queryKey: ['weekly-stats'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No active session");

      const { data, error } = await supabase
        .from('running_weekly_stats')
        .select('*')
        .eq('user_id', session.user.id)
        .order('week_start', { ascending: true });

      if (error) {
        console.error("Error fetching weekly stats:", error);
        toast.error("Erro ao carregar estatísticas semanais");
        throw error;
      }

      return data || [];
    },
    meta: {
      onError: (error: Error) => {
        console.error("Query error:", error);
        if (error.message === "No active session") {
          navigate("/login");
        }
      }
    }
  });

  const { data: achievements } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("No active session");

      const { data, error } = await supabase
        .from('running_badges')
        .select('*')
        .eq('user_id', session.user.id)
        .order('earned_at', { ascending: false });

      if (error) {
        console.error("Error fetching achievements:", error);
        toast.error("Erro ao carregar conquistas");
        throw error;
      }

      return data || [];
    },
    meta: {
      onError: (error: Error) => {
        console.error("Query error:", error);
        if (error.message === "No active session") {
          navigate("/login");
        }
      }
    }
  });

  const handleNewChallenge = async () => {
    try {
      if (!newChallenge.title || !newChallenge.yearlyGoal || !newChallenge.endDate) {
        toast.error("Por favor, preencha todos os campos obrigatórios");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast.error("Usuário não autenticado");
        navigate("/login");
        return;
      }

      const { error } = await supabase.from('running_challenges').insert({
        user_id: session.user.id,
        title: newChallenge.title,
        yearly_goal: parseFloat(newChallenge.yearlyGoal),
        end_date: newChallenge.endDate,
        start_date: new Date().toISOString().split('T')[0],
        description: newChallenge.description,
        category: newChallenge.category,
        difficulty: newChallenge.difficulty,
        visibility: newChallenge.visibility
      });

      if (error) throw error;

      toast.success("Desafio criado com sucesso!");
      setNewChallengeOpen(false);
      refetch();
      setNewChallenge({
        title: "",
        yearlyGoal: "",
        endDate: "",
        description: "",
        category: "",
        difficulty: "médio",
        visibility: "público"
      });
    } catch (error) {
      console.error("Error in handleNewChallenge:", error);
      toast.error("Erro ao criar desafio");
    }
  };

  const handleNewRun = async () => {
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
        // Don't throw here, as the run was already recorded
        toast.error("Erro ao atualizar ranking");
      }

      console.log("Run record created successfully");
      toast.success("Corrida registrada com sucesso!");
      setNewRunOpen(false);
      refetch();
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

  const handleDeleteChallenge = (id: string) => {
    refetch();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Desafios de Corrida</h2>
        <p className="text-muted-foreground">
          Acompanhe seus objetivos e celebre suas conquistas
        </p>
      </div>

      <ChallengeStats currentStats={currentStats} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WeeklyProgress weeklyStats={weeklyStats || []} />
        <Achievements achievements={achievements || []} />
      </div>

      <div className="flex gap-4">
        <Dialog open={newChallengeOpen} onOpenChange={setNewChallengeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Trophy className="mr-2 h-4 w-4" />
              Novo Desafio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Desafio</DialogTitle>
              <DialogDescription>
                Defina as metas do seu novo desafio de corrida
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título do Desafio</Label>
                <Input
                  id="title"
                  value={newChallenge.title}
                  onChange={(e) => setNewChallenge(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Desafio 2024"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva seu desafio..."
                />
              </div>
              <div>
                <Label htmlFor="yearlyGoal">Meta Anual (km)</Label>
                <Input
                  id="yearlyGoal"
                  type="number"
                  value={newChallenge.yearlyGoal}
                  onChange={(e) => setNewChallenge(prev => ({ ...prev, yearlyGoal: e.target.value }))}
                  placeholder="Ex: 2025"
                />
              </div>
              <div>
                <Label htmlFor="difficulty">Dificuldade</Label>
                <Select
                  value={newChallenge.difficulty}
                  onValueChange={(value) => setNewChallenge(prev => ({ ...prev, difficulty: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a dificuldade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fácil">Fácil</SelectItem>
                    <SelectItem value="médio">Médio</SelectItem>
                    <SelectItem value="difícil">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="visibility">Visibilidade</Label>
                <Select
                  value={newChallenge.visibility}
                  onValueChange={(value) => setNewChallenge(prev => ({ ...prev, visibility: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a visibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="público">Público</SelectItem>
                    <SelectItem value="privado">Privado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newChallenge.endDate}
                  onChange={(e) => setNewChallenge(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <Button onClick={handleNewChallenge} className="w-full">
                Criar Desafio
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={newRunOpen} onOpenChange={setNewRunOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <PersonStanding className="mr-2 h-4 w-4" />
              Registrar Corrida
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nova Corrida</DialogTitle>
              <DialogDescription>
                Registre os detalhes da sua corrida
              </DialogDescription>
            </DialogHeader>
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
              <Button onClick={handleNewRun} className="w-full">
                Registrar Corrida
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Seus Desafios</h3>
        <ChallengesList 
          challenges={challenges || []} 
          onDelete={handleDeleteChallenge} 
        />
      </div>
    </div>
  );
}
