
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  Check,
  Star, 
  ListCheck, 
  Edit, 
  Plus, 
  Clock, 
  Flame,
  ArrowLeft,
  ArrowRight,
  XCircle,
  Target,
  List,
  Trash2,
  Trophy,
  Timer,
  Zap,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HabitForm } from "./HabitForm";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format, startOfWeek, endOfWeek, isWithinInterval, addDays, isSameDay, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

type Habit = {
  id: string;
  title: string;
  description?: string;
  frequency: "daily" | "weekly";
  streak: number;
  completed: boolean;
  progress: number;
  schedule_days: string[];
  schedule_time?: string;
  status: "pending" | "completed" | "missed";
  best_streak?: number;
};

type HabitLog = {
  id: string;
  habit_id: string;
  user_id: string;
  date: string;
  notes?: string;
  mood?: string;
  habit_title?: string;
};

type DBHabit = {
  id: string;
  title: string;
  description?: string;
  active: boolean;
  streak: number;
  best_streak?: number;
  schedule_days: string[];
  schedule_time?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  positive_reinforcement?: string[];
};

// Motivational messages for different occasions
const motivationalMessages = [
  "Você está construindo um futuro melhor, um hábito de cada vez! 💪",
  "Manter a consistência é a chave do sucesso! 🔑",
  "Pequenas ações diárias levam a grandes mudanças! 🌱",
  "Você é mais forte do que pensa! Continue assim! ⭐",
  "Cada hábito completado é uma vitória! Parabéns! 🏆"
];

// Anti-procrastination tips
const antiProcrastinationTips = [
  "Divida a tarefa em passos menores e mais gerenciáveis.",
  "Use a técnica Pomodoro: 25 minutos de foco, 5 de descanso.",
  "Elimine distrações do seu ambiente antes de começar.",
  "Estabeleça um horário específico para o hábito todos os dias.",
  "Visualize os benefícios de longo prazo do seu hábito.",
  "Recompense-se após completar seu hábito hoje.",
  "Comprometa-se publicamente com seus objetivos.",
  "Use a regra dos 2 minutos: comece apenas por 2 minutos."
];

// Rewards for streaks
const streakRewards = [
  { days: 3, message: "3 dias consecutivos! Você está criando momentum!" },
  { days: 7, message: "Uma semana completa! Você está no caminho certo!" },
  { days: 14, message: "Duas semanas! Seu hábito está começando a se formar!" },
  { days: 21, message: "21 dias! Você está próximo de automatizar este hábito!" },
  { days: 30, message: "Um mês inteiro! Que consistência impressionante!" },
  { days: 60, message: "Dois meses! Você é imparável!" },
  { days: 90, message: "Três meses! Este hábito agora faz parte de quem você é!" },
  { days: 180, message: "Seis meses! Você é uma verdadeira inspiração!" },
  { days: 365, message: "Um ano inteiro! Você é extraordinário!" }
];

type StreakProgressType = {
  current: number;
  next: number;
  nextMilestone: number;
};

