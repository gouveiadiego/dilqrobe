
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/types/task";
import React from "react";

interface RecurringTaskOptionsProps {
  isRecurring: boolean;
  onIsRecurringChange: React.Dispatch<React.SetStateAction<boolean>>;
  recurrenceCount: number | null;
  onRecurrenceCountChange: React.Dispatch<React.SetStateAction<number | null>>;
  recurrenceType: Task["recurrence_type"];
  onRecurrenceTypeChange: React.Dispatch<React.SetStateAction<Task["recurrence_type"]>>;
}

export function RecurringTaskOptions({
  isRecurring,
  onIsRecurringChange,
  recurrenceCount,
  onRecurrenceCountChange,
  recurrenceType,
  onRecurrenceTypeChange,
}: RecurringTaskOptionsProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isRecurring"
          checked={isRecurring}
          onCheckedChange={(checked) => {
            onIsRecurringChange(checked as boolean);
            if (!checked) onRecurrenceCountChange(null);
          }}
        />
        <label htmlFor="isRecurring" className="text-sm text-gray-700">
          Tarefa recorrente
        </label>
      </div>

      {isRecurring && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              placeholder="Número de repetições"
              value={recurrenceCount === null ? '' : recurrenceCount}
              onChange={(e) => onRecurrenceCountChange(e.target.value ? Number(e.target.value) : null)}
              className="w-40"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRecurrenceCountChange(null)}
              className={recurrenceCount === null ? 'bg-purple-100 text-purple-700' : ''}
            >
              ∞ Infinito
            </Button>
          </div>

          <Select value={recurrenceType || ''} onValueChange={(value: Task["recurrence_type"]) => onRecurrenceTypeChange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de recorrência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diária</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="biweekly">Quinzenal</SelectItem>
              <SelectItem value="monthly">Mensal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
