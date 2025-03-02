
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  Trophy, 
  Star, 
  ListCheck, 
  ChartLine, 
  Target, 
  Edit, 
  Plus, 
  Clock, 
  Flame, 
  Heart, 
  Medal, 
  CheckCircle,
  ThumbsUp,
  Sparkles,
  Gem,
  BookHeart,
  Brain,
  Lightbulb,
  ArrowRight,
  XCircle,
  BellRing,
  Timer,
  Zap,
  ArrowUpCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HabitForm } from "./HabitForm";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  "Cada hábito completado é uma vitória! Parabéns! 🏆",
  "Investir em bons hábitos é investir em si mesmo! 💯",
  "Seu compromisso com seus hábitos mostra sua dedicação ao crescimento! 🌟",
  "Progresso constante gera resultados extraordinários! 🚀",
  "Sua disciplina de hoje traz sua liberdade de amanhã! 🦅",
  "Celebre cada vitória, não importa o tamanho! 🎉"
];

// Anti-procrastination messages
const antiProcrastinationMessages = [
  "Lembre-se: a melhor hora para começar é agora!",
  "Não espere para começar, 5 minutos já fazem a diferença.",
  "Divida em pequenos passos, 2 minutos é o suficiente para iniciar.",
  "Você só precisa vencer a inércia inicial, depois fica mais fácil.",
  "Procrastinação é ladrão de tempo e sonhos. Não deixe isso te controlar.",
  "Foque em dar apenas o primeiro passo, o resto virá naturalmente.",
  "Visualize-se completando esta tarefa e como você se sentirá depois.",
  "O que você pode fazer agora, mesmo que seja uma pequena parte?",
  "A ação vence o medo e a procrastinação."
];

const habitQuotes = [
  {
    quote: "Somos aquilo que fazemos repetidamente. Excelência, então, não é um ato, mas um hábito.",
    author: "Aristóteles"
  },
  {
    quote: "Os hábitos são, primeiro, teias de aranha e depois, cabos de aço.",
    author: "Provérbio Espanhol"
  },
  {
    quote: "Seu sucesso futuro é determinado pelos hábitos que você cultiva hoje.",
    author: "Robert Kiyosaki"
  },
  {
    quote: "Você não decide seu futuro. Você decide seus hábitos, e são eles que decidem seu futuro.",
    author: "F.M. Alexander"
  },
  {
    quote: "Não é o que fazemos ocasionalmente que molda nossas vidas, mas o que fazemos consistentemente.",
    author: "Anthony Robbins"
  }
];

const benefitsOfHabits = [
  "Reduz a ansiedade e o estresse",
  "Aumenta a autoconfiança e autoestima",
  "Melhora a saúde física e mental",
  "Aumenta a produtividade e foco",
  "Desenvolve a disciplina e autocontrole",
  "Cria uma sensação de propósito e direção"
];

// Techniques to overcome procrastination
const procrastinationTechniques = [
  {
    name: "Técnica Pomodoro",
    description: "Trabalhe por 25 minutos, depois descanse 5 minutos. Repita.",
    icon: <Timer className="h-5 w-5 text-red-500" />
  },
  {
    name: "Regra dos 2 Minutos",
    description: "Se leva menos de 2 minutos, faça agora mesmo.",
    icon: <Zap className="h-5 w-5 text-yellow-500" />
  },
  {
    name: "Começo Pequeno",
    description: "Divida em passos pequenos e comece pelo mais simples.",
    icon: <ArrowUpCircle className="h-5 w-5 text-green-500" />
  },
  {
    name: "Se-Então",
    description: "Crie gatilhos: 'Se X acontecer, então farei Y'.",
    icon: <ArrowRight className="h-5 w-5 text-blue-500" />
  }
];

