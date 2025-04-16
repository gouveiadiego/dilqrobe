
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Meeting } from "@/hooks/useMeetings";
import { isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MeetingCalendarProps {
  meetings: Meeting[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export const MeetingCalendar = ({
  meetings,
  onDateSelect,
  selectedDate,
}: MeetingCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Create an array of dates that have meetings
  const meetingDates = meetings.map((meeting) => parseISO(meeting.meeting_date));

  // Custom day rendering function
  const renderDay = (day: Date) => {
    const hasMeeting = meetingDates.some((date) => isSameDay(date, day));
    
    return (
      <div className="relative h-9 w-9 p-0">
        <div
          className={`h-full w-full flex items-center justify-center rounded-full ${
            hasMeeting ? "font-semibold" : ""
          }`}
        >
          {day.getDate()}
        </div>
        {hasMeeting && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-[#9b87f5]"></div>
        )}
      </div>
    );
  };

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handlePrevMonth}
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-medium text-center text-gray-800">
          {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
        </h3>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleNextMonth}
          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-3 bg-gray-100">
        <Calendar
          mode="single"
          selected={selectedDate || undefined}
          onSelect={(date) => date && onDateSelect(date)}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          className="rounded-md border-0"
          components={{
            Day: ({ date, ...props }) => renderDay(date),
          }}
          classNames={{
            day_selected: "bg-[#9b87f5] text-white hover:bg-[#7E69AB] hover:text-white focus:bg-[#9b87f5] focus:text-white",
            day_today: "bg-[#9b87f5]/10 text-[#6E59A5]",
          }}
        />
      </div>
    </div>
  );
};
