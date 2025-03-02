
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { HabitForm } from "./HabitForm";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

export function HabitsTab() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("ativos");
  const [currentQuote, setCurrentQuote] = useState(0);
  const [totalCompletedHabits, setTotalCompletedHabits] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

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
              label: "Ver hábito",
              onClick: () => document.getElementById(habit.id)?.scrollIntoView({ behavior: 'smooth' })
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
        }

        const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
        const randomMessage = motivationalMessages[randomIndex];
        
        toast.success(randomMessage, {
          description: "Continue assim! Cada hábito concluído te leva mais perto dos seus objetivos.",
          icon: <Flame className="h-5 w-5 text-amber-500" />
        });
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
          {/* Habits List */}
          {habits.length === 0 ? (
            <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-dashed border-2 border-blue-200">
              <CardContent className="py-8 flex flex-col items-center justify-center">
                <Target className="h-16 w-16 text-blue-300 mb-4" />
                <h3 className="text-xl font-medium mb-2 text-blue-800">Nenhum hábito criado</h3>
                <p className="text-center text-blue-600 mb-4 max-w-md">
                  Comece criando seu primeiro hábito e construa uma rotina melhor para alcançar seus objetivos.
                </p>
                <Button 
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Hábito
                </Button>
              </CardContent>
            </Card>
          ) : (
            habits.map((habit) => (
              <Card 
                key={habit.id} 
                id={habit.id} 
                className={`transition-all duration-300 hover:shadow-xl border-none overflow-hidden ${
                  habit.completed ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 
                  habit.status === 'pending' ? 'bg-gradient-to-br from-amber-50 to-yellow-50' : 
                  'bg-gradient-to-br from-rose-50 to-red-50'
                }`}
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  habit.completed ? 'bg-gradient-to-b from-green-400 to-emerald-600' : 
                  habit.status === 'pending' ? 'bg-gradient-to-b from-amber-400 to-yellow-600' : 
                  'bg-gradient-to-b from-rose-400 to-red-600'
                }`}></div>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {habit.completed ? (
                        <div className="bg-gradient-to-br from-amber-400 to-yellow-300 p-1.5 rounded-full mr-3 shadow-inner-light animate-pulse-subtle">
                          <Flame className="h-5 w-5 text-white" />
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-1.5 rounded-full mr-3">
                          <Target className="h-5 w-5 text-indigo-500" />
                        </div>
                      )}
                      <div>
                        <CardTitle className={`text-lg ${
                          habit.completed ? 'text-green-800' : 
                          habit.status === 'pending' ? 'text-amber-800' : 
                          'text-rose-800'
                        }`}>{habit.title}</CardTitle>
                        <CardDescription className={
                          habit.completed ? 'text-green-700/70' : 
                          habit.status === 'pending' ? 'text-amber-700/70' : 
                          'text-rose-700/70'
                        }>{habit.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditHabit(habit)}
                        className="border-none bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant={habit.completed ? "default" : "outline"}
                        size="sm"
                        className={habit.completed 
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-none shadow-md" 
                          : "border-none bg-white/50 backdrop-blur-sm hover:bg-white/80 text-indigo-700 hover:text-indigo-800"}
                        onClick={() => updateHabitStatus(habit.id, habit.completed ? 'pending' : 'completed')}
                      >
                        {habit.completed ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Concluído
                          </>
                        ) : (
                          <>
                            <ListCheck className="h-4 w-4 mr-1" />
                            Marcar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center">
                    <div className="bg-red-100 p-1 rounded-full mr-2">
                      <Heart className="h-3 w-3 text-red-500" />
                    </div>
                    <span className="text-sm font-medium">Sequência: <span className={`${
                      habit.streak > 5 ? 'text-amber-600 font-bold' : 'text-gray-700'
                    }`}>{habit.streak} dias</span></span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso mensal</span>
                    <span className="font-medium">{habit.progress}%</span>
                  </div>
                  <Progress 
                    value={habit.progress} 
                    className="h-2 bg-gray-100" 
                    indicatorClassName="bg-gradient-to-r from-blue-400 to-indigo-600"
                  />
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground pt-1">
                    <div className="flex items-center gap-1 bg-white/70 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
                      <Calendar className="h-3 w-3 text-blue-500" />
                      <span className="text-xs">{formatScheduleDays(habit.schedule_days)}</span>
                    </div>
                    {habit.schedule_time && (
                      <div className="flex items-center gap-1 bg-white/70 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
                        <Clock className="h-3 w-3 text-purple-500" />
                        <span className="text-xs">às {habit.schedule_time}</span>
                      </div>
                    )}
                    <div className={`px-2 py-1 rounded-full text-xs shadow-sm ${
                      habit.status === 'completed' ? 'bg-green-100/80 text-green-800 backdrop-blur-sm' :
                      habit.status === 'pending' ? 'bg-amber-100/80 text-amber-800 backdrop-blur-sm' :
                      'bg-rose-100/80 text-rose-800 backdrop-blur-sm'
                    }`}>
                      {habit.status === 'completed' ? 'Concluído' :
                      habit.status === 'pending' ? 'Pendente' : 'Atrasado'}
                    </div>
                  </div>
                  
                  {habit.streak > 0 && (
                    <div className={`flex items-center gap-2 p-2 rounded-md mt-2 ${
                      habit.streak >= 7 
                        ? 'bg-gradient-to-r from-amber-100/70 to-yellow-100/70 backdrop-blur-sm border border-amber-200/50' 
                        : 'bg-blue-50/70 backdrop-blur-sm border border-blue-100/50'
                    }`}>
                      {habit.streak >= 7 ? (
                        <Medal className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Star className="h-4 w-4 text-blue-500" />
                      )}
                      <span className={`text-sm ${
                        habit.streak >= 7 ? 'text-amber-700' : 'text-blue-700'
                      }`}>
                        {habit.streak >= 7 
                          ? `Incrível! ${habit.streak} dias consecutivos!` 
                          : `Sequência atual: ${habit.streak} ${habit.streak === 1 ? 'dia' : 'dias'}`
                        }
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="dicas" className="space-y-4">
          <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 border-none shadow-md overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-400 to-indigo-600"></div>
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-indigo-900">
                <Sparkles className="h-5 w-5 text-indigo-500 mr-2" />
                Benefícios dos Bons Hábitos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {benefitsOfHabits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-2 bg-white/60 backdrop-blur-sm p-3 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md hover:bg-white/80">
                    <ThumbsUp className="h-4 w-4 text-green-600 mt-1" />
                    <span className="text-sm text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-sky-50 to-blue-50 border-none shadow-md overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-sky-400 to-blue-600"></div>
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-blue-900">
                <Brain className="h-5 w-5 text-blue-500 mr-2" />
                Dicas para Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-md bg-gradient-to-br from-blue-100/50 to-blue-50/50 backdrop-blur-sm border border-blue-200/50 shadow-sm transition-all duration-300 hover:shadow-md">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                  <div className="bg-blue-100 p-1 rounded-full mr-2">
                    <ArrowRight className="h-3 w-3 text-blue-700" />
                  </div>
                  Comece Pequeno
                </h4>
                <p className="text-sm text-blue-700 pl-6">
                  Comece com hábitos pequenos e alcançáveis que você possa realizar em menos de 2 minutos. 
                  Isso reduz a resistência inicial e aumenta suas chances de consistência.
                </p>
              </div>
              
              <div className="p-3 rounded-md bg-gradient-to-br from-green-100/50 to-green-50/50 backdrop-blur-sm border border-green-200/50 shadow-sm transition-all duration-300 hover:shadow-md">
                <h4 className="font-medium text-green-800 mb-2 flex items-center">
                  <div className="bg-green-100 p-1 rounded-full mr-2">
                    <ArrowRight className="h-3 w-3 text-green-700" />
                  </div>
                  Consistência Acima da Perfeição
                </h4>
                <p className="text-sm text-green-700 pl-6">
                  É melhor fazer seu hábito de forma imperfeita do que falhar em fazê-lo perfeitamente. 
                  Consistência por longos períodos é o que gera resultados transformadores.
                </p>
              </div>
              
              <div className="p-3 rounded-md bg-gradient-to-br from-amber-100/50 to-amber-50/50 backdrop-blur-sm border border-amber-200/50 shadow-sm transition-all duration-300 hover:shadow-md">
                <h4 className="font-medium text-amber-800 mb-2 flex items-center">
                  <div className="bg-amber-100 p-1 rounded-full mr-2">
                    <ArrowRight className="h-3 w-3 text-amber-700" />
                  </div>
                  Celebre Vitórias Pequenas
                </h4>
                <p className="text-sm text-amber-700 pl-6">
                  Não subestime o poder de celebrar suas pequenas vitórias. Cada vez que você completa um hábito, 
                  seu cérebro libera dopamina, reforçando o comportamento positivo.
                </p>
              </div>
              
              <div className="p-3 rounded-md bg-gradient-to-br from-purple-100/50 to-purple-50/50 backdrop-blur-sm border border-purple-200/50 shadow-sm transition-all duration-300 hover:shadow-md">
                <h4 className="font-medium text-purple-800 mb-2 flex items-center">
                  <div className="bg-purple-100 p-1 rounded-full mr-2">
                    <ArrowRight className="h-3 w-3 text-purple-700" />
                  </div>
                  Ambiente Favorável
                </h4>
                <p className="text-sm text-purple-700 pl-6">
                  Organize seu ambiente para facilitar seus bons hábitos e dificultar os maus. 
                  Pequenas mudanças no seu ambiente podem ter um grande impacto nos seus comportamentos diários.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Próximas Conquistas */}
      <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 border-none shadow-md overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-400 to-violet-600"></div>
        <CardHeader>
          <CardTitle className="text-lg flex items-center text-violet-900">
            <BookHeart className="h-5 w-5 text-violet-500 mr-2" />
            Próximas Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-md bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/50 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="bg-amber-100 p-1.5 rounded-full">
                <Medal className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-sm text-amber-800">10 dias consecutivos</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-md bg-gradient-to-r from-purple-50 to-fuchsia-50 border border-purple-200/50 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="bg-purple-100 p-1.5 rounded-full">
                <Star className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-sm text-purple-800">1000 pontos acumulados</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-md bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="bg-green-100 p-1.5 rounded-full">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm text-green-800">5 hábitos completados em um dia</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-md bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200/50 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="bg-blue-100 p-1.5 rounded-full">
                <Flame className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm text-blue-800">30 dias de consistência</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
