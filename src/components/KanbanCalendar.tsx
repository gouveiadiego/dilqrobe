
import { useState } from "react";
import { Task } from "@/types/task";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isToday, 
  isTomorrow, 
  isAfter, 
  isEqual, 
  startOfWeek,
  addDays,
  addMonths,
  getDay
} from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Card } from "./ui/card";

interface KanbanCalendarProps {
  tasks: Task[];
  onTaskDrop: (taskId: string, date: Date) => void;
}

export function KanbanCalendar({
  tasks,
  onTaskDrop
}: KanbanCalendarProps) {
  const [currentMonth] = useState(new Date());
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  // Get days of the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Calculate days needed to complete the grid
  // First, get the last day of the week (0 = Sunday, 6 = Saturday)
  const lastDayOfWeek = getDay(monthEnd);
  // Calculate how many days from the next month we need (to complete the week)
  const daysToAdd = lastDayOfWeek < 6 ? 6 - lastDayOfWeek : 0;
  // Get the extended end date including days from next month
  const extendedEndDate = addDays(monthEnd, daysToAdd);
  
  // Get all days to display (current month + days from next month to complete the grid)
  const monthDays = eachDayOfInterval({
    start: monthStart,
    end: extendedEndDate
  });

  console.log("KanbanCalendar - Month days:", monthDays.map(d => d.toISOString().split('T')[0]));

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
      // Compare year, month, and day for more accurate date comparison
      return isEqual(
        new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate()),
        new Date(date.getFullYear(), date.getMonth(), date.getDate())
      );
    });
  };

  const isNextMonth = (date: Date) => {
    const currentMonthDate = currentMonth.getMonth();
    return date.getMonth() !== currentMonthDate;
  };

  const getTodayTasks = () => {
    return tasks.filter(task => {
      if (!task.completed && task.due_date) {
        const taskDate = new Date(task.due_date);
        return isToday(taskDate);
      }
      return false;
    });
  };

  const getTomorrowTasks = () => {
    return tasks.filter(task => {
      if (!task.completed && task.due_date) {
        const taskDate = new Date(task.due_date);
        return isTomorrow(taskDate);
      }
      return false;
    });
  };

  const getFutureTasks = () => {
    return tasks.filter(task => {
      if (!task.completed && task.due_date) {
        const taskDate = new Date(task.due_date);
        return isAfter(taskDate, new Date()) && !isToday(taskDate) && !isTomorrow(taskDate);
      }
      return false;
    });
  };

  return (
    <Card className="w-full mt-8 p-6 bg-white shadow-sm">
      <div className="space-y-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {format(currentMonth, "MMMM yyyy", { locale: pt })}
          </h3>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {/* Add weekday headers */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
            <div key={`header-${index}`} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          
          {monthDays.map(day => {
            const dayTasks = getTasksForDay(day);
            const isCurrentDay = isToday(day);
            const isNextMonthDay = isNextMonth(day);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "rounded-lg border min-h-[100px] h-full",
                  isCurrentDay ? "border-purple-500 shadow-lg shadow-purple-100" : "border-gray-200",
                  isNextMonthDay ? "bg-gray-50/50" : ""
                )}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, day)}
              >
                <div className={cn(
                  "p-2 border-b text-xs font-medium",
                  isCurrentDay ? "bg-purple-50" : isNextMonthDay ? "bg-gray-100/50" : "bg-gray-50"
                )}>
                  <div className="flex flex-col">
                    <span className={cn(
                      "text-gray-600",
                      isNextMonthDay && "text-gray-400"
                    )}>
                      {format(day, "d", { locale: pt })}
                    </span>
                    <span className={cn(
                      "text-gray-400 text-[10px]",
                      isNextMonthDay && "text-gray-400/70"
                    )}>
                      {format(day, "EEEE", { locale: pt })}
                    </span>
                  </div>
                </div>

                <div className="p-2 space-y-2">
                  {dayTasks.map(task => (
                    <div
                      key={task.id}
                      draggable={!task.completed}
                      onDragStart={() => !task.completed && handleDragStart(task.id)}
                      className={cn(
                        "p-2 rounded-lg border transition-all text-xs",
                        task.completed ? "bg-gray-50 border-gray-200 opacity-50" : "bg-white border-gray-100 hover:shadow-md hover:border-purple-200 cursor-move",
                        {
                          "border-red-200 bg-red-50": !task.completed && task.priority === "high",
                          "border-yellow-200 bg-yellow-50": !task.completed && task.priority === "medium",
                          "border-green-200 bg-green-50": !task.completed && task.priority === "low"
                        }
                      )}
                    >
                      <div className={cn(
                        "font-medium text-gray-900 break-words",
                        task.completed && "line-through"
                      )}>
                        {task.title}
                      </div>
                      {task.category && (
                        <span className={cn(
                          "inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full",
                          task.completed ? "bg-gray-100 text-gray-600" : "bg-purple-100 text-purple-700"
                        )}>
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
    </Card>
  );
}
