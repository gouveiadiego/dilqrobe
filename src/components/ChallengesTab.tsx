
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, PersonStanding } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChallengesList } from "./challenges/ChallengesList";
import { ChallengeStats } from "./challenges/ChallengeStats";
import { WeeklyProgress } from "./challenges/WeeklyProgress";
import { Achievements } from "./challenges/Achievements";
import { NewChallengeForm } from "./challenges/NewChallengeForm";
import { NewRunForm } from "./challenges/NewRunForm";

export function ChallengesTab() {
  const navigate = useNavigate();
  const [newChallengeOpen, setNewChallengeOpen] = useState(false);
  const [newRunOpen, setNewRunOpen] = useState(false);
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
        navigate("/login");
      }
    };

    checkAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        console.log("Auth state changed: no session, redirecting to login");
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
            <NewChallengeForm 
              onSuccess={refetch} 
              onClose={() => setNewChallengeOpen(false)} 
            />
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
            <NewRunForm 
              onSuccess={refetch} 
              onClose={() => setNewRunOpen(false)} 
            />
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
