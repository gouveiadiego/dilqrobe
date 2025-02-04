import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, PersonStanding, ChartLine, Medal, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

export function ChallengesTab() {
  const [newChallengeOpen, setNewChallengeOpen] = useState(false);
  const [newRunOpen, setNewRunOpen] = useState(false);
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    yearlyGoal: "",
    endDate: ""
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

  const { data: challenges, isLoading, refetch } = useQuery({
    queryKey: ['running-challenges'],
    queryFn: async () => {
      console.log("Fetching challenges...");
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
    }
  });

  const { data: records } = useQuery({
    queryKey: ['running-records'],
    queryFn: async () => {
      console.log("Fetching running records...");
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

  const handleNewChallenge = async () => {
    try {
      if (!newChallenge.title || !newChallenge.yearlyGoal || !newChallenge.endDate) {
        toast.error("Por favor, preencha todos os campos");
        return;
      }

      console.log("Creating new challenge...");
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        console.error("No user session found");
        toast.error("Usuário não autenticado");
        return;
      }

      const { error } = await supabase.from('running_challenges').insert({
        user_id: session.session.user.id,
        title: newChallenge.title,
        yearly_goal: parseFloat(newChallenge.yearlyGoal),
        end_date: newChallenge.endDate,
        start_date: new Date().toISOString().split('T')[0]
      });

      if (error) {
        console.error("Error creating challenge:", error);
        throw error;
      }

      console.log("Challenge created successfully");
      toast.success("Desafio criado com sucesso!");
      setNewChallengeOpen(false);
      refetch();
      setNewChallenge({ title: "", yearlyGoal: "", endDate: "" });
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
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        console.error("No user session found");
        toast.error("Usuário não autenticado");
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

      const { error } = await supabase.from('running_records').insert({
        user_id: session.session.user.id,
        challenge_id: latestChallenge.id,
        distance: parseFloat(newRun.distance),
        duration: newRun.duration ? parseInt(newRun.duration) : null,
        date: newRun.date,
        notes: newRun.notes
      });

      if (error) {
        console.error("Error creating run record:", error);
        throw error;
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Desafios de Corrida</h2>
        <p className="text-muted-foreground">
          Acompanhe seus objetivos e celebre suas conquistas
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desafio Atual</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentStats.currentChallenge?.yearly_goal || 0} km
            </div>
            <p className="text-xs text-muted-foreground">
              Meta para o ano
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distância Total</CardTitle>
            <PersonStanding className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.totalDistance.toFixed(1)} km</div>
            <p className="text-xs text-muted-foreground">
              {currentStats.percentageComplete.toFixed(1)}% da meta alcançada
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ranking</CardTitle>
            <Medal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3º lugar</div>
            <p className="text-xs text-muted-foreground">
              Entre todos os participantes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartLine className="h-5 w-5" />
              Progresso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Gráfico de progresso será implementado aqui
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div className="flex-1">
                  <div className="font-medium">João Silva</div>
                  <div className="text-sm text-muted-foreground">750 km</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div className="flex-1">
                  <div className="font-medium">Maria Santos</div>
                  <div className="text-sm text-muted-foreground">680 km</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div className="flex-1">
                  <div className="font-medium">Você</div>
                  <div className="text-sm text-muted-foreground">{currentStats.totalDistance.toFixed(1)} km</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons with Dialogs */}
      <div className="flex gap-4">
        <Dialog open={newChallengeOpen} onOpenChange={setNewChallengeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Trophy className="mr-2 h-4 w-4" />
              Novo Desafio
            </Button>
          </DialogTrigger>
          <DialogContent>
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
    </div>
  );
}