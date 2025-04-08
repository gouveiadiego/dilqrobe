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
  Rocket,
  BookOpen,
  DollarSign,
  Users,
  PieChart,
  Briefcase,
  LayoutGrid as Rows,
  Table 
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
      {/* Estatísticas Principais */}
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
