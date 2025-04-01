import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, PersonStanding, ChevronDown, Plus, Calendar, Award, Medal, Target, ChartLine } from "lucide-react";
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
import { MonthlyProgress } from "./challenges/MonthlyProgress";
import { RunningMotivation } from "./challenges/RunningMotivation";
import { NewChallengeForm } from "./challenges/NewChallengeForm";
import { NewRunForm } from "./challenges/NewRunForm";
import { RunningRecordsList } from "./challenges/RunningRecordsList";
import { ChallengeRanking } from "./challenges/ChallengeRanking"; 
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export function ChallengesTab() {
  const navigate = useNavigate();
  const [newChallengeOpen, setNewChallengeOpen] = useState(false);
  const [newRunOpen, setNewRunOpen] = useState(false);
  const [currentStats, setCurrentStats] = useState({
    totalDistance: 0,
    percentageComplete: 0,
    currentChallenge: null
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [userHasRecords, setUserHasRecords] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("No active session found, redirecting to login");
        navigate("/login");
      } else {
        setCurrentUserId(session.user.id);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        console.log("Auth state changed: no session, redirecting to login");
        navigate("/login");
        setCurrentUserId(null);
      } else {
        setCurrentUserId(session.user.id);
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

  const { data: records, refetch: refetchRecords } = useQuery({
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
    if (records && currentUserId) {
      const userRecords = records.filter(record => record.user_id === currentUserId);
      setUserHasRecords(userRecords.length > 0);
    } else {
      setUserHasRecords(false);
    }
  }, [records, currentUserId]);

  useEffect(() => {
    if (challenges?.length > 0 && records && currentUserId) {
      const latestChallenge = challenges[0];
      
      const challengeRecords = records.filter(
        r => r.challenge_id === latestChallenge.id && r.user_id === currentUserId
      );
      
      const totalDistance = challengeRecords.reduce((acc, curr) => acc + Number(curr.distance), 0);
      const percentageComplete = totalDistance > 0 
        ? (totalDistance / Number(latestChallenge.yearly_goal)) * 100 
        : 0;

      setCurrentStats({
        totalDistance,
        percentageComplete,
        currentChallenge: latestChallenge
      });
    }
  }, [challenges, records, currentUserId]);

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

  const handleRecordUpdate = () => {
    refetchRecords();
    refetch();
  };

  const userRecords = records ? records.filter(record => record.user_id === currentUserId) : [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden bg-gradient-to-r from-dilq-indigo via-dilq-purple to-dilq-vibrant rounded-2xl shadow-lg transition-all duration-300 transform hover:shadow-xl">
        <div className="absolute inset-0 bg-[url('/public/lovable-uploads/e5c52c62-67c0-4d6c-8b97-6b0b3771a57f1.png')] bg-cover bg-center opacity-10"></div>
        <div className="relative z-10 p-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-2 text-white flex items-center">
              <Trophy className="mr-2 h-8 w-8 text-amber-300" />
              Desafios de Corrida
            </h2>
            <p className="text-blue-100 text-lg">
              Supere seus limites, alcance novas metas e transforme seu estilo de vida através de desafios motivadores.
            </p>
            
            <div className="flex gap-4 mt-6">
              <Dialog open={newChallengeOpen} onOpenChange={setNewChallengeOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-white/15 backdrop-blur-md hover:bg-white/25 text-white border border-white/20 shadow-xl transition-all duration-300 hover:shadow-indigo-500/20">
                    <Trophy className="mr-2 h-4 w-4" />
                    Criar Desafio
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-white/95 backdrop-blur-xl border border-indigo-100 shadow-xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-indigo-800 flex items-center">
                      <Trophy className="mr-2 h-5 w-5 text-amber-500" />
                      Criar Novo Desafio
                    </DialogTitle>
                    <DialogDescription className="text-indigo-600">
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
                  <Button variant="outline" className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20 shadow-xl transition-all duration-300 hover:shadow-indigo-500/20">
                    <PersonStanding className="mr-2 h-4 w-4" />
                    Registrar Corrida
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white/95 backdrop-blur-xl border border-indigo-100 shadow-xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-indigo-800 flex items-center">
                      <PersonStanding className="mr-2 h-5 w-5 text-green-500" />
                      Registrar Nova Corrida
                    </DialogTitle>
                    <DialogDescription className="text-indigo-600">
                      Registre os detalhes da sua corrida
                    </DialogDescription>
                  </DialogHeader>
                  <NewRunForm 
                    onSuccess={handleRecordUpdate} 
                    onClose={() => setNewRunOpen(false)} 
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {userHasRecords && <ChallengeStats currentStats={currentStats} />}

      <Tabs defaultValue="overview" className="w-full" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-8 bg-gray-100/50 backdrop-blur-sm p-1 rounded-xl">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md transition-all duration-300 rounded-lg flex items-center justify-center py-3">
            <ChartLine className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="challenges" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md transition-all duration-300 rounded-lg flex items-center justify-center py-3">
            <Trophy className="h-4 w-4 mr-2" />
            Desafios
          </TabsTrigger>
          {userHasRecords && (
            <TabsTrigger value="records" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md transition-all duration-300 rounded-lg flex items-center justify-center py-3">
              <Calendar className="h-4 w-4 mr-2" />
              Corridas
            </TabsTrigger>
          )}
          <TabsTrigger value="ranking" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md transition-all duration-300 rounded-lg flex items-center justify-center py-3">
            <Medal className="h-4 w-4 mr-2" />
            Ranking
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 animate-fade-in">
          {userHasRecords ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <WeeklyProgress weeklyStats={weeklyStats || []} />
                <RunningMotivation />
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <MonthlyProgress />
              </div>
            </div>
          ) : (
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-gray-100 shadow-sm text-center">
              <h3 className="text-xl font-semibold mb-4 text-indigo-800">Bem-vindo aos Desafios de Corrida!</h3>
              <p className="text-gray-600 mb-6">Registre sua primeira corrida para visualizar estatísticas e acompanhar seu progresso.</p>
              <Button 
                onClick={() => setNewRunOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <PersonStanding className="mr-2 h-4 w-4" />
                Registrar Primeira Corrida
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="challenges" className="animate-fade-in">
          <div className="bg-white/50 backdrop-blur-sm p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-semibold mb-6 flex items-center text-indigo-800">
              <Target className="h-5 w-5 mr-2 text-indigo-600" />
              Desafios Disponíveis
            </h3>
            <ChallengesList 
              challenges={challenges || []} 
              onDelete={handleDeleteChallenge} 
            />
          </div>
        </TabsContent>
        
        {userHasRecords && (
          <TabsContent value="records" className="animate-fade-in">
            <div className="bg-white/50 backdrop-blur-sm p-6 rounded-xl border border-gray-100 shadow-sm">
              <RunningRecordsList 
                records={userRecords || []}
                onUpdate={handleRecordUpdate}
              />
            </div>
          </TabsContent>
        )}
        
        <TabsContent value="ranking" className="animate-fade-in">
          <div className="bg-white/50 backdrop-blur-sm p-6 rounded-xl border border-gray-100 shadow-sm">
            {challenges && challenges.length > 0 && (
              <ChallengeRanking challengeId={challenges[0].id} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
