
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
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500"></div>
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
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800/20">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-medium text-center">
          {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
        </h3>
        <Button variant="ghost" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-3">
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
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          }}
        />
      </div>
    </div>
  );
};