export function HabitsTab() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("ativos");
  const [currentQuote, setCurrentQuote] = useState(0);
  const [totalCompletedHabits, setTotalCompletedHabits] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [focusHabit, setFocusHabit] = useState<Habit | null>(null);
  const [focusTimer, setFocusTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [focusNotes, setFocusNotes] = useState("");
  const [habitStrengthDialog, setHabitStrengthDialog] = useState(false);
  const [strengthHabit, setStrengthHabit] = useState<Habit | null>(null);
  const [strengthReason, setStrengthReason] = useState("");

  // New states for the Why feature
  const [showWhyDialog, setShowWhyDialog] = useState(false);
  const [whyHabit, setWhyHabit] = useState<Habit | null>(null);
  const [whyReasons, setWhyReasons] = useState<string[]>([]);
  const [newWhyReason, setNewWhyReason] = useState("");

  useEffect(() => {
    fetchHabits();
    requestNotificationPermission();
    const interval = setInterval(checkHabitsSchedule, 60000); // Verifica a cada minuto
    
    // Rotaciona as citações a cada 15 segundos
    const quoteInterval = setInterval(() => {
      setCurrentQuote(prev => (prev + 1) % habitQuotes.length);
    }, 15000);
    
    return () => {
      clearInterval(interval);
      clearInterval(quoteInterval);
    };
  }, []);

  useEffect(() => {
    if (habits.length > 0) {
      calculateStats();
    }
  }, [habits]);

  // Timer for focus mode
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    
    if (isTimerRunning && focusTimer > 0) {
      timerId = setInterval(() => {
        setFocusTimer(prevTime => {
          if (prevTime <= 1) {
            setIsTimerRunning(false);
            
            // When timer completes, show success message and offer to mark habit as completed
            toast.success("Parabéns! Você concluiu sua sessão de foco!", {
              description: "Quer marcar este hábito como concluído?",
              action: {
                label: "Sim, concluir",
                onClick: () => {
                  if (focusHabit) {
                    updateHabitStatus(focusHabit.id, 'completed');
                    saveFocusSession();
                  }
                }
              }
            });
            
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(timerId);
  }, [isTimerRunning, focusTimer]);

  const calculateStats = () => {
    // Calcula o número total de hábitos completados
    const completed = habits.filter(habit => habit.completed).length;
    setTotalCompletedHabits(completed);

    // Encontra o hábito com a maior sequência
    const maxStreak = Math.max(...habits.map(habit => habit.streak));
    setLongestStreak(maxStreak);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Por favor, permita as notificações para receber lembretes dos hábitos');
      }
    }
  };

  const showNotification = (habit: Habit) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      new Notification(`Hora do hábito: ${habit.title}`, {
        body: randomMessage,
        icon: '/favicon.ico'
      });
    }
  };

  const checkHabitsSchedule = () => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
    
    habits.forEach(habit => {
      if (habit.schedule_time && habit.schedule_days.includes(currentDay) && !habit.completed) {
        const [habitHour, habitMinute] = habit.schedule_time.split(':').map(Number);
        const habitDate = new Date();
        habitDate.setHours(habitHour, habitMinute, 0);

        const timeDiff = habitDate.getTime() - now.getTime();
        const minutesDiff = Math.abs(Math.floor(timeDiff / 1000 / 60));

        // Notifica 15 minutos antes
        if (minutesDiff <= 15 && timeDiff > 0) {
          showNotification(habit);
          toast.info(`${habit.title} está programado para começar em ${minutesDiff} minutos!`, {
            action: {
              label: "Iniciar agora",
              onClick: () => startFocusMode(habit)
            }
          });
        }
        
        // Marca como pendente se passou do horário
        if (timeDiff < 0 && habit.status !== 'pending') {
          updateHabitStatus(habit.id, 'pending');
        }
      }
    });
  };

  const transformDBHabitToHabit = (dbHabit: DBHabit): Habit => {
    return {
      id: dbHabit.id,
      title: dbHabit.title,
      description: dbHabit.description,
      frequency: "daily",
      streak: dbHabit.streak,
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
      // Incrementar a sequência no banco de dados
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          toast.error("Usuário não autenticado");
          return;
        }

        const { data: habitData } = await supabase
          .from("habits")
          .select("streak, best_streak")
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
            
          // Log the habit completion
          await supabase
            .from("habit_logs")
            .insert({
              habit_id: habitId,
              user_id: session.user.id,
              date: new Date().toISOString().split('T')[0],
              notes: focusNotes || null,
              mood: 'good'
            });
        }

        const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
        const randomMessage = motivationalMessages[randomIndex];
        
        toast.success(randomMessage, {
          description: "Continue assim! Cada hábito concluído te leva mais perto dos seus objetivos.",
          icon: <Flame className="h-5 w-5 text-amber-500" />
        });
        
        // If reaching a milestone streak, show extra encouragement
        const habit = habits.find(h => h.id === habitId);
        if (habit && [3, 7, 14, 21, 30, 60, 90].includes(habit.streak + 1)) {
          toast.success(`Incrível! Você alcançou ${habit.streak + 1} dias consecutivos!`, {
            description: "Você está construindo uma consistência incrível!",
            icon: <Trophy className="h-5 w-5 text-amber-500" />,
            duration: 5000
          });
        }
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

  // New function to start focus mode
  const startFocusMode = (habit: Habit) => {
    setFocusHabit(habit);
    setFocusTimer(25 * 60); // 25 minutes in seconds (Pomodoro technique)
    setFocusNotes("");
    setShowFocusMode(true);
  };

  // Function to handle timer controls
  const handleTimerControl = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
    } else {
      setIsTimerRunning(true);
    }
  };

  // Function to format timer display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Save focus session notes
  const saveFocusSession = async () => {
    if (!focusHabit || !focusNotes.trim()) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      
      await supabase
        .from("habit_logs")
        .upsert({
          habit_id: focusHabit.id,
          user_id: session.user.id,
          date: new Date().toISOString().split('T')[0],
          notes: focusNotes,
          mood: 'good'
        });
      
      toast.success("Anotações da sessão salvas com sucesso!");
      setShowFocusMode(false);
    } catch (error) {
      console.error("Erro ao salvar anotações:", error);
      toast.error("Erro ao salvar anotações da sessão");
    }
  };

  // Open the habit strength reinforcement dialog
  const openHabitStrengthDialog = (habit: Habit) => {
    setStrengthHabit(habit);
    setStrengthReason("");
    setHabitStrengthDialog(true);
  };

  // Save habit strength reason
  const saveHabitStrength = async () => {
    if (!strengthHabit || !strengthReason.trim()) {
      toast.error("Por favor, escreva um motivo para fortalecer este hábito");
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      
      // Get current positive_reinforcement array or create empty array
      const { data } = await supabase
        .from("habits")
        .select("positive_reinforcement")
        .eq("id", strengthHabit.id)
        .single();
      
      const currentReasons = data?.positive_reinforcement || [];
      
      // Add new reason to array
      await supabase
        .from("habits")
        .update({
          positive_reinforcement: [...currentReasons, strengthReason]
        })
        .eq("id", strengthHabit.id);
      
      toast.success("Motivo adicionado com sucesso!");
      setHabitStrengthDialog(false);
      setStrengthReason("");
    } catch (error) {
      console.error("Erro ao salvar motivo:", error);
      toast.error("Erro ao salvar motivo");
    }
  };

  // Open the "why" dialog to display and add deeper motivations
  const openWhyDialog = async (habit: Habit) => {
    setWhyHabit(habit);
    setNewWhyReason("");
    
    try {
      const { data } = await supabase
        .from("habits")
        .select("positive_reinforcement")
        .eq("id", habit.id)
        .single();
      
      setWhyReasons(data?.positive_reinforcement || []);
      setShowWhyDialog(true);
    } catch (error) {
      console.error("Erro ao carregar motivações:", error);
      toast.error("Erro ao carregar motivações");
    }
  };

  // Add new reason to the "why" list
  const addWhyReason = async () => {
    if (!whyHabit || !newWhyReason.trim()) {
      toast.error("Por favor, escreva um motivo");
      return;
    }
    
    try {
      const updatedReasons = [...whyReasons, newWhyReason];
      setWhyReasons(updatedReasons);
      
      await supabase
        .from("habits")
        .update({
          positive_reinforcement: updatedReasons
        })
        .eq("id", whyHabit.id);
      
      toast.success("Motivo adicionado com sucesso!");
      setNewWhyReason("");
    } catch (error) {
      console.error("Erro ao adicionar motivo:", error);
      toast.error("Erro ao adicionar motivo");
    }
  };

  // Show a random anti-procrastination message
  const showAntiProcrastinationMessage = () => {
    const randomIndex = Math.floor(Math.random() * antiProcrastinationMessages.length);
    const message = antiProcrastinationMessages[randomIndex];
    
    toast.info(message, {
      description: "Comece agora mesmo, mesmo que seja apenas por 2 minutos!",
      icon: <Zap className="h-5 w-5 text-amber-500" />,
      duration: 8000
    });
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-purple-gradient to-purple-gradient rounded-2xl shadow-soft transition-all duration-300 hover:shadow-md">
        <div className="text-white">
          <h2 className="text-2xl font-bold mb-2 flex items-center">
            <Sparkles className="h-6 w-6 mr-2 text-amber-300 animate-pulse-subtle" />
            Hábitos
          </h2>
          <p className="text-blue-100">
            Acompanhe seus hábitos e construa uma vida melhor, um dia de cada vez.
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-white text-purple-600 hover:bg-blue-50 hover:shadow-lg transition-all duration-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Hábito
        </Button>
      </div>

      {/* Anti-Procrastination Banner */}
      <Card className="overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 border-none shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-orange-500"></div>
        <CardContent className="pt-6 pb-6 relative">
          <Zap className="absolute top-4 right-4 h-6 w-6 text-amber-400 opacity-50" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Vença a Procrastinação Hoje!</h3>
          <p className="text-amber-700 mb-3">
            Não espere o momento perfeito. Comece agora mesmo, mesmo que seja por apenas 2 minutos.
          </p>
          <Button 
            onClick={showAntiProcrastinationMessage} 
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            <Zap className="h-4 w-4 mr-2" />
            Motivação Anti-Procrastinação
          </Button>
        </CardContent>
      </Card>

      {/* Motivational Quote */}
      <Card className="overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 border-none shadow-lg animate-float transition-all duration-300 hover:shadow-xl">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-400 to-purple-600"></div>
        <CardContent className="pt-6 relative">
          <Gem className="absolute top-4 right-4 h-6 w-6 text-indigo-400 opacity-50" />
          <blockquote className="italic text-lg text-indigo-900 font-light">
            "{habitQuotes[currentQuote].quote}"
          </blockquote>
          <div className="text-right mt-2 font-semibold text-purple-800">— {habitQuotes[currentQuote].author}</div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-900">Sequência Atual</CardTitle>
            <Trophy className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">{longestStreak} dias</div>
            <p className="text-xs text-amber-700/70 mt-1">
              Continue mantendo a consistência!
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-none bg-gradient-to-br from-violet-50 to-purple-50 overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="absolute top-0 left-0 w-1 h-full bg-violet-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-violet-900">Taxa de Conclusão</CardTitle>
            <ChartLine className="h-5 w-5 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-violet-700">{getCompletionRate()}%</div>
            <div className="mt-2">
              <Progress value={getCompletionRate()} className="h-2 bg-violet-100" indicatorClassName="bg-gradient-to-r from-violet-400 to-purple-600" />
            </div>
            <p className="text-xs text-violet-700/70 mt-2">
              Hábitos completados hoje
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-none bg-gradient-to-br from-teal-50 to-green-50 overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Hábitos Concluídos</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{totalCompletedHabits}</div>
            <p className="text-xs text-green-700/70 mt-1">
              Cada conclusão te aproxima do sucesso!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Anti-Procrastination Techniques */}
      <Card className="border-none bg-gradient-to-br from-blue-50 to-cyan-50 overflow-hidden shadow-md">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
        <CardHeader>
          <CardTitle className="text-lg text-blue-900 flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-500" />
            Técnicas Anti-Procrastinação
          </CardTitle>
          <CardDescription className="text-blue-700">
            Métodos comprovados para vencer a procrastinação e agir agora
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {procrastinationTechniques.map((technique, index) => (
              <div key={index} className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm p-3 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-2 mb-2">
                  {technique.icon}
                  <h4 className="font-medium text-gray-900">{technique.name}</h4>
                </div>
                <p className="text-sm text-gray-700">{technique.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for habit view */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4 p-1 bg-gradient-to-r from-blue-100/50 to-purple-100/50 backdrop-blur-xl rounded-xl">
          <TabsTrigger value="ativos" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-white data-[state=active]:to-white data-[state=active]:text-purple-700">
            <ListCheck className="mr-2 h-4 w-4" />
            Hábitos Ativos
          </TabsTrigger>
          <TabsTrigger value="dicas" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-white data-[state=active]:to-white data-[state=active]:text-purple-700">
            <Lightbulb className="mr-2 h-4 w-4" />
            Dicas & Benefícios
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ativos" className="space-y-4">
          {/* Today's Habits Focus Section */}
          {habits.length > 0 && (
            <Card className="border-none bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden shadow-md">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-indigo-900">
                  <Target className="h-5 w-5 mr-2 text-indigo-500" />
                  Foco de Hoje: {format(new Date(), "EEEE, dd 'de' MMMM", {locale: ptBR})}
                </CardTitle>
                <CardDescription className="text-indigo-700">
                  Escolha um hábito para focar nas próximas horas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {habits.map(habit => (
                    <div key={habit.id} className="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
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
                              <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${
                                habit.status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : habit.status === 'pending' 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {habit.status === 'completed' ? (
                                  <><CheckCircle className="h-3 w-3 mr-1" /> Completado</>
                                ) : habit.status === 'pending' ? (
                                  <><Clock className="h-3 w-3 mr-1" /> Pendente</>
                                ) : (
                                  <><XCircle className="h-3 w-3 mr-1" /> Perdido</>
                                )}
                              </span>
                              {habit.streak > 0 && (
                                <span className="inline-flex items-center text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                                  <Flame className="h-3 w-3 mr-1" />
                                  {habit.streak} dias
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => openWhyDialog(habit)}
                          >
                            <Heart className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Por que</span>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => startFocusMode(habit)}
                          >
                            <Target className="h-4 w-4 text-indigo-500" />
                            <span className="sr-only">Foco</span>
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {habits.length === 0 && !isLoading && (
            <div className="text-center p-8 bg-white/50 backdrop-blur-sm rounded-xl border border-indigo-100/50 shadow-sm">
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
          <Card className="border-none bg-gradient-to-br from-violet-50 to-blue-50 overflow-hidden shadow-md">
            <div className="absolute top-0 left-0 w-1 h-full bg-violet-500"></div>
            <CardHeader>
              <CardTitle className="text-lg text-violet-900 flex items-center">
                <Star className="h-5 w-5 mr-2 text-violet-500" />
                Benefícios de Desenvolver Hábitos
              </CardTitle>
              <CardDescription className="text-violet-700">
                Por que investir tempo no desenvolvimento de hábitos positivos?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {benefitsOfHabits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-violet-100 flex items-center justify-center mr-2">
                      <CheckCircle className="h-4 w-4 text-violet-500" />
                    </div>
                    <span className="text-gray-800">{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-none bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden shadow-md">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <CardHeader>
              <CardTitle className="text-lg text-emerald-900 flex items-center">
                <BookHeart className="h-5 w-5 mr-2 text-emerald-500" />
                Dicas para Construir Hábitos Duradouros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Medal className="h-4 w-4 mr-2 text-amber-500" />
                    A Regra de 66 Dias
                  </h4>
                  <p className="text-gray-700">
                    Pesquisas mostram que leva em média 66 dias para um novo comportamento se tornar automático. Seja paciente e consistente!
                  </p>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <ThumbsUp className="h-4 w-4 mr-2 text-blue-500" />
                    Comece com Hábitos Pequenos
                  </h4>
                  <p className="text-gray-700">
                    Crie versões miniatura dos hábitos. Quanto menor, mais fácil de cumprir. Por exemplo, medite por apenas 1 minuto por dia.
                  </p>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                    Vincule a um Gatilho Existente
                  </h4>
                  <p className="text-gray-700">
                    Use a fórmula "Depois de [hábito atual], eu vou [novo hábito]". Por exemplo: "Depois de escovar os dentes, vou fazer 5 minutos de alongamento".
                  </p>
                </div>
                
                <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Heart className="h-4 w-4 mr-2 text-red-500" />
                    Celebre Pequenas Vitórias
                  </h4>
                  <p className="text-gray-700">
                    Celebre cada vez que você cumprir seu hábito. A satisfação imediata reforça o comportamento e aumenta as chances de repetição.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Focus Mode Dialog */}
      <Dialog open={showFocusMode} onOpenChange={setShowFocusMode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modo Foco: {focusHabit?.title}</DialogTitle>
            <DialogDescription>
              Foque neste hábito pelo tempo definido. Sem distrações!
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center py-4 space-y-4">
            <div className="text-5xl font-bold text-indigo-700">
              {formatTime(focusTimer)}
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleTimerControl}
                className={isTimerRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
              >
                {isTimerRunning ? "Pausar" : "Iniciar"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setFocusTimer(25 * 60);
                  setIsTimerRunning(false);
                }}
              >
                Reiniciar
              </Button>
            </div>

            <div className="w-full space-y-2 mt-4">
              <Label htmlFor="focus-notes">Anotações da sessão:</Label>
              <Textarea 
                id="focus-notes" 
                value={focusNotes}
                onChange={(e) => setFocusNotes(e.target.value)}
                placeholder="Escreva suas reflexões, ideias ou progresso..."
                className="h-32"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFocusMode(false)}>
              Cancelar
            </Button>
            <Button onClick={saveFocusSession} disabled={!focusNotes.trim()}>
              Salvar Anotações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Why Dialog */}
      <Dialog open={showWhyDialog} onOpenChange={setShowWhyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Por que manter este hábito?</DialogTitle>
            <DialogDescription>
              Lembre-se de suas motivações quando sentir vontade de desistir.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col py-4 space-y-4">
            {whyReasons.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-indigo-700">Suas motivações:</h4>
                <ul className="space-y-2">
                  {whyReasons.map((reason, index) => (
                    <li key={index} className="bg-indigo-50 p-3 rounded-lg text-gray-800 flex items-start">
                      <Heart className="h-4 w-4 text-red-500 mt-1 mr-2 flex-shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Heart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Nenhuma motivação adicionada ainda</p>
              </div>
            )}

            <div className="border-t pt-4 space-y-2">
              <Label htmlFor="new-reason">Adicionar nova motivação:</Label>
              <div className="flex gap-2">
                <Input 
                  id="new-reason" 
                  value={newWhyReason}
                  onChange={(e) => setNewWhyReason(e.target.value)}
                  placeholder="Ex: Para ter mais energia durante o dia"
                  className="flex-1"
                />
                <Button onClick={addWhyReason} disabled={!newWhyReason.trim()}>
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Habit Strength Dialog */}
      <Dialog open={habitStrengthDialog} onOpenChange={setHabitStrengthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fortaleça seu compromisso</DialogTitle>
            <DialogDescription>
              Escreva um motivo poderoso que te lembre por que este hábito é importante.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col py-4 space-y-4">
            <Label htmlFor="strength-reason">Por que este hábito é importante para você?</Label>
            <Textarea 
              id="strength-reason" 
              value={strengthReason}
              onChange={(e) => setStrengthReason(e.target.value)}
              placeholder="Ex: Este hábito me ajuda a ter mais energia e ser mais produtivo no trabalho..."
              className="h-32"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setHabitStrengthDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveHabitStrength} disabled={!strengthReason.trim()}>
              Salvar Motivo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
