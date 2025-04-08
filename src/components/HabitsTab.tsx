
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Target,
  List,
  Trash2,
  Trophy,
  Timer,
  Zap,
  AlertCircle,
  TrendingUp,
  Activity,
  Award,
  Heart,
  Bolt,
  BarChart3,
  BadgeCheck,
  CalendarDays,
  Sparkles,
  Crown,
  Lightbulb,
  Shield,
  Gauge,
  Brain,
  Rocket
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HabitForm } from "./HabitForm";
import { format, startOfWeek, endOfWeek, addDays, isSameDay, eachDayOfInterval, isSameMonth, differenceInDays, addWeeks, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

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
  created_at?: string;
  category?: string;
  difficulty?: "easy" | "medium" | "hard";
  impact?: "low" | "medium" | "high";
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
  category?: string;
  difficulty?: "easy" | "medium" | "hard";
  impact?: "low" | "medium" | "high";
};

type StreakProgressType = {
  current: number;
  next: number;
  nextMilestone: number;
  visualLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';
};

// Color schemes for different impact levels
const impactColors = {
  low: { bg: "from-blue-100 to-cyan-50", text: "text-blue-600", border: "border-blue-200", progress: "bg-blue-400" },
  medium: { bg: "from-purple-100 to-fuchsia-50", text: "text-purple-600", border: "border-purple-200", progress: "bg-purple-400" },
  high: { bg: "from-amber-100 to-yellow-50", text: "text-amber-600", border: "border-amber-200", progress: "bg-amber-400" }
};

// Difficulty badges
const difficultyBadges = {
  easy: { color: "bg-green-100 text-green-700 border-green-200", icon: <Shield className="h-3 w-3 mr-1" /> },
  medium: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: <Target className="h-3 w-3 mr-1" /> },
  hard: { color: "bg-purple-100 text-purple-700 border-purple-200", icon: <Award className="h-3 w-3 mr-1" /> }
};

// Categorias de hábitos com ícones
const habitCategories = [
  { value: "saude", label: "Saúde", icon: <Heart className="h-4 w-4 text-red-500" /> },
  { value: "fitness", label: "Fitness", icon: <Activity className="h-4 w-4 text-green-500" /> },
  { value: "mente", label: "Mental", icon: <Brain className="h-4 w-4 text-purple-500" /> },
  { value: "aprendizado", label: "Aprendizado", icon: <BookOpen className="h-4 w-4 text-blue-500" /> },
  { value: "produtividade", label: "Produtividade", icon: <Gauge className="h-4 w-4 text-amber-500" /> },
  { value: "financeiro", label: "Financeiro", icon: <DollarSign className="h-4 w-4 text-emerald-500" /> },
  { value: "social", label: "Social", icon: <Users className="h-4 w-4 text-indigo-500" /> }
];

// Motivational messages for different occasions
const motivationalMessages = [
  "Você está construindo um futuro melhor, um hábito de cada vez! 💪",
  "Manter a consistência é a chave do sucesso! 🔑",
  "Pequenas ações diárias levam a grandes mudanças! 🌱",
  "Você é mais forte do que pensa! Continue assim! ⭐",
  "Cada hábito completado é uma vitória! Parabéns! 🏆",
  "Sua disciplina de hoje criará seus resultados de amanhã! 🚀",
  "Grandes conquistas são feitas de pequenos hábitos consistentes! ✨",
  "Não pare quando estiver cansado. Pare quando estiver pronto! 💎",
  "O sucesso não é um acidente, é um hábito. Continue! 🌟",
  "Você está 1% melhor hoje do que ontem. Isso é poderoso! 📈"
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
  "Use a regra dos 2 minutos: comece apenas por 2 minutos.",
  "Defina intenções de implementação: 'Se X acontecer, então eu farei Y'.",
  "Crie um ambiente que torne o hábito mais fácil de ser executado.",
  "Elimine a fricção inicial: prepare tudo o que precisará com antecedência.",
  "Combine o novo hábito com algo que você já faz regularmente.",
  "Mantenha um rastreador visual do seu progresso para motivação.",
  "Encontre um parceiro de responsabilidade para manter-se motivado.",
  "Pratique auto-compaixão quando falhar; recomeçar é parte do processo."
];

// Rewards for streaks
const streakRewards = [
  { days: 3, message: "3 dias consecutivos! Você está criando momentum!", badge: "Iniciante" },
  { days: 7, message: "Uma semana completa! Você está no caminho certo!", badge: "Consistente" },
  { days: 14, message: "Duas semanas! Seu hábito está começando a se formar!", badge: "Dedicado" },
  { days: 21, message: "21 dias! Você está próximo de automatizar este hábito!", badge: "Persistente" },
  { days: 30, message: "Um mês inteiro! Que consistência impressionante!", badge: "Campeão Mensal" },
  { days: 60, message: "Dois meses! Você é imparável!", badge: "Determinado" },
  { days: 90, message: "Três meses! Este hábito agora faz parte de quem você é!", badge: "Transformador" },
  { days: 180, message: "Seis meses! Você é uma verdadeira inspiração!", badge: "Inspirador" },
  { days: 365, message: "Um ano inteiro! Você é extraordinário!", badge: "Lendário" }
];

