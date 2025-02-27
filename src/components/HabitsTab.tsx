
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
  ThumbsUp
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
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">
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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">Hábitos</h2>
          <p className="text-muted-foreground">
            Acompanhe seus hábitos e construa uma vida melhor, um dia de cada vez.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Hábito
        </Button>
      </div>

      {/* Motivational Quote */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50 text-blue-900">
        <CardContent className="pt-6">
          <blockquote className="italic text-lg">
            "{habitQuotes[currentQuote].quote}"
          </blockquote>
          <div className="text-right mt-2 font-semibold">— {habitQuotes[currentQuote].author}</div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sequência Atual</CardTitle>
            <Trophy className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{longestStreak} dias</div>
            <p className="text-xs text-muted-foreground">
              Continue mantendo a consistência!
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <ChartLine className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCompletionRate()}%</div>
            <div className="mt-2">
              <Progress value={getCompletionRate()} className="h-2 bg-purple-100" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Hábitos completados hoje
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hábitos Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompletedHabits}</div>
            <p className="text-xs text-muted-foreground">
              Cada conclusão te aproxima do sucesso!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for habit view */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="ativos">Hábitos Ativos</TabsTrigger>
          <TabsTrigger value="dicas">Dicas & Benefícios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ativos" className="space-y-4">
          {/* Habits List */}
          {habits.length === 0 ? (
            <Card className="bg-gray-50 border-dashed border-2">
              <CardContent className="py-8 flex flex-col items-center justify-center">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum hábito criado</h3>
                <p className="text-center text-muted-foreground mb-4">
                  Comece criando seu primeiro hábito e construa uma rotina melhor.
                </p>
                <Button onClick={() => setShowForm(true)}>
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
                className={`transition-all hover:shadow-md ${
                  habit.completed ? 'border-l-4 border-l-green-500 bg-green-50' : 
                  habit.status === 'pending' ? 'border-l-4 border-l-amber-500' : 
                  'border-l-4 border-l-red-300'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {habit.completed && <Flame className="h-5 w-5 text-amber-500 mr-2" />}
                      <div>
                        <CardTitle className="text-lg">{habit.title}</CardTitle>
                        <CardDescription>{habit.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditHabit(habit)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant={habit.completed ? "default" : "outline"}
                        size="sm"
                        className={habit.completed ? "bg-green-600 hover:bg-green-700" : ""}
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
                    <Heart className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-sm font-medium">Sequência: <span className="text-amber-600">{habit.streak} dias</span></span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso mensal</span>
                    <span className="font-medium">{habit.progress}%</span>
                  </div>
                  <Progress value={habit.progress} className="h-2" />
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>{formatScheduleDays(habit.schedule_days)}</span>
                    </div>
                    {habit.schedule_time && (
                      <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full">
                        <Clock className="h-4 w-4 text-purple-500" />
                        <span>às {habit.schedule_time}</span>
                      </div>
                    )}
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      habit.status === 'completed' ? 'bg-green-100 text-green-800' :
                      habit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {habit.status === 'completed' ? 'Concluído' :
                      habit.status === 'pending' ? 'Pendente' : 'Atrasado'}
                    </div>
                  </div>
                  
                  {habit.streak > 0 && (
                    <div className="flex items-center gap-2 bg-amber-50 p-2 rounded-md mt-2">
                      <Medal className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-amber-700">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Star className="h-5 w-5 text-amber-500 mr-2" />
                Benefícios dos Bons Hábitos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {benefitsOfHabits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <ThumbsUp className="h-4 w-4 text-green-600 mt-1" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Target className="h-5 w-5 text-blue-500 mr-2" />
                Dicas para Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="p-3 border border-blue-100 rounded-md bg-blue-50">
                <h4 className="font-medium text-blue-700 mb-2">Comece Pequeno</h4>
                <p className="text-sm text-blue-600">
                  Comece com hábitos pequenos e alcançáveis que você possa realizar em menos de 2 minutos. 
                  Isso reduz a resistência inicial e aumenta suas chances de consistência.
                </p>
              </div>
              
              <div className="p-3 border border-green-100 rounded-md bg-green-50">
                <h4 className="font-medium text-green-700 mb-2">Consistência Acima da Perfeição</h4>
                <p className="text-sm text-green-600">
                  É melhor fazer seu hábito de forma imperfeita do que falhar em fazê-lo perfeitamente. 
                  Consistência por longos períodos é o que gera resultados transformadores.
                </p>
              </div>
              
              <div className="p-3 border border-amber-100 rounded-md bg-amber-50">
                <h4 className="font-medium text-amber-700 mb-2">Celebre Vitórias Pequenas</h4>
                <p className="text-sm text-amber-600">
                  Não subestime o poder de celebrar suas pequenas vitórias. Cada vez que você completa um hábito, 
                  seu cérebro libera dopamina, reforçando o comportamento positivo.
                </p>
              </div>
              
              <div className="p-3 border border-purple-100 rounded-md bg-purple-50">
                <h4 className="font-medium text-purple-700 mb-2">Ambiente Favorável</h4>
                <p className="text-sm text-purple-600">
                  Organize seu ambiente para facilitar seus bons hábitos e dificultar os maus. 
                  Pequenas mudanças no seu ambiente podem ter um grande impacto nos seus comportamentos diários.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Próximas Conquistas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Trophy className="h-5 w-5 text-amber-500 mr-2" />
            Próximas Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 border border-amber-200 rounded-md bg-amber-50">
              <Medal className="h-4 w-4 text-amber-500" />
              <span className="text-sm">🏆 10 dias consecutivos</span>
            </div>
            <div className="flex items-center gap-2 p-2 border border-purple-200 rounded-md bg-purple-50">
              <Star className="h-4 w-4 text-purple-500" />
              <span className="text-sm">⭐ 1000 pontos acumulados</span>
            </div>
            <div className="flex items-center gap-2 p-2 border border-green-200 rounded-md bg-green-50">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm">🎯 5 hábitos completados em um dia</span>
            </div>
            <div className="flex items-center gap-2 p-2 border border-blue-200 rounded-md bg-blue-50">
              <Flame className="h-4 w-4 text-blue-500" />
              <span className="text-sm">🌟 30 dias de consistência</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
