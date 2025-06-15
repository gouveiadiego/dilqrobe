
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import React from "react";

interface DueDateSelectorPopoverProps {
  date: Date | null;
  onSelect: React.Dispatch<React.SetStateAction<Date | null>>;
}

export function DueDateSelectorPopover({ date, onSelect }: DueDateSelectorPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={`h-8 w-8 ${date ? 'text-purple-400 hover:text-purple-500' : 'text-gray-400 hover:text-gray-500'}`}>
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar mode="single" selected={date || undefined} onSelect={(d) => onSelect(d || null)} locale={ptBR} initialFocus />
      </PopoverContent>
    </Popover>
  );
}
