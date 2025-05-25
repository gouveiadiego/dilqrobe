
import React from 'react';
import { MeetingCalendar } from './MeetingCalendar';
import { Meeting } from '@/hooks/useMeetings';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface MeetingSidebarProps {
  meetings: Meeting[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
  isLoading: boolean;
}

export const MeetingSidebar = ({ 
  meetings, 
  onDateSelect, 
  selectedDate, 
  isLoading 
}: MeetingSidebarProps) => {
  const upcomingMeetings = meetings
    .filter(m => m.status === "scheduled")
    .sort((a, b) => new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <MeetingCalendar
        meetings={meetings}
        onDateSelect={onDateSelect}
        selectedDate={selectedDate}
      />

      <div className="p-4 bg-[#9b87f5]/10 border border-[#9b87f5]/20 rounded-lg text-[#6E59A5]">
        <h3 className="font-medium mb-2">Próximas reuniões</h3>
        <div className="space-y-2">
          {isLoading ? (
            <LoadingSpinner size="sm" text="Carregando..." />
          ) : upcomingMeetings.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma reunião agendada</p>
          ) : (
            upcomingMeetings.map(meeting => (
              <div key={meeting.id} className="text-sm p-2 bg-white rounded border border-[#9b87f5]/20">
                <div className="font-medium truncate">{meeting.title}</div>
                <div className="text-xs text-gray-500">
                  {new Date(meeting.meeting_date).toLocaleDateString()} -{" "}
                  {new Date(meeting.meeting_date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </div>
                {meeting.client && (
                  <div className="text-xs text-gray-500 truncate">
                    Cliente: {meeting.client.name}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
