
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
  };

  const handleCreateHabit = () => {
    setSelectedHabit(null);
    setShowForm(true);
  };

  const handleEditHabit = (habit: Habit) => {
    setSelectedHabit(habit);
    setShowForm(true);
  };

  const handleHabitFormSuccess = () => {
    setShowForm(false);
    fetchHabits();
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabitToDelete(habitId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteHabit = async () => {
    if (!habitToDelete) return;

    try {
      const { error } = await supabase
        .from("habits")
        .update({ active: false })
        .eq("id", habitToDelete);

      if (error) throw error;

      setHabits(habits.filter(h => h.id !== habitToDelete));
      toast.success("Hábito removido com sucesso");
    } catch (error) {
      console.error("Erro ao remover hábito:", error);
      toast.error("Erro ao remover hábito");
    } finally {
      setDeleteDialogOpen(false);
      setHabitToDelete(null);
    }
  };

  const handleFocusMode = (habit: Habit) => {
    setFocusMode(true);
    setFocusHabit(habit);
  };

  const exitFocusMode = () => {
    setFocusMode(false);
    setFocusHabit(null);
  };

  const handleCategoryFilter = (category: string | null) => {
    setFilterCategory(category);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'table' : 'grid');
  };

  // Filter habits by category if a filter is selected
  const filteredHabits = filterCategory 
    ? habits.filter(habit => habit.category === filterCategory)
    : habits;

  return (
    <div className="container mx-auto p-4 space-y-6">
      {showTipDialog && (
        <Dialog open={showTipDialog} onOpenChange={setShowTipDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Dica do Dia
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-lg font-medium text-muted-foreground">{currentTip}</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowTipDialog(false)}>Entendi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {showRewardDialog && (
        <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
          <DialogContent className="bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-800">
                <Trophy className="h-5 w-5 text-amber-500" />
                Conquista Desbloqueada!
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 text-center">
              <div className="w-16 h-16 bg-amber-400 rounded-full mx-auto flex items-center justify-center mb-4">
                <Award className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-amber-800 mb-2">{earnedBadge}</h3>
              <p className="text-lg text-amber-700">{earnedReward}</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowRewardDialog(false)} 
                className="bg-amber-500 hover:bg-amber-600">
                Continuar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      {deleteDialogOpen && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Hábito</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este hábito? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteHabit} className="bg-red-500 hover:bg-red-600">
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {showForm && (
        <Card className="mb-6 border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader>
            <CardTitle>{selectedHabit ? "Editar Hábito" : "Novo Hábito"}</CardTitle>
          </CardHeader>
          <CardContent>
            <HabitForm
              onSuccess={handleHabitFormSuccess}
              onCancel={() => setShowForm(false)}
              initialData={selectedHabit || undefined}
            />
          </CardContent>
        </Card>
      )}

      {focusMode && focusHabit ? (
        <div className="space-y-4">
          <Button variant="outline" onClick={exitFocusMode} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <Card className="border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl text-blue-800">{focusHabit.title}</CardTitle>
                <VisualLevel streak={focusHabit.streak} />
              </div>
              {focusHabit.description && (
                <CardDescription className="text-blue-600">{focusHabit.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-amber-500" />
                    <span className="font-medium">Sequência Atual: </span>
                    <span className="font-bold text-lg">{focusHabit.streak} dias</span>
                  </div>
                  
                  {focusHabit.best_streak && (
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-purple-500" />
                      <span className="font-medium">Melhor Sequência: </span>
                      <span className="font-bold text-lg">{focusHabit.best_streak} dias</span>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {focusHabit.category && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                        {habitCategories.find(c => c.value === focusHabit.category)?.icon}
                        {habitCategories.find(c => c.value === focusHabit.category)?.label}
                      </Badge>
                    )}
                    
                    {focusHabit.difficulty && (
                      <Badge variant="outline" className={difficultyBadges[focusHabit.difficulty].color}>
                        {difficultyBadges[focusHabit.difficulty].icon}
                        {focusHabit.difficulty === 'easy' ? 'Fácil' : 
                          focusHabit.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                      </Badge>
                    )}
                    
                    {focusHabit.impact && <HabitImpactBadge impact={focusHabit.impact} />}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                  <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                    Programação
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {focusHabit.schedule_days.map(day => {
                      const dayLabels: Record<string, string> = {
                        monday: 'Seg',
                        tuesday: 'Ter',
                        wednesday: 'Qua',
                        thursday: 'Qui',
                        friday: 'Sex',
                        saturday: 'Sáb',
                        sunday: 'Dom'
                      };
                      return (
                        <Badge key={day} variant="outline" className="bg-gray-100">
                          {dayLabels[day]}
                        </Badge>
                      );
                    })}
                  </div>
                  {focusHabit.schedule_time && (
                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      <Clock className="h-3 w-3 mr-1" />
                      {focusHabit.schedule_time}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                  <Target className="h-4 w-4 mr-2 text-purple-500" />
                  Progresso para o próximo marco
                </h3>
                {streakProgress[focusHabit.id] && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{streakProgress[focusHabit.id].current} dias</span>
                      <span>{streakProgress[focusHabit.id].next} dias</span>
                    </div>
                    <Progress value={streakProgress[focusHabit.id].nextMilestone} className="h-2" />
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                  <CalendarDays className="h-4 w-4 mr-2 text-green-500" />
                  Calendário de Completude
                </h3>
                <HabitCalendarView habit={focusHabit} habitLogs={habitLogs} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-blue-100 bg-blue-50 rounded-b-lg">
              {!focusHabit.completed ? (
                <Button 
                  className="w-full bg-green-500 hover:bg-green-600 gap-2" 
                  onClick={() => updateHabitStatus(focusHabit.id, 'completed')}
                >
                  <Check className="h-5 w-5" />
                  Completar Hoje
                </Button>
              ) : (
                <div className="w-full text-center py-2 rounded-md bg-green-100 text-green-700 flex items-center justify-center">
                  <Check className="h-5 w-5 mr-2" />
                  Hábito já completo hoje!
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-blue-900 dark:text-blue-100">Meus Hábitos</h2>
              <p className="text-gray-600 dark:text-gray-400">Gerencie seus hábitos e acompanhe seu progresso</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCreateHabit} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Novo Hábito
              </Button>
              
              <Button variant="outline" onClick={toggleViewMode} className="gap-2">
                {viewMode === 'grid' ? 
                  <><Table className="h-4 w-4" /> Tabela</> : 
                  <><Rows className="h-4 w-4" /> Grade</>
                }
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[400px]">
              <TabsTrigger value="dashboard">
                <LayoutGrid as={Rows} className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="all">
                <ListCheck className="h-4 w-4 mr-2" />
                Hábitos
              </TabsTrigger>
              <TabsTrigger value="categories">
                <List className="h-4 w-4 mr-2" />
                Categorias
              </TabsTrigger>
              <TabsTrigger value="stats">
                <BarChart3 className="h-4 w-4 mr-2" />
                Estatísticas
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-700">Hábitos Completados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-2xl font-bold text-green-700">{totalCompletedHabits} / {habits.length}</span>
                    </div>
                    <Progress 
                      value={habits.length > 0 ? (totalCompletedHabits / habits.length) * 100 : 0} 
                      className="h-2 mt-2 bg-green-100" 
                    />
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-amber-700">Sequência Mais Longa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Flame className="h-5 w-5 text-amber-500 mr-2" />
                      <span className="text-2xl font-bold text-amber-700">{longestStreak} dias</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-purple-700">Total de Hábitos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <ListCheck className="h-5 w-5 text-purple-500 mr-2" />
                      <span className="text-2xl font-bold text-purple-700">{habits.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      Hábitos Diários
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {habits.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">Você ainda não possui hábitos cadastrados</p>
                        <Button onClick={handleCreateHabit}>Criar Primeiro Hábito</Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {habits.slice(0, 5).map(habit => (
                          <div key={habit.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-blue-100 hover:bg-blue-50 transition-colors">
                            <div className="flex items-center space-x-4">
                              <Checkbox
                                checked={habit.completed}
                                onCheckedChange={() => updateHabitStatus(habit.id, habit.completed ? 'pending' : 'completed')}
                              />
                              <div>
                                <div className="font-medium">{habit.title}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Flame className="h-3 w-3 text-amber-500" />
                                  {habit.streak} dias
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleFocusMode(habit)}
                              >
                                <Zap className="h-4 w-4 text-amber-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditHabit(habit)}
                              >
                                <Edit className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteHabit(habit.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        {habits.length > 5 && (
                          <div className="text-center mt-4">
                            <Button variant="outline" onClick={() => setActiveTab("all")}>
                              Ver Todos os Hábitos
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-purple-500" />
                      Próximos Marcos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(streakProgress)
                        .sort((a, b) => (b[1].current / b[1].next) - (a[1].current / a[1].next))
                        .slice(0, 3)
                        .map(([habitId, progress]) => {
                          const habit = habits.find(h => h.id === habitId);
                          if (!habit) return null;
                          
                          return (
                            <div key={habitId} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{habit.title}</span>
                                <span className="text-sm text-gray-500">{progress.current}/{progress.next} dias</span>
                              </div>
                              <Progress 
                                value={progress.nextMilestone} 
                                className="h-2" 
                                indicatorClassName={
                                  progress.visualLevel === 'master' ? "bg-amber-400" :
                                  progress.visualLevel === 'expert' ? "bg-purple-400" :
                                  progress.visualLevel === 'advanced' ? "bg-green-400" :
                                  progress.visualLevel === 'intermediate' ? "bg-cyan-400" :
                                  "bg-blue-400"
                                }
                              />
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="all">
              {isLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : habits.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <ListCheck className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum hábito encontrado</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Comece criando seu primeiro hábito para acompanhar seu progresso e construir uma rotina mais produtiva.
                  </p>
                  <Button onClick={handleCreateHabit}>Criar Primeiro Hábito</Button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredHabits.map(habit => {
                    const habitProgress = streakProgress[habit.id];
                    
                    return (
                      <Card key={habit.id} className={`overflow-hidden border ${
                        habit.impact ? `border-${habit.impact}-200` : 'border-gray-200'
                      } hover:shadow-md transition-all duration-200`}>
                        <div className={`h-2 w-full ${
                          habit.impact === 'high' ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                          habit.impact === 'medium' ? 'bg-gradient-to-r from-purple-400 to-pink-400' :
                          'bg-gradient-to-r from-blue-400 to-cyan-400'
                        }`}></div>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle>{habit.title}</CardTitle>
                            <VisualLevel streak={habit.streak} />
                          </div>
                          {habit.description && (
                            <CardDescription>{habit.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex flex-wrap gap-2 mb-4">
                            {habit.category && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {habitCategories.find(c => c.value === habit.category)?.icon}
                                {habitCategories.find(c => c.value === habit.category)?.label}
                              </Badge>
                            )}
                            
                            {habit.difficulty && (
                              <Badge variant="outline" className={difficultyBadges[habit.difficulty].color}>
                                {difficultyBadges[habit.difficulty].icon}
                                {habit.difficulty === 'easy' ? 'Fácil' : 
                                  habit.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                              </Badge>
                            )}
                            
                            {habit.impact && <HabitImpactBadge impact={habit.impact} />}
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-1">
                                <Flame className="h-4 w-4 text-amber-500" />
                                <span>Sequência: <strong>{habit.streak} dias</strong></span>
                              </div>
                              
                              {habit.best_streak && habit.best_streak > 0 && (
                                <div className="flex items-center gap-1">
                                  <Trophy className="h-4 w-4 text-purple-500" />
                                  <span>Melhor: <strong>{habit.best_streak}</strong></span>
                                </div>
                              )}
                            </div>
                            
                            {habitProgress && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>Próximo marco: {habitProgress.next} dias</span>
                                  <span>{habitProgress.current}/{habitProgress.next}</span>
                                </div>
                                <Progress value={habitProgress.nextMilestone} className="h-1.5" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-4">
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleFocusMode(habit)}
                            >
                              <Zap className="h-4 w-4 text-amber-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditHabit(habit)}
                            >
                              <Edit className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteHabit(habit.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                          
                          <Button 
                            variant={habit.completed ? "outline" : "default"}
                            size="sm"
                            disabled={habit.completed}
                            onClick={() => updateHabitStatus(habit.id, 'completed')}
                            className={`transition-all ${habit.completed ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
                          >
                            {habit.completed ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Completo
                              </>
                            ) : "Completar"}
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hábito</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sequência</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredHabits.map(habit => (
                        <tr key={habit.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="font-medium text-gray-900">{habit.title}</div>
                                {habit.description && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">{habit.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {habit.category ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center">
                                {habitCategories.find(c => c.value === habit.category)?.icon}
                                {habitCategories.find(c => c.value === habit.category)?.label}
                              </Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <Flame className="h-4 w-4 text-amber-500 mr-1" />
                              <span className="text-gray-900">{habit.streak} dias</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {habit.completed ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <Check className="h-3 w-3 mr-1" />
                                Completo
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Pendente
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleFocusMode(habit)}
                              >
                                <Zap className="h-4 w-4 text-amber-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => updateHabitStatus(habit.id, habit.completed ? 'pending' : 'completed')}
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditHabit(habit)}
                              >
                                <Edit className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleDeleteHabit(habit.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="categories">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {habitCategories.map(category => {
                  const categoryHabits = habits.filter(h => h.category === category.value);
                  const completedCount = categoryHabits.filter(h => h.completed).length;
                  const progress = categoryHabits.length > 0 
                    ? Math.round((completedCount / categoryHabits.length) * 100) 
                    : 0;
                    
                  return (
                    <Card key={category.value} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                          {category.icon}
                          {category.label}
                        </CardTitle>
                        <CardDescription>
                          {categoryHabits.length} hábitos
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Progresso de hoje</span>
                              <span>{completedCount}/{categoryHabits.length}</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          
                          {categoryHabits.length > 0 ? (
                            <div className="space-y-2">
                              {categoryHabits.slice(0, 3).map(habit => (
                                <div 
                                  key={habit.id} 
                                  className="flex items-center justify-between p-2 rounded border border-gray-100 hover:bg-gray-50"
                                >
                                  <div className="flex items-center gap-2">
                                    <Checkbox 
                                      checked={habit.completed}
                                      onCheckedChange={() => updateHabitStatus(habit.id, habit.completed ? 'pending' : 'completed')}
                                    />
                                    <span className="text-sm font-medium">{habit.title}</span>
                                  </div>
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0"
                                    onClick={() => handleFocusMode(habit)}
                                  >
                                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-sm text-gray-500">
                              Nenhum hábito nesta categoria
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          size="sm"
                          onClick={() => {
                            handleCategoryFilter(category.value);
                            setActiveTab("all");
                          }}
                        >
                          Ver Todos
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="stats">
              <HabitStats habits={habits} habitLogs={habitLogs} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