export function HabitsTab() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("ativos");
  const [totalCompletedHabits, setTotalCompletedHabits] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [weeklyHabits, setWeeklyHabits] = useState<HabitLog[]>([]);
  const [showWeeklyHabits, setShowWeeklyHabits] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [focusHabit, setFocusHabit] = useState<Habit | null>(null);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [earnedReward, setEarnedReward] = useState<string>("");
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [currentTip, setCurrentTip] = useState<string>("");
  const [streakProgress, setStreakProgress] = useState<Record<string, StreakProgressType>>({});

  useEffect(() => {
    fetchHabits();
    requestNotificationPermission();
    checkShowDailyTip();
  }, []);

  useEffect(() => {
    if (habits.length > 0) {
      calculateStats();
      calculateStreakProgress();
    }
  }, [habits]);

  const calculateStats = () => {
    const completed = habits.filter(habit => habit.completed).length;
    setTotalCompletedHabits(completed);

    const maxStreak = Math.max(...habits.map(habit => habit.streak));
    setLongestStreak(maxStreak);
  };

  const calculateStreakProgress = () => {
    const progress: Record<string, StreakProgressType> = {};
    
    habits.forEach(habit => {
      const currentStreak = habit.streak;
      let nextMilestone = 3;
      
      for (const reward of streakRewards) {
        if (reward.days > currentStreak) {
          nextMilestone = reward.days;
          break;
        }
      }
      
      progress[habit.id] = {
        current: currentStreak,
        next: nextMilestone,
        nextMilestone: Math.round((currentStreak / nextMilestone) * 100)
      };
    });
    
    setStreakProgress(progress);
  };

  const checkShowDailyTip = () => {
    const lastTipDate = localStorage.getItem('lastTipDate');
    const today = new Date().toISOString().split('T')[0];
    
    if (!lastTipDate || lastTipDate !== today) {
      const randomTipIndex = Math.floor(Math.random() * antiProcrastinationTips.length);
      setCurrentTip(antiProcrastinationTips[randomTipIndex]);
      setShowTipDialog(true);
      localStorage.setItem('lastTipDate', today);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Por favor, permita as notificações para receber lembretes dos hábitos');
      }
    }
  };

  const transformDBHabitToHabit = (dbHabit: DBHabit): Habit => {
    return {
      id: dbHabit.id,
      title: dbHabit.title,
      description: dbHabit.description,
      frequency: "daily",
      streak: dbHabit.streak,
      best_streak: dbHabit.best_streak,
      completed: false,
      progress: 0,
      schedule_days: dbHabit.schedule_days,
      schedule_time: dbHabit.schedule_time,
      status: "pending"
    };
  };

  const updateHabitStatus = async (habitId: string, status: Habit['status']) => {
    setHabits(prevHabits =>
      prevHabits.map(h =>
        h.id === habitId ? { ...h, status, completed: status === 'completed' } : h
      )
    );

    if (status === 'completed') {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          toast.error("Usuário não autenticado");
          return;
        }

        const { data: habitData } = await supabase
          .from("habits")
          .select("streak, best_streak, title")
          .eq("id", habitId)
          .single();

        if (habitData) {
          const newStreak = habitData.streak + 1;
          const currentBestStreak = habitData.best_streak || 0;
          const newBestStreak = Math.max(newStreak, currentBestStreak);
          
          await supabase
            .from("habits")
            .update({ 
              streak: newStreak,
              best_streak: newBestStreak
            })
            .eq("id", habitId);
            
          await supabase
            .from("habit_logs")
            .insert({
              habit_id: habitId,
              user_id: session.user.id,
              date: new Date().toISOString().split('T')[0],
              notes: null,
              mood: 'good'
            });

          for (const reward of streakRewards) {
            if (newStreak === reward.days) {
              setEarnedReward(reward.message);
              setShowRewardDialog(true);
              break;
            }
          }

          setHabits(prevHabits =>
            prevHabits.map(h =>
              h.id === habitId ? { ...h, streak: newStreak, best_streak: newBestStreak } : h
            )
          );
        }

        const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
        const randomMessage = motivationalMessages[randomIndex];
        
        toast.success(randomMessage);
      } catch (error) {
        console.error("Erro ao atualizar sequência:", error);
      }
    }
  };

  const fetchHabits = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("active", true);

      if (error) throw error;
      
      const transformedHabits = (data || []).map(transformDBHabitToHabit);
      setHabits(transformedHabits);
    } catch (error) {
      console.error("Erro ao carregar hábitos:", error);
      toast.error("Erro ao carregar hábitos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeeklyHabits = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast.error("Usuário não autenticado");
        return;
      }

      const today = new Date();
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Segunda-feira
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Domingo
      
      const { data: logs, error } = await supabase
        .from("habit_logs")
        .select("id, habit_id, user_id, date, notes, mood")
        .eq("user_id", session.user.id)
        .gte("date", weekStart.toISOString().split('T')[0])
        .lte("date", weekEnd.toISOString().split('T')[0]);

      if (error) throw error;
      
      if (logs && logs.length > 0) {
        const habitIds = [...new Set(logs.map(log => log.habit_id))];
        const { data: habitsData } = await supabase
          .from("habits")
          .select("id, title")
          .in("id", habitIds);
        
        const habitsMap = habitsData?.reduce((acc, habit) => {
          acc[habit.id] = habit.title;
          return acc;
        }, {} as Record<string, string>) || {};
        
        const logsWithTitles = logs.map(log => ({
          ...log,
          habit_title: habitsMap[log.habit_id]
        }));
        
        setWeeklyHabits(logsWithTitles);
      } else {
        setWeeklyHabits([]);
      }
      
      setShowWeeklyHabits(true);
    } catch (error) {
      console.error("Erro ao carregar hábitos da semana:", error);
      toast.error("Erro ao carregar hábitos da semana");
    }
  };

  const handleEditHabit = (habit: Habit) => {
    setSelectedHabit(habit);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedHabit(null);
    fetchHabits();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedHabit(null);
  };

  const handleDeleteHabit = async () => {
    if (!habitToDelete) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { error: logsError } = await supabase
        .from("habit_logs")
        .delete()
        .eq("habit_id", habitToDelete);

      if (logsError) {
        console.error("Erro ao excluir registros do hábito:", logsError);
        toast.error("Erro ao excluir o hábito");
        return;
      }

      const { error } = await supabase
        .from("habits")
        .delete()
        .eq("id", habitToDelete)
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Erro ao excluir hábito:", error);
        toast.error("Erro ao excluir o hábito");
        return;
      }

      toast.success("Hábito excluído com sucesso!");
      setHabits(prevHabits => prevHabits.filter(h => h.id !== habitToDelete));
      setHabitToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Erro ao excluir hábito:", error);
      toast.error("Erro ao excluir o hábito");
    }
  };

  const openDeleteDialog = (habitId: string) => {
    setHabitToDelete(habitId);
    setDeleteDialogOpen(true);
  };

  const enterFocusMode = (habit: Habit) => {
    setFocusHabit(habit);
    setFocusMode(true);
  };

  const exitFocusMode = () => {
    setFocusMode(false);
    setFocusHabit(null);
  };

  const getAntiProcrastinationTip = () => {
    const randomIndex = Math.floor(Math.random() * antiProcrastinationTips.length);
    setCurrentTip(antiProcrastinationTips[randomIndex]);
    setShowTipDialog(true);
  };

  const getDayLabel = (day: string) => {
    const days: Record<string, string> = {
      "sun": "Dom",
      "mon": "Seg",
      "tue": "Ter",
      "wed": "Qua",
      "thu": "Qui",
      "fri": "Sex",
      "sat": "Sáb",
      "sunday": "Dom",
      "monday": "Seg",
      "tuesday": "Ter",
      "wednesday": "Qua",
      "thursday": "Qui",
      "friday": "Sex",
      "saturday": "Sáb"
    };
    return days[day] || day.charAt(0).toUpperCase() + day.slice(1, 3);
  };

  const formatScheduleDays = (days: string[]) => {
    return days.map(day => getDayLabel(day)).join(", ");
  };

  const getCompletionRate = () => {
    if (habits.length === 0) return 0;
    const completed = habits.filter(h => h.completed).length;
    return Math.round((completed / habits.length) * 100);
  };

  const renderStreakCalendar = (habit: Habit) => {
    const today = new Date();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      days.push(addDays(today, -i));
    }
    
    return (
      <div className="flex items-center justify-center gap-1 mt-2">
        {days.map((day, index) => {
          const isCompleted = isSameDay(day, today) && habit.completed;
          const isToday = isSameDay(day, today);
          
          return (
            <div 
              key={index} 
              className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium
                ${isCompleted ? 'bg-green-100 text-green-800 border-2 border-green-400' : 
                  isToday ? 'bg-blue-50 border border-blue-200 text-blue-800' : 
                  'bg-gray-50 text-gray-500 border border-gray-200'}`}
            >
              {format(day, "d")}
            </div>
          );
        })}
      </div>
    );
  };

  if (showForm) {
    return (
      <div className="max-w-2xl mx-auto bg-gradient-to-br from-violet-50 to-blue-50 p-6 rounded-2xl shadow-lg animate-fade-in">
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          {selectedHabit ? "Editar Hábito" : "Novo Hábito"}
        </h2>
        <HabitForm
          initialData={selectedHabit || undefined}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  if (focusMode && focusHabit) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-xl text-white shadow-xl mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Modo Foco</h1>
            <Button 
              onClick={exitFocusMode}
              variant="outline" 
              className="bg-white/20 text-white hover:bg-white/30 border-white/30"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-2">{focusHabit.title}</h2>
            {focusHabit.description && (
              <p className="text-xl text-blue-100 mb-4">{focusHabit.description}</p>
            )}
            
            <div className="flex justify-center items-center gap-4 mt-6">
              <div className="text-center">
                <div className="text-5xl font-bold mb-1">{focusHabit.streak}</div>
                <div className="text-sm text-blue-100">Dias seguidos</div>
              </div>
              
              {focusHabit.best_streak && focusHabit.best_streak > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-semibold mb-1">{focusHabit.best_streak}</div>
                  <div className="text-sm text-blue-100">Recorde</div>
                </div>
              )}
            </div>
            
            <div className="mt-8">
              {streakProgress[focusHabit.id] && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progresso para próximo marco ({streakProgress[focusHabit.id].next} dias)</span>
                    <span>{streakProgress[focusHabit.id].current}/{streakProgress[focusHabit.id].next}</span>
                  </div>
                  <Progress value={streakProgress[focusHabit.id].nextMilestone} className="h-3 bg-white/20" />
                </div>
              )}
              
              {!focusHabit.completed ? (
                <Button 
                  className="bg-white text-indigo-700 hover:bg-blue-50 mt-4 h-16 text-xl font-bold w-full"
                  onClick={() => updateHabitStatus(focusHabit.id, 'completed')}
                >
                  <Check className="h-6 w-6 mr-2" />
                  Concluir Hoje
                </Button>
              ) : (
                <div className="bg-green-400 text-green-800 rounded-lg p-4 mt-4 flex items-center justify-center">
                  <Check className="h-6 w-6 mr-2" />
                  <span className="text-xl font-bold">Concluído hoje!</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Calendário da Sequência
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderStreakCalendar(focusHabit)}
              <div className="mt-6 space-y-3">
                <h3 className="font-medium">Dias programados:</h3>
                <div className="flex flex-wrap gap-2">
                  {focusHabit.schedule_days.map(day => (
                    <span 
                      key={day} 
                      className="inline-flex items-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                    >
                      {getDayLabel(day)}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2 text-amber-500" />
                Dicas Anti-Procrastinação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <p className="text-amber-800 italic">"{currentTip}"</p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={getAntiProcrastinationTip}
                >
                  <Zap className="h-4 w-4 mr-2 text-amber-500" />
                  Nova Dica
                </Button>
                
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="font-medium mb-2">Por que este hábito é importante?</h3>
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-800">
                    <p className="text-sm">
                      Escreva aqui por que este hábito é importante para você e visualize isso quando sentir vontade de procrastinar.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showWeeklyHabits) {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Segunda-feira
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Domingo
    
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setShowWeeklyHabits(false)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold text-center">
            Hábitos Concluídos Esta Semana
          </h2>
          <div className="w-9"></div> {/* Spacer for alignment */}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(weekStart, "dd/MM", { locale: ptBR })} - {format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyHabits.length > 0 ? (
              <div className="space-y-4">
                {weeklyHabits.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                      <Check className="h-5 w-5 text-green-600 dark:text-green-300" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{log.habit_title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(log.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <ListCheck className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium mb-2">Nenhum hábito concluído</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Você ainda não concluiu nenhum hábito esta semana.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-md">
        <div className="text-white">
          <h2 className="text-2xl font-bold mb-1">Hábitos</h2>
          <p className="text-blue-100">
            Acompanhe seus hábitos e construa uma vida melhor
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => fetchWeeklyHabits()}
            variant="outline"
            className="bg-white/20 text-white hover:bg-white/30 border-white/30"
          >
            <List className="h-4 w-4 mr-2" />
            Ver Resumo Semanal
          </Button>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-white text-purple-600 hover:bg-blue-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Hábito
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-900 flex items-center">
              <Flame className="h-4 w-4 text-amber-500 mr-2" />
              Sequência Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{longestStreak} dias</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-violet-900 flex items-center">
              <Target className="h-4 w-4 text-violet-500 mr-2" />
              Taxa de Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-700">{getCompletionRate()}%</div>
            <div className="mt-2">
              <Progress value={getCompletionRate()} className="h-2 bg-violet-100" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-teal-50 to-green-50 overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-900 flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              Hábitos Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{totalCompletedHabits}</div>
          </CardContent>
        </Card>
      </div>

      {/* Anti-Procrastination Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Zap className="h-5 w-5 mr-2 text-amber-500" />
            Sistema Anti-Procrastinação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-white/70 rounded-lg p-4 mb-4 border border-indigo-100">
            <h3 className="font-medium text-indigo-900 mb-2 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-indigo-500" />
              Dica do dia para vencer a procrastinação
            </h3>
            <p className="text-indigo-700 italic">"{currentTip}"</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              onClick={getAntiProcrastinationTip}
            >
              <Zap className="h-4 w-4 mr-2" />
              Nova Dica Anti-Procrastinação
            </Button>
            
            <Button 
              variant="outline" 
              className="border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              onClick={() => {
                if (habits.length > 0) {
                  enterFocusMode(habits[0]);
                } else {
                  toast.info("Crie um hábito primeiro para usar o modo foco");
                }
              }}
            >
              <Target className="h-4 w-4 mr-2" />
              Ativar Modo Foco
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for habit view */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="ativos">
            <ListCheck className="mr-2 h-4 w-4" />
            Hábitos Ativos
          </TabsTrigger>
          <TabsTrigger value="dicas">
            <Star className="mr-2 h-4 w-4" />
            Dicas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ativos" className="space-y-4">
          {/* Habits List */}
          {habits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <ListCheck className="h-5 w-5 mr-2" />
                  Meus Hábitos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {habits.map(habit => (
                    <div key={habit.id} className="bg-white/80 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            id={`habit-${habit.id}`}
                            checked={habit.completed}
                            onCheckedChange={() => updateHabitStatus(habit.id, habit.completed ? 'pending' : 'completed')}
                            className="mt-1"
                          />
                          <div>
                            <label 
                              htmlFor={`habit-${habit.id}`}
                              className={`font-medium text-gray-900 ${habit.completed ? 'line-through text-gray-500' : ''}`}
                            >
                              {habit.title}
                            </label>
                            {habit.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {habit.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {habit.schedule_days.length > 0 && (
                                <span className="inline-flex items-center text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {formatScheduleDays(habit.schedule_days)}
                                </span>
                              )}
                              {habit.schedule_time && (
                                <span className="inline-flex items-center text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {habit.schedule_time}
                                </span>
                              )}
                              {habit.streak > 0 && (
                                <span className="inline-flex items-center text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                                  <Flame className="h-3 w-3 mr-1" />
                                  {habit.streak} dias
                                </span>
                              )}
                            </div>
                            
                            {streakProgress[habit.id] && (
                              <div className="mt-3">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                  <span>Próximo marco: {streakProgress[habit.id].next} dias</span>
                                  <span>{habit.streak}/{streakProgress[habit.id].next}</span>
                                </div>
                                <Progress value={streakProgress[habit.id].nextMilestone} className="h-1.5" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => enterFocusMode(habit)}
                          >
                            <Target className="h-4 w-4 text-indigo-500" />
                            <span className="sr-only">Modo Foco</span>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditHabit(habit)}
                          >
                            <Edit className="h-4 w-4 text-gray-500" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => openDeleteDialog(habit.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {habits.length === 0 && !isLoading && (
            <div className="text-center p-8 bg-white/50 rounded-xl border border-indigo-100/50 shadow-sm">
              <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <ListCheck className="h-8 w-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum hábito criado</h3>
              <p className="text-gray-600 mb-4">
                Comece a criar hábitos para melhorar sua vida e acompanhar seu progresso.
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Hábito
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="dicas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Star className="h-5 w-5 mr-2 text-amber-500" />
                Dicas para Criar Bons Hábitos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Check className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Comece pequeno</h4>
                    <p className="text-gray-600">Inicie com versões mínimas do hábito desejado. Por exemplo, medite por apenas 1 minuto.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Seja consistente</h4>
                    <p className="text-gray-600">Leva-se em média 66 dias para formar um novo hábito. Mantenha a consistência.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Check className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Use gatilhos</h4>
                    <p className="text-gray-600">Associe seu novo hábito a algo que você já faz regularmente.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <Check className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Celebre pequenas vitórias</h4>
                    <p className="text-gray-600">Reconheça e celebre cada vez que você completar seu hábito.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <Check className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Combata a procrastinação</h4>
                    <p className="text-gray-600">Use a técnica dos 2 minutos: prometa fazer o hábito por apenas 2 minutos. Uma vez iniciado, é mais fácil continuar.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <Check className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Elimine distrações</h4>
                    <p className="text-gray-600">Identifique e elimine distrações que podem impedir você de realizar seu hábito diariamente.</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-amber-500" />
                Vencendo a Procrastinação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                  <h4 className="font-medium text-indigo-900 mb-2">Por que procrastinamos?</h4>
                  <p className="text-gray-700">A procrastinação geralmente ocorre quando enfrentamos tarefas que parecem difíceis, entediantes ou intimidadoras. Nosso cérebro prefere a gratificação imediata em vez do trabalho difícil.</p>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <Timer className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Técnica Pomodoro</h4>
                      <p className="text-gray-600">Trabalhe focado por 25 minutos e depois descanse por 5 minutos. Repita o ciclo.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Target className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Divida em tarefas menores</h4>
                      <p className="text-gray-600">Decomponha hábitos grandes em passos menores e mais gerenciáveis.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Zap className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Elimine distrações</h4>
                      <p className="text-gray-600">Desligue notificações e crie um ambiente propício ao foco.</p>
                    </div>
                  </li>
                </ul>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={getAntiProcrastinationTip}
                  >
                    <Zap className="h-4 w-4 mr-2 text-amber-500" />
                    Obter Nova Dica Anti-Procrastinação
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este hábito? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setHabitToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteHabit}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reward Dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-amber-600">
              🏆 Conquista Desbloqueada!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="w-24 h-24 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-12 w-12" />
            </div>
            <p className="text-lg font-medium mb-2">{earnedReward}</p>
            <p className="text-gray-600">Continue mantendo a consistência!</p>
          </div>
          <DialogFooter>
            <Button 
              className="w-full" 
              onClick={() => setShowRewardDialog(false)}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tip Dialog */}
      <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-blue-600 flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Dica Anti-Procrastinação
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-800">
              <p className="italic">"{currentTip}"</p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="w-full" 
              onClick={() => setShowTipDialog(false)}
            >
              Aplicar hoje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
