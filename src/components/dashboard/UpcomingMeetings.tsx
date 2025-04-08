
import { useState, useEffect } from "react";
import { useMeetings, Meeting } from "@/hooks/useMeetings";
import { format, differenceInDays, differenceInHours, isPast, isSameDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const UpcomingMeetings = () => {
  const { meetings, isLoading } = useMeetings();
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (meetings) {
      // Filter scheduled meetings and sort by date (closest first)
      const filtered = meetings
        .filter(meeting => meeting.status === "scheduled")
        .sort((a, b) => 
          new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime()
        )
        .slice(0, 4); // Show only the next 4 meetings
      
      setUpcomingMeetings(filtered);
    }
  }, [meetings]);

  const getStatusBadge = (meeting: Meeting) => {
    const meetingDate = new Date(meeting.meeting_date);
    
    if (isPast(meetingDate)) {
      return <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Atrasada</Badge>;
    }
    
    const daysUntil = differenceInDays(meetingDate, new Date());
    const hoursUntil = differenceInHours(meetingDate, new Date());
    
    if (daysUntil === 0 && hoursUntil < 3) {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Em breve</Badge>;
    }
    
    if (daysUntil === 0) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Hoje</Badge>;
    }
    
    if (daysUntil <= 2) {
      return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Próxima</Badge>;
    }
    
    return <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Agendada</Badge>;
  };

  const formatTimeRemaining = (dateString: string) => {
    const meetingDate = new Date(dateString);
    const now = new Date();
    
    if (isPast(meetingDate)) {
      return "Atrasada";
    }
    
    const daysUntil = differenceInDays(meetingDate, now);
    
    if (daysUntil === 0) {
      const hoursUntil = differenceInHours(meetingDate, now);
      return hoursUntil <= 1 
        ? "Em menos de 1 hora" 
        : `Em ${hoursUntil} horas`;
    }
    
    if (daysUntil === 1) return "Amanhã";
    if (daysUntil <= 7) return `Em ${daysUntil} dias`;
    
    return format(meetingDate, "dd/MM/yyyy");
  };

  const handleViewAllMeetings = () => {
    navigate("/dashboard/meetings");
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-dilq-accent/10 dark-hover-glow h-full">
      <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-100/50 dark:from-blue-900/20 dark:to-indigo-900/20 pb-3 border-b dark:border-gray-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Próximas Reuniões</CardTitle>
          <div className="h-7 w-7 rounded-lg bg-white/80 dark:bg-gray-800/80 shadow-sm flex items-center justify-center">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Carregando reuniões...</p>
          </div>
        ) : upcomingMeetings.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto flex items-center justify-center mb-3">
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Nenhuma reunião agendada</span>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <div 
                key={meeting.id}
                className={`p-3 rounded-lg transition-all duration-200 border 
                  ${isSameDay(new Date(meeting.meeting_date), new Date()) 
                    ? 'border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-900/20' 
                    : 'border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm truncate">{meeting.title}</span>
                  {getStatusBadge(meeting)}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <Clock className="h-3 w-3" />
                  <span>{format(new Date(meeting.meeting_date), "dd/MM/yyyy HH:mm")}</span>
                  <span className="ml-1 text-blue-600 dark:text-blue-400 font-medium">
                    ({formatTimeRemaining(meeting.meeting_date)})
                  </span>
                </div>
                {meeting.client && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <User className="h-3 w-3" />
                    <span>Cliente: {meeting.client.name}</span>
                  </div>
                )}
                {meeting.location && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic truncate">
                    {meeting.location}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            onClick={handleViewAllMeetings}
          >
            Ver todas as reuniões
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
