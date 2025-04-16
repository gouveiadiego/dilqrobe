
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
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Atrasada</Badge>;
    }
    
    const daysUntil = differenceInDays(meetingDate, new Date());
    const hoursUntil = differenceInHours(meetingDate, new Date());
    
    if (daysUntil === 0 && hoursUntil < 3) {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">Em breve</Badge>;
    }
    
    if (daysUntil === 0) {
      return <Badge variant="outline" className="bg-[#9b87f5]/10 text-[#6E59A5] border-[#9b87f5]/20">Hoje</Badge>;
    }
    
    if (daysUntil <= 2) {
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Próxima</Badge>;
    }
    
    return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Agendada</Badge>;
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
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg h-full">
      <CardHeader className="bg-gradient-to-r from-[#9b87f5]/10 to-[#9b87f5]/20 pb-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Próximas Reuniões</CardTitle>
          <div className="h-7 w-7 rounded-lg bg-white/80 shadow-sm flex items-center justify-center">
            <Calendar className="h-4 w-4 text-[#9b87f5]" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500">Carregando reuniões...</p>
          </div>
        ) : upcomingMeetings.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-3">
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>
            <span className="text-sm text-gray-500">Nenhuma reunião agendada</span>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <div 
                key={meeting.id}
                className={`p-3 rounded-lg transition-all duration-200 border 
                  ${isSameDay(new Date(meeting.meeting_date), new Date()) 
                    ? 'border-[#9b87f5]/30 bg-[#9b87f5]/5' 
                    : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm truncate">{meeting.title}</span>
                  {getStatusBadge(meeting)}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                  <Clock className="h-3 w-3" />
                  <span>{format(new Date(meeting.meeting_date), "dd/MM/yyyy HH:mm")}</span>
                  <span className="ml-1 text-[#9b87f5] font-medium">
                    ({formatTimeRemaining(meeting.meeting_date)})
                  </span>
                </div>
                {meeting.client && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <User className="h-3 w-3" />
                    <span>Cliente: {meeting.client.name}</span>
                  </div>
                )}
                {meeting.location && (
                  <div className="text-xs text-gray-500 mt-1 italic truncate">
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
            className="w-full text-[#9b87f5] border-[#9b87f5]/30 hover:bg-[#9b87f5]/10 hover:border-[#9b87f5]/50"
            onClick={handleViewAllMeetings}
          >
            Ver todas as reuniões
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
