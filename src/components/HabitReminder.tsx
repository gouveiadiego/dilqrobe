
import { useState, useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { Bell, Check, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Habit = {
  id: string;
  title: string;
  schedule_time?: string;
};

const motivationalMessages = [
  "Lembre-se: consistência é a chave para o sucesso! 🔑",
  "Pequenas ações diárias criam grandes resultados! 💪",
  "Este é o seu momento de construir a pessoa que você quer ser! ⭐",
  "Que tal investir alguns minutos em você mesmo agora? 🌱",
  "Cada hábito completado te leva mais perto dos seus objetivos! 🏆"
];

export function HabitReminder() {
  const [checkedHabits, setCheckedHabits] = useState<Record<string, boolean>>({});
  const notificationSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Criar elemento de áudio para a notificação
    notificationSound.current = new Audio("/notification-sound.mp3");
    
    return () => {
      if (notificationSound.current) {
        notificationSound.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const checkHabits = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      // Get current day of the week
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const today = days[new Date().getDay()];
      
      // Get current time
      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHour}:${currentMinute}`;

      // Fetch habits for today with time close to current time (within 5 minutes)
      const { data: habits, error } = await supabase
        .from("habits")
        .select("id, title, schedule_time")
        .eq("user_id", session.user.id)
        .eq("active", true)
        .contains("schedule_days", [today])
        .not("schedule_time", "is", null);

      if (error) {
        console.error("Error fetching habits:", error);
        return;
      }

      // Check if any habit is due (within 5 minutes of scheduled time)
      habits?.forEach((habit: Habit) => {
        if (!habit.schedule_time) return;
        
        // Compare times (only hour and minute)
        const habitTime = habit.schedule_time;
        const [habitHour, habitMinute] = habitTime.split(':').map(Number);
        const [nowHour, nowMinute] = [now.getHours(), now.getMinutes()];
        
        // Calculate difference in minutes
        const habitTotalMinutes = habitHour * 60 + habitMinute;
        const nowTotalMinutes = nowHour * 60 + nowMinute;
        const diffMinutes = Math.abs(habitTotalMinutes - nowTotalMinutes);
        
        // If habit is due within 5 minutes and hasn't been checked yet
        if (diffMinutes <= 5 && !checkedHabits[habit.id]) {
          showHabitReminder(habit);
          setCheckedHabits(prev => ({ ...prev, [habit.id]: true }));
        }
      });
    };

    // Check habits initially
    checkHabits();
    
    // Set interval to check every minute
    const intervalId = setInterval(checkHabits, 60000);
    
    return () => clearInterval(intervalId);
  }, [checkedHabits]);

  const showHabitReminder = (habit: Habit) => {
    // Get random motivational message
    const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
    const message = motivationalMessages[randomIndex];
    
    // Tocar o som de notificação
    if (notificationSound.current) {
      notificationSound.current.play().catch(err => {
        console.error("Erro ao reproduzir som de notificação:", err);
      });
    }

    // Exibir a notificação usando o toast correto
    toast({
      title: `Hora do seu hábito: ${habit.title}`,
      description: message,
      variant: "default",
      duration: 10000, // 10 seconds
      action: (
        <div className="flex flex-col space-y-2 mt-2 sm:flex-row sm:space-x-2 sm:space-y-0">
          <button 
            onClick={() => completeHabit(habit.id)}
            className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm transition-colors"
          >
            <Check size={14} />
            <span>Completar</span>
          </button>
          <button 
            onClick={() => dismissReminder()}
            className="flex items-center justify-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-md text-sm transition-colors"
          >
            <XCircle size={14} />
            <span>Depois</span>
          </button>
        </div>
      ),
    });
  };

  const completeHabit = async (habitId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      
      // Get the habit info
      const { data: habitData } = await supabase
        .from("habits")
        .select("streak, best_streak, title")
        .eq("id", habitId)
        .single();

      if (habitData) {
        const newStreak = habitData.streak + 1;
        const currentBestStreak = habitData.best_streak || 0;
        const newBestStreak = Math.max(newStreak, currentBestStreak);
        
        // Update habit streak
        await supabase
          .from("habits")
          .update({ 
            streak: newStreak,
            best_streak: newBestStreak
          })
          .eq("id", habitId);
          
        // Log habit completion
        await supabase
          .from("habit_logs")
          .insert({
            habit_id: habitId,
            user_id: session.user.id,
            date: new Date().toISOString().split('T')[0],
            notes: null,
            mood: 'good'
          });
        
        toast({
          title: "Hábito completado!",
          description: "Continue assim, você está construindo um futuro melhor!",
          duration: 3000,
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error completing habit:", error);
      toast({
        title: "Erro ao completar hábito",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const dismissReminder = () => {
    // Just dismiss the notification
  };

  // This component doesn't render anything visible
  return null;
}