// Componente de Impacto de Hábito
const HabitImpactBadge = ({ impact }: { impact?: string }) => {
  if (!impact) return null;
  const level = impact as "low" | "medium" | "high";
  
  const labels = {
    low: "Impacto Leve",
    medium: "Impacto Médio",
    high: "Impacto Alto"
  };
  
  const icons = {
    low: <TrendingUp className="h-3 w-3 mr-1" />,
    medium: <BarChart3 className="h-3 w-3 mr-1" />,
    high: <Rocket className="h-3 w-3 mr-1" />
  };
  
  return (
    <Badge variant="outline" className={`${impactColors[level].bg} ${impactColors[level].text} border-${level} flex items-center`}>
      {icons[level]}
      {labels[level]}
    </Badge>
  );
};

// Componente de Visualização de Calendário
const HabitCalendarView = ({ habit, habitLogs }: { habit: Habit, habitLogs: HabitLog[] }) => {
  const today = new Date();
  const startOfCurrentMonth = startOfMonth(today);
  const endOfCurrentMonth = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: startOfCurrentMonth, end: endOfCurrentMonth });
  
  const completedDays = new Set(
    habitLogs
      .filter(log => log.habit_id === habit.id)
      .map(log => log.date.split('T')[0])
  );
  
  return (
    <div className="mt-4">
      <div className="grid grid-cols-7 gap-1">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
          <div key={idx} className="text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {daysInMonth.map((date, i) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const isCompleted = completedDays.has(dateStr);
          const isToday = isSameDay(date, today);
          
          return (
            <div 
              key={i} 
              className={`aspect-square rounded-full flex items-center justify-center text-xs
                ${isCompleted 
                  ? 'bg-green-400 text-white ring-2 ring-green-200' 
                  : isToday 
                    ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-300' 
                    : 'bg-gray-50 text-gray-700'}`}
            >
              {format(date, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente de Nível Visual
const VisualLevel = ({ streak }: { streak: number }) => {
  let level = 'beginner';
  let color = 'bg-blue-400';
  let icon = <Shield className="h-4 w-4" />;
  let label = 'Iniciante';
  
  if (streak >= 100) {
    level = 'master';
    color = 'bg-amber-400';
    icon = <Crown className="h-4 w-4" />;
    label = 'Mestre';
  } else if (streak >= 60) {
    level = 'expert';
    color = 'bg-purple-400';
    icon = <Award className="h-4 w-4" />;
    label = 'Especialista';
  } else if (streak >= 30) {
    level = 'advanced';
    color = 'bg-green-400';
    icon = <BadgeCheck className="h-4 w-4" />;
    label = 'Avançado';
  } else if (streak >= 7) {
    level = 'intermediate';
    color = 'bg-cyan-400';
    icon = <Target className="h-4 w-4" />;
    label = 'Intermediário';
  }
  
  return (
    <div className="flex items-center gap-2">
      <div className={`${color} text-white p-1 rounded-full`}>
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
};

// Componente de Estatísticas de Hábito
const HabitStats = ({ habits, habitLogs }: { habits: Habit[], habitLogs: HabitLog[] }) => {
  // Prepare data for charts
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(), -i);
    return {
      date: format(date, 'dd/MM'),
      completed: habitLogs.filter(log => 
        log.date.split('T')[0] === format(date, 'yyyy-MM-dd')
      ).length
    };
  }).reverse();
  
  const categoryCounts: {[key: string]: number} = {};
  
  habits.forEach(habit => {
    if (habit.category) {
      categoryCounts[habit.category] = (categoryCounts[habit.category] || 0) + 1;
    }
  });
  
  const categoryData = Object.keys(categoryCounts).map(category => ({
    name: habitCategories.find(c => c.value === category)?.label || category,
    value: categoryCounts[category]
  }));
  
  // Calculate overall stats
  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.completed).length;
  const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  const averageStreak = habits.length > 0 
    ? Math.round(habits.reduce((sum, h) => sum + h.streak, 0) / habits.length) 
    : 0;
    
  return (
    <div className="space-y-6">
      {/* Estat&amp;iacute;sticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-700">Sequência Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Flame className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-2xl font-bold text-blue-700">{averageStreak} dias</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-700">Taxa de Conclusão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Target className="h-5 w-5 text-purple-500 mr-2" />
              <span className="text-2xl font-bold text-purple-700">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2 mt-2 bg-purple-100" />
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-700">Total de Hábitos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ListCheck className="h-5 w-5 text-amber-500 mr-2" />
              <span className="text-2xl font-bold text-amber-700">{totalHabits}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-500" />
              Progresso dos Últimos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    name="Hábitos Concluídos"
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8', r: 4 }}
                    activeDot={{ r: 6, fill: '#6d4aff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <PieChart className="h-4 w-4 mr-2 text-purple-500" />
              Hábitos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar 
                    dataKey="value" 
                    name="Número de Hábitos"
                    fill="#8884d8" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export function HabitsTab() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
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
  const [earnedBadge, setEarnedBadge] = useState<string>("");
  const [showTipDialog, setShowTipDialog] = useState(false);
  const [currentTip, setCurrentTip] = useState<string>("");
  const [streakProgress, setStreakProgress] = useState<{[id: string]: StreakProgressType}>({});
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchHabits();
    fetchHabitLogs();
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

    const maxStreak = Math.max(...habits.map(habit => habit.streak), 0);
    setLongestStreak(maxStreak);
  };

  const calculateStreakProgress = () => {
    const progress: {[id: string]: StreakProgressType} = {};
    
    habits.forEach(habit => {
      const currentStreak = habit.streak;
      let nextMilestone = 3;
      let visualLevel: StreakProgressType['visualLevel'] = 'beginner';
      
      // Determinar próximo marco
      for (const reward of streakRewards) {
        if (reward.days > currentStreak) {
          nextMilestone = reward.days;
          break;
        }
      }
      
      // Determinar nível visual baseado no streak
      if (currentStreak >= 100) visualLevel = 'master';
      else if (currentStreak >= 60) visualLevel = 'expert';
      else if (currentStreak >= 30) visualLevel = 'advanced';
      else if (currentStreak >= 7) visualLevel = 'intermediate';
      
      progress[habit.id] = {
        current: currentStreak,
        next: nextMilestone,
        nextMilestone: Math.round((currentStreak / nextMilestone) * 100),
        visualLevel
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
      status: "pending",
      created_at: dbHabit.created_at,
      category: dbHabit.category,
      difficulty: dbHabit.difficulty as Habit['difficulty'],
      impact: dbHabit.impact as Habit['impact']
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
            
          const newLog = {
            habit_id: habitId,
            user_id: session.user.id,
            date: new Date().toISOString(),
            notes: null,
            mood: 'good'
          };
          
          await supabase
            .from("habit_logs")
            .insert(newLog);
          
          // Adicionar o novo log à lista local
          setHabitLogs(prev => [...prev, {
            ...newLog,
            id: crypto.randomUUID(),
            habit_title: habitData.title
          }]);

          // Verificar marcos de sequência para recompensas
          for (const reward of streakRewards) {
            if (newStreak === reward.days) {
              setEarnedReward(reward.message);
              setEarnedBadge(reward.badge);
              setShowRewardDialog(true);
              break;
            }
          }

          // Atualizar o estado dos hábitos com a nova sequência
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

  const fetchHabitLogs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        return;
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: logs, error } = await supabase
        .from("habit_logs")
        .select("id, habit_id, user_id, date, notes, mood")
        .eq("user_id", session.user.id)
        .gte("date", thirtyDaysAgo.toISOString());

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
        }, {} as {[key: string]: string}) || {};
        
        const logsWithTitles = logs.map(log => ({
          ...log,
          habit_title: habitsMap[log.habit_id]
        }));
        
        setHabitLogs(logsWithTitles);
      }
    } catch (error) {
      console.error("Erro ao carregar logs de hábitos:", error);
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
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      
      const { data: logs, error } = await supabase
        .from("habit_logs")
        .select("id, habit_id, user_id, date, notes, mood")
        .eq("user_id", session.user.id)
        .gte("date", weekStart.toISOString())
        .lte("date", weekEnd.toISOString());

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
        }, {} as {[key: string]: string}) || {};
        
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
      setHabitLogs(prevLogs => prevLogs.filter(log => log.habit_id !== habitToDelete));
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
    const days: {[key: string]: string} = {
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

  const getCategoryIcon = (category?: string) => {
    if (!category) return <Briefcase className="h-4 w-4 text-gray-500" />;
    
    const categoryItem = habitCategories.find(c => c.value === category);
    return categoryItem?.icon || <Briefcase className="h-4 w-4 text-gray-500" />;
  };

  const filteredHabits = habits
    .filter(h => !filterCategory || h.category === filterCategory);

  if (showForm) {
    return (
      <div className="max-w-2xl mx-auto bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl shadow-lg border border-blue-100 animate-fade-in">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={handleFormCancel} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            {selectedHabit ? "Editar Hábito" : "Novo Hábito"}
          </h2>
        </div>
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
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-xl text-white overflow-hidden shadow-xl mb-6">
          {/* Animated background particle effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-20 h-20 bg-white opacity-5 rounded-full animate-pulse-subtle"></div>
            <div className="absolute bottom-20 right-20 w-32 h-32 bg-white opacity-5 rounded-full animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-white opacity-5 rounded-full animate-pulse-subtle" style={{ animationDelay: '0.5s' }}></div>
          </div>
          
          <div className="relative z-10">
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
            
            <div className="text-center mb-8 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500/20 w-32 h-32 rounded-full blur-xl"></div>
              <h2 className="text-4xl font-bold mb-2 relative">{focusHabit.title}</h2>
              {focusHabit.description && (
                <p className="text-xl text-blue-100 mb-4 relative">{focusHabit.description}</p>
              )}
              
              <div className="flex justify-center gap-8 mt-8 relative z-10">
                <div className="text-center p-4 bg-white/10 backdrop-blur-md rounded-xl">
                  <div className="text-5xl font-bold mb-1">{focusHabit.streak}</div>
                  <div className="text-sm text-blue-100">Dias seguidos</div>
                </div>
                
                {focusHabit.best_streak && focusHabit.best_streak > 0 && (
                  <div className="text-center p-4 bg-white/10 backdrop-blur-md rounded-xl">
                    <div className="text-3xl font-bold mb-1">{focusHabit.best_streak}</div>
                    <div className="text-sm text-blue-100">Recorde</div>
                  </div>
                )}
                
                <div className="text-center p-4 bg-white/10 backdrop-blur-md rounded-xl">
                  <div className="text-3xl font-bold mb-1">
                    {streakProgress[focusHabit.id]?.visualLevel === 'master' ? (
                      <Crown className="h-6 w-6 mx-auto text-amber-300" />
                    ) : streakProgress[focusHabit.id]?.visualLevel === 'expert' ? (
                      <Award className="h-6 w-6 mx-auto text-purple-300" />
                    ) : streakProgress[focusHabit.id]?.visualLevel === 'advanced' ? (
                      <BadgeCheck className="h-6 w-6 mx-auto text-green-300" />
                    ) : streakProgress[focusHabit.id]?.visualLevel === 'intermediate' ? (
                      <Target className="h-6 w-6 mx-auto text-cyan-300" />
                    ) : (
                      <Shield className="h-6 w-6 mx-auto text-blue-300" />
                    )}
                  </div>
                  <div className="text-sm text-blue-100">Nível</div>
                </div>
              </div>
              
              <div className="mt-10 relative z-10">
                {streakProgress[focusHabit.id] && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-300" />
                        Progresso para próximo marco ({streakProgress[focusHabit.id].next} dias)
                      </span>
                      <span className="font-medium">{streakProgress[focusHabit.id].current}/{streakProgress[focusHabit.id].next}</span>
                    </div>
                    <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-500 rounded-full" 
                        style={{ width: `${streakProgress[focusHabit.id].nextMilestone}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {!focusHabit.completed ? (
                  <Button 
                    className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white mt-4 h-16 text-xl font-bold w-full transition-all shadow-lg hover:shadow-xl border-none"
                    onClick={() => updateHabitStatus(focusHabit.id, 'completed')}
                  >
                    <Check className="h-6 w-6 mr-2" />
                    Concluir Hoje
                  </Button>
                ) : (
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-6 mt-4 flex items-center justify-center shadow-lg">
                    <Check className="h-8 w-8 mr-3" />
                    <span className="text-xl font-bold">Concluído hoje!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-lg border border-indigo-100 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
              <CardTitle className="flex items-center text-indigo-700">
                <Calendar className="h-5 w-5 mr-2 text-indigo-500" />
                Calendário da Sequência
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <HabitCalendarView habit={focusHabit} habitLogs={habitLogs} />
              
              <div className="mt-8 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2 text-indigo-500" />
                    Dias programados:
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {focusHabit.schedule_days.map(day => (
                      <Badge 
                        key={day} 
                        variant="secondary"
                        className="bg-indigo-100 text-indigo-700 border border-indigo-200"
                      >
                        {getDayLabel(day)}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {focusHabit.schedule_time && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-purple-500" />
                      Horário ideal:
                    </h3>
                    <Badge variant="outline" className="bg-purple-100 text-purple-700 border border-purple-200">
                      {focusHabit.schedule_time}
                    </Badge>
                  </div>
                )}
                
                {focusHabit.difficulty && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                      <Target className="h-4 w-4 mr-2 text-amber-500" />
                      Nível de dificuldade:
                    </h3>
                    <Badge 
                      variant="outline" 
                      className={difficultyBadges[focusHabit.difficulty].color}
                    >
                      {difficultyBadges[focusHabit.difficulty].icon}
                      {focusHabit.difficulty === 'easy' ? 'Fácil' : 
                        focusHabit.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                    </Badge>
                  </div>
                )}
                
                {focusHabit.impact && (
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                      <Rocket className="h-4 w-4 mr-2 text-orange-500" />
                      Impacto:
                    </h3>
                    <HabitImpactBadge impact={focusHabit.impact} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border border-amber-100 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
              <CardTitle className="flex items-center text-amber-700">
                <Zap className="h-5 w-5 mr-2 text-amber-500" />
                Dicas Anti-Procrastinação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-amber-300 to-amber-500 rounded-full"></div>
                  <div className="pl-6">
                    <h3 className="font-medium text-amber-700 mb-2">Dica do dia:</h3>
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                      <p className="text-amber-800 italic">"{currentTip}"</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" 
                  onClick={getAntiProcrastinationTip}
                >
                  <Zap className="h-4 w-4 mr-2 text-amber-500" />
                  Nova Dica
                </Button>
                
                <Separator />
                
                <div className="relative">
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-300 to-blue-500 rounded-full"></div>
                  <div className="pl-6">
                    <h3 className="font-medium text-blue-700 mb-2">Por que este hábito é importante?</h3>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg relative overflow-hidden">
                      <div className="absolute -top-6 -right-6 w-12 h-12 bg-blue-200 rounded-full opacity-50"></div>
                      <p className="text-blue-800 relative z-10">
                        Visualize como este hábito aproxima você de seus objetivos de longo prazo e como ele transforma quem você é.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-purple-300 to-purple-500 rounded-full"></div>
                  <div className="pl-6">
                    <h3 className="font-medium text-purple-700 mb-2">Como superar obstáculos:</h3>
                    <ul className="space-y-2 text-gray-700">
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                        <span>Se sentir desmotivado, comece por apenas 2 minutos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                        <span>Crie um ambiente que torne este hábito mais fácil</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Sparkles className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                        <span>Lembre-se do seu "porquê" antes de começar</span>
                      </li>
                    </ul>
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
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 shadow-sm">
          <Button variant="outline" onClick={() => setShowWeeklyHabits(false)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Resumo Semanal de Hábitos
          </h2>
          <div className="w-9"></div>
        </div>
        
        <Card className="border border-indigo-100 shadow-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
            <CardTitle className="flex items-center gap-2 text-indigo-700">
              <Calendar className="h-5 w-5 text-indigo-500" />
              {format(weekStart, "dd/MM", { locale: ptBR })} - {format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}
            </CardTitle>
            <CardDescription className="text-indigo-500">
              Visualize os hábitos que você concluiu durante esta semana
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {weeklyHabits.length > 0 ? (
              <div>
                <div className="grid grid-cols-7 gap-1 mb-6">
                  {eachDayOfInterval({ start: weekStart, end: weekEnd }).map((date, i) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const completedCount = weeklyHabits.filter(log => 
                      log.date.split('T')[0] === dateStr
                    ).length;
                    const isToday = isSameDay(date, today);
                    
                    return (
                      <div key={i} className="flex flex-col items-center">
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          {format(date, 'E', { locale: ptBR })}
                        </div>
                        <div 
                          className={`h-16 w-16 rounded-lg flex items-center justify-center relative overflow-hidden
                            ${isToday ? 'bg-blue-100 ring-2 ring-blue-300' : 'bg-gray-50 border border-gray-200'}`}
                        >
                          <div className="text-sm font-medium">{format(date, 'd')}</div>
                          {completedCount > 0 && (
                            <div className="absolute bottom-1 right-1 bg-green-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                              {completedCount}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="space-y-4 mt-8">
                  {weeklyHabits.map((log) => (
                    <div key={log.id} className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="bg-green-500 text-white p-2 rounded-full">
                        <Check className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{log.habit_title}</div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(log.date), "EEEE, dd 'de' MMMM, HH:mm", { locale: ptBR })}
                        </div>
                      </div>
                      <div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                          Concluído
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center p-10 bg-gray-50 rounded-xl border border-gray-100">
                <div className="mx-auto w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                  <ListCheck className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-medium text-center mb-2">Nenhum hábito concluído</h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto">
                  Você ainda não concluiu nenhum hábito esta semana. Complete seus hábitos diários para acompanhar seu progresso aqui.
                </p>
                <Button onClick={() => setShowWeeklyHabits(false)}>
                  Voltar para Hábitos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section - Redesenhado com visual mais futurista */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-xl shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center z-10">
          <div className="text-white mb-4 md:mb-0">
            <h2 className="text-3xl font-bold flex items-center mb-1">
              <Sparkles className="h-7 w-7 mr-3 text-amber-300" />
              Sistema de Hábitos
            </h2>
            <p className="text-indigo-100 max-w-lg">
              Transforme sua vida através de hábitos consistentes. Pequenas ações diárias levam a grandes resultados.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3">
            <Button 
              onClick={() => fetchWeeklyHabits()}
              variant="outline"
              className="bg-white/20 text-white hover:bg-white/30 border-white/30 backdrop-blur-sm"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Resumo Semanal
            </Button>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-white text-indigo-700 hover:bg-blue-50 font-medium shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Hábito
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Redesenhado com estilo moderno */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 bg-indigo-50 p-1 rounded-lg border border-indigo-100">
          <TabsTrigger 
            value="dashboard" 
            className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger 
            value="habits"
            className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
          >
            <ListCheck className="mr-2 h-4 w-4" />
            Hábitos
          </TabsTrigger>
          <TabsTrigger 
            value="insights"
            className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
          >
            <Lightbulb className="mr-2 h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>
        
        {/* Dashboard Tab Content */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <HabitStats habits={habits} habitLogs={habitLogs} />
          
          {/* Seção de Próximos Passos */}
          <Card className="border border-indigo-100 overflow-hidden shadow-md">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
              <CardTitle className="flex items-center text-lg text-indigo-700">
                <Target className="h-5 w-5 mr-2 text-indigo-500" />
                Próximos Passos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Plus className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-700 mb-1">Crie novos hábitos</h3>
                    <p className="text-sm text-green-600">Adicione novos hábitos alinhados com seus objetivos</p>
                    <Button 
                      variant="link" 
                      className="text-green-700 p-0 h-auto mt-1"
                      onClick={() => setShowForm(true)}
                    >
                      Adicionar hábito →
                    </Button>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-purple-700 mb-1">Use o Modo Foco</h3>
                    <p className="text-sm text-purple-600">Concentre-se em um hábito de cada vez</p>
                    <Button 
                      variant="link" 
                      className="text-purple-700 p-0 h-auto mt-1"
                      onClick={() => {
                        if (habits.length > 0) {
                          enterFocusMode(habits[0]);
                        } else {
                          toast.info("Crie um hábito primeiro para usar o modo foco");
                        }
                      }}
                    >
                      Ativar modo foco →
                    </Button>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-700 mb-1">Veja seu progresso</h3>
                    <p className="text-sm text-blue-600">Acompanhe seus dados e celebre vitórias</p>
                    <Button 
                      variant="link" 
                      className="text-blue-700 p-0 h-auto mt-1"
                      onClick={() => fetchWeeklyHabits()}
                    >
                      Ver resumo semanal →
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Sistema de Motivação */}
          <Card className="border border-amber-100 overflow-hidden shadow-md">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
              <CardTitle className="flex items-center text-lg text-amber-700">
                <Flame className="h-5 w-5 mr-2 text-amber-500" />
                Sistema de Motivação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-lg border border-amber-200 mb-4">
                <h3 className="font-medium text-amber-800 flex items-center mb-3">
                  <Trophy className="h-5 w-5 mr-2 text-amber-600" />
                  Dica do dia para vencer a procrastinação
                </h3>
                <p className="text-amber-700 italic">"{currentTip}"</p>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                onClick={getAntiProcrastinationTip}
              >
                <Zap className="h-4 w-4 mr-2 text-amber-500" />
                Nova Dica Anti-Procrastinação
              </Button>
            </CardContent>
          </Card>
          
          {/* Hábitos em Destaque */}
          {habits.length > 0 && (
            <Card className="border border-indigo-100 overflow-hidden shadow-md">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
                <CardTitle className="flex items-center text-lg text-indigo-700">
                  <Star className="h-5 w-5 mr-2 text-amber-500" />
                  Hábitos em Destaque
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {habits.slice(0, 4).map(habit => (
                    <div 
                      key={habit.id}
                      className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                      onClick={() => enterFocusMode(habit)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            id={`featured-${habit.id}`}
                            checked={habit.completed}
                            onCheckedChange={(checked) => {
                              updateHabitStatus(habit.id, checked ? 'completed' : 'pending');
                            }}
                            className="mt-1"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div>
                            <label 
                              htmlFor={`featured-${habit.id}`}
                              className={`font-medium ${habit.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}
                            >
                              {habit.title}
                            </label>
                            
                            <div className="flex items-center gap-2 mt-1">
                              {habit.streak > 0 && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center">
                                  <Flame className="h-3 w-3 mr-1 text-amber-500" />
                                  {habit.streak} dias
                                </Badge>
                              )}
                              
                              {habit.category && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center">
                                  {getCategoryIcon(habit.category)}
                                  {habitCategories.find(c => c.value === habit.category)?.label || habit.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            enterFocusMode(habit);
                          }}
                        >
                          <Target className="h-4 w-4 text-indigo-500" />
                          <span className="sr-only">Modo Foco</span>
                        </Button>
                      </div>
                      
                      {streakProgress[habit.id] && (
                        <div className="mt-3 pt-2">
                          <Progress value={streakProgress[habit.id].nextMilestone} className="h-1 bg-gray-100" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {habits.length > 4 && (
                  <Button 
                    variant="link" 
                    className="mt-4 w-full text-indigo-600"
                    onClick={() => setActiveTab('habits')}
                  >
                    Ver todos os {habits.length} hábitos →
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Habits Tab Content */}
        <TabsContent value="habits" className="space-y-6 mt-6">
          {/* Filtros e Controles */}
          <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={filterCategory === null ? "secondary" : "outline"} 
                  size="sm"
                  onClick={() => setFilterCategory(null)}
                  className="h-8"
                >
                  <ListCheck className="h-3.5 w-3.5 mr-1" />
                  Todos
                </Button>
                
                {habitCategories.map(category => (
                  <Button
                    key={category.value}
                    variant={filterCategory === category.value ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setFilterCategory(category.value)}
                    className="h-8"
                  >
                    {category.icon}
                    <span className="ml-1">{category.label}</span>
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant={viewMode === 'grid' ? "secondary" : "outline"} 
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Rows className="h-4 w-4" />
                  <span className="sr-only">Visualização em grade</span>
                </Button>
                <Button 
                  variant={viewMode === 'table' ? "secondary" : "outline"} 
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8 w-8 p-0"
                >
                  <Table className="h-4 w-4" />
                  <span className="sr-only">Visualização em tabela</span>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Lista de Hábitos */}
          {filteredHabits.length > 0 ? (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
              {filteredHabits.map(habit => (
                <Card 
                  key={habit.id} 
                  className={`border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 ${
                    habit.impact ? `bg-gradient-to-br ${impactColors[habit.impact as 'low' | 'medium' | 'high'].bg} bg-opacity-50` : ''
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          id={`habit-${habit.id}`}
                          checked={habit.completed}
                          onCheckedChange={() => updateHabitStatus(habit.id, habit.completed ? 'pending' : 'completed')}
                        />
                        <div>
                          <label 
                            htmlFor={`habit-${habit.id}`}
                            className={`font-medium ${habit.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}
                          >
                            {habit.title}
                          </label>
                          
                          {habit.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {habit.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 rounded-full"
                          onClick={() => enterFocusMode(habit)}
                        >
                          <Target className="h-4 w-4 text-indigo-500" />
                          <span className="sr-only">Modo Foco</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 rounded-full"
                          onClick={() => handleEditHabit(habit)}
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => openDeleteDialog(habit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {habit.category && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center">
                          {getCategoryIcon(habit.category)}
                          <span className="ml-1">
                            {habitCategories.find(c => c.value === habit.category)?.label || habit.category}
                          </span>
                        </Badge>
                      )}
                      
                      {habit.schedule_days.length > 0 && (
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatScheduleDays(habit.schedule_days)}
                        </Badge>
                      )}
                      
                      {habit.difficulty && (
                        <Badge 
                          variant="outline" 
                          className={difficultyBadges[habit.difficulty].color}
                        >
                          {difficultyBadges[habit.difficulty].icon}
                          {habit.difficulty === 'easy' ? 'Fácil' : 
                            habit.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                        </Badge>
                      )}
                      
                      {habit.impact && (
                        <HabitImpactBadge impact={habit.impact} />
                      )}
                    </div>
                    
                    {/* Barra de Progresso da Sequência */}
                    {streakProgress[habit.id] && (
                      <div className="mt-4">
                        <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                          <div className="flex items-center">
                            <Flame className="h-3 w-3 mr-1 text-amber-500" />
                            <span>{habit.streak} dias</span>
                          </div>
                          <span>Meta: {streakProgress[habit.id].next} dias</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              habit.impact 
                                ? impactColors[habit.impact as 'low' | 'medium' | 'high'].progress 
                                : 'bg-indigo-400'
                            } rounded-full transition-all duration-500`}
                            style={{ width: `${streakProgress[habit.id].nextMilestone}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Nível Visual */}
                    {habit.streak > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                        <VisualLevel streak={habit.streak} />
                        
                        {habit.best_streak && habit.best_streak > habit.streak && (
                          <div className="flex items-center text-xs text-amber-600">
                            <Trophy className="h-3 w-3 mr-1" />
                            <span>Recorde: {habit.best_streak} dias</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-10 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <ListCheck className="h-10 w-10 text-indigo-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum hábito encontrado</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {filterCategory 
                  ? "Não há hábitos na categoria selecionada. Tente selecionar outra categoria ou criar um novo hábito."
                  : "Você ainda não criou nenhum hábito. Comece criando seu primeiro hábito agora mesmo."}
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Novo Hábito
              </Button>
            </div>
          )}
          
          {isLoading && (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          )}
        </TabsContent>
        
        {/* Insights Tab Content */}
        <TabsContent value="insights" className="space-y-6 mt-6">
          <Card className="border border-indigo-100 overflow-hidden shadow-md">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
              <CardTitle className="flex items-center text-lg text-indigo-700">
                <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
                Insights e Melhores Práticas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-lg border border-amber-100">
                    <h3 className="font-medium text-amber-800 flex items-center mb-3">
                      <Star className="h-5 w-5 mr-2 text-amber-600" />
                      Dicas para Criar Bons Hábitos
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="bg-amber-100 p-1.5 rounded-full mt-0.5">
                          <Check className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        <div>
                          <span className="font-medium text-amber-700">Comece pequeno</span>
                          <p className="text-sm text-amber-600">Inicie com versões mínimas do hábito desejado.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="bg-amber-100 p-1.5 rounded-full mt-0.5">
                          <Check className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        <div>
                          <span className="font-medium text-amber-700">Seja consistente</span>
                          <p className="text-sm text-amber-600">A consistência diária é mais importante que a perfeição.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="bg-amber-100 p-1.5 rounded-full mt-0.5">
                          <Check className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                        <div>
                          <span className="font-medium text-amber-700">Use gatilhos</span>
                          <p className="text-sm text-amber-600">Associe seu hábito a algo que você já faz regularmente.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-100">
                    <h3 className="font-medium text-purple-800 flex items-center mb-3">
                      <Brain className="h-5 w-5 mr-2 text-purple-600" />
                      A Ciência dos Hábitos
                    </h3>
                    <p className="text-sm text-purple-700 mb-3">
                      Hábitos são formados através de um ciclo de quatro estágios:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/70 p-3 rounded-lg border border-purple-100">
                        <span className="font-medium text-purple-700">1. Deixa</span>
                        <p className="text-xs text-purple-600">O gatilho que inicia o comportamento</p>
                      </div>
                      <div className="bg-white/70 p-3 rounded-lg border border-purple-100">
                        <span className="font-medium text-purple-700">2. Desejo</span>
                        <p className="text-xs text-purple-600">A motivação por trás do hábito</p>
                      </div>
                      <div className="bg-white/70 p-3 rounded-lg border border-purple-100">
                        <span className="font-medium text-purple-700">3. Resposta</span>
                        <p className="text-xs text-purple-600">A ação do hábito em si</p>
                      </div>
                      <div className="bg-white/70 p-3 rounded-lg border border-purple-100">
                        <span className="font-medium text-purple-700">4. Recompensa</span>
                        <p className="text-xs text-purple-600">O benefício que você recebe</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-100">
                    <h3 className="font-medium text-blue-800 flex items-center mb-3">
                      <Target className="h-5 w-5 mr-2 text-blue-600" />
                      Vencendo a Procrastinação
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="bg-blue-100 p-1.5 rounded-full mt-0.5">
                          <Timer className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Técnica Pomodoro</span>
                          <p className="text-sm text-blue-600">Trabalhe por 25 minutos e descanse por 5 minutos.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="bg-blue-100 p-1.5 rounded-full mt-0.5">
                          <Zap className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Regra dos 2 minutos</span>
                          <p className="text-sm text-blue-600">Comece fazendo apenas por 2 minutos para superar a inércia.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="bg-blue-100 p-1.5 rounded-full mt-0.5">
                          <Rocket className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <div>
                          <span className="font-medium text-blue-700">Elimine distrações</span>
                          <p className="text-sm text-blue-600">Crie um ambiente propício ao foco e à concentração.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-lg border border-green-100">
                    <h3 className="font-medium text-green-800 flex items-center mb-3">
                      <Trophy className="h-5 w-5 mr-2 text-green-600" />
                      Mantendo a Motivação
                    </h3>
                    <div className="space-y-3">
                      <p className="text-sm text-green-700">
                        A motivação muda com o tempo. Construa sistemas que não dependam apenas da sua vontade:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="bg-white/70 p-3 rounded-lg border border-green-100 flex items-start gap-2">
                          <div className="bg-green-100 p-1.5 rounded-full">
                            <Heart className="h-3.5 w-3.5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-green-700">Conecte com propósito</span>
                            <p className="text-xs text-green-600">Lembre-se do porquê este hábito é importante para você</p>
                          </div>
                        </div>
                        <div className="bg-white/70 p-3 rounded-lg border border-green-100 flex items-start gap-2">
                          <div className="bg-green-100 p-1.5 rounded-full">
                            <Target className="h-3.5 w-3.5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-green-700">Acompanhe visualmente</span>
                            <p className="text-xs text-green-600">Veja seu progresso diariamente para manter o momentum</p>
                          </div>
                        </div>
                        <div className="bg-white/70 p-3 rounded-lg border border-green-100 flex items-start gap-2">
                          <div className="bg-green-100 p-1.5 rounded-full">
                            <Users className="h-3.5 w-3.5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-green-700">Responsabilidade social</span>
                            <p className="text-xs text-green-600">Compartilhe seus objetivos com pessoas que te apoiam</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {habits.length > 0 && (
            <Card className="border border-indigo-100 overflow-hidden shadow-md">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100">
                <CardTitle className="flex items-center text-lg text-indigo-700">
                  <Activity className="h-5 w-5 mr-2 text-indigo-500" />
                  Análise de Hábitos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Melhores Sequências */}
                  <div>
                    <h3 className="text-sm font-medium text-indigo-700 mb-3 flex items-center">
                      <Flame className="h-4 w-4 mr-2 text-amber-500" />
                      Melhores Sequências
                    </h3>
                    <div className="space-y-2">
                      {habits
                        .sort((a, b) => (b.streak || 0) - (a.streak || 0))
                        .slice(0, 3)
                        .map(habit => (
                          <div 
                            key={habit.id}
                            className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-amber-100 p-2 rounded-full">
                                <Flame className="h-4 w-4 text-amber-600" />
                              </div>
                              <span className="font-medium text-gray-700">{habit.title}</span>
                            </div>
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                              {habit.streak} dias
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  {/* Hábitos Recentes */}
                  <div>
                    <h3 className="text-sm font-medium text-indigo-700 mb-3 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-blue-500" />
                      Hábitos Recentemente Adicionados
                    </h3>
                    <div className="space-y-2">
                      {habits
                        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                        .slice(0, 3)
                        .map(habit => (
                          <div 
                            key={habit.id}
                            className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 p-2 rounded-full">
                                <Plus className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="font-medium text-gray-700">{habit.title}</span>
                            </div>
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                              Novo
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border border-red-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este hábito? Esta ação não pode ser desfeita e todos os registros deste hábito serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setHabitToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteHabit}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reward Dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 w-24 h-24 rounded-full flex items-center justify-center shadow-lg">
              <Trophy className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <DialogHeader className="pt-12">
            <DialogTitle className="text-center text-2xl font-bold text-amber-800">
              🎉 Conquista Desbloqueada!
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-6">
            <div className="text-5xl font-bold mb-4">
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xl py-1 px-4">
                {earnedBadge}
              </Badge>
            </div>
            <p className="text-lg font-medium mb-2 text-amber-800">{earnedReward}</p>
            <p className="text-amber-700">Continue mantendo a consistência para desbloquear mais conquistas!</p>
          </div>
          
          <div className="bg-white/70 rounded-lg p-4 border border-amber-200">
            <p className="text-amber-700 italic text-center">
              "Não é sobre ser perfeito. É sobre consistência. Formar hábitos não é um destino, é uma jornada contínua."
            </p>
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white border-none shadow-md" 
              onClick={() => setShowRewardDialog(false)}
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tip Dialog */}
      <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-indigo-700 flex items-center">
              <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
              Dica Anti-Procrastinação
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-white/70 border border-indigo-200 rounded-lg p-4 text-indigo-800 relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-indigo-200 rounded-full opacity-50"></div>
              <p className="italic relative z-10">"{currentTip}"</p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-none shadow-md" 
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
