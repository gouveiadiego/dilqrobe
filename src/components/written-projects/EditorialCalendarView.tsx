
import React from "react";
import { Calendar } from "@/components/ui/calendar";

interface EditorialCalendarViewProps {
  month: Date;
  calendarPosts: { post_date: string }[];
  onDayClick: (day: Date) => void;
  onMonthChange: (d: Date) => void;
}

export function EditorialCalendarView({ month, calendarPosts, onDayClick, onMonthChange }: EditorialCalendarViewProps) {
  return (
    <div>
      <Calendar
        mode="single"
        month={month}
        selected={null}
        onMonthChange={onMonthChange}
        modifiers={{
          postdays: calendarPosts.map(p => new Date(p.post_date))
        }}
        modifiersClassNames={{
          postdays: "bg-dilq-purple/40 rounded-full"
        }}
        onDayClick={onDayClick}
        className="pointer-events-auto"
      />
      <div className="text-xs mt-1 text-gray-400">Clique em um dia para adicionar uma nova ideia de post.</div>
    </div>
  );
}
