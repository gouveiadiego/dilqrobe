
import { useState } from "react";
import { Task } from "@/types/task";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { cn } from "@/lib/utils";

interface KanbanCalendarProps {
  tasks: Task[];
  onTaskDrop: (taskId: string, date: Date) => void;
}

export function KanbanCalendar({ tasks, onTaskDrop }: KanbanCalendarProps) {
  const [currentMonth] = useState(new Date());
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const handleDragStart = (taskId: string) => {
    setDraggingTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (draggingTaskId) {
      onTaskDrop(draggingTaskId, date);
      setDraggingTaskId(null);
    }
  };

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.getDate() === date.getDate() &&
             taskDate.getMonth() === date.getMonth() &&
             taskDate.getFullYear() === date.getFullYear();
    });
  };

  return (
    <div className="w-full mt-8">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h3>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {monthDays.map((day) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[200px] rounded-lg border",
                isCurrentDay ? "border-purple-500 shadow-lg shadow-purple-100" : "border-gray-200"
              )}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
            >
              <div className={cn(
                "p-2 border-b text-xs font-medium",
                isCurrentDay ? "bg-purple-50" : "bg-gray-50"
              )}>
                <div className="flex flex-col">
                  <span className="text-gray-600">
                    {format(day, "d", { locale: ptBR })}
                  </span>
                  <span className="text-gray-400 text-[10px]">
                    {format(day, "EEEE", { locale: ptBR })}
                  </span>
                </div>
              </div>

              <div className="p-1 space-y-1">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    className={cn(
                      "p-2 rounded-lg border cursor-move transition-all text-xs",
                      "hover:shadow-md hover:border-purple-200",
                      task.completed ? "bg-gray-50 border-gray-200" : "bg-white border-gray-100",
                      {
                        "border-red-200 bg-red-50": task.priority === "high",
                        "border-yellow-200 bg-yellow-50": task.priority === "medium",
                        "border-green-200 bg-green-50": task.priority === "low"
                      }
                    )}
                  >
                    <div className="font-medium text-gray-900 line-clamp-2">
                      {task.title}
                    </div>
                    {task.category && (
                      <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        {task.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
