
import { useState, useEffect, useRef } from "react";
import { Task } from "@/types/task";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Scroll } from "lucide-react";

interface KanbanCalendarProps {
  tasks: Task[];
  onTaskDrop: (taskId: string, date: Date) => void;
}

export function KanbanCalendar({ tasks, onTaskDrop }: KanbanCalendarProps) {
  const [currentMonth] = useState(new Date());
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleScroll = (direction: "left" | "right") => {
    if (!containerRef.current) return;
    const scrollAmount = 300;
    const newScrollLeft = containerRef.current.scrollLeft + (direction === "right" ? scrollAmount : -scrollAmount);
    containerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth"
    });
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
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleScroll("left")}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <Scroll className="h-5 w-5 transform rotate-180" />
          </button>
          <button
            onClick={() => handleScroll("right")}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <Scroll className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar"
        style={{ scrollBehavior: "smooth" }}
      >
        {monthDays.map((day) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex-none w-72 min-h-[400px] rounded-lg border",
                isCurrentDay ? "border-purple-500 shadow-lg shadow-purple-100" : "border-gray-200"
              )}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
            >
              <div className={cn(
                "p-3 border-b text-sm font-medium",
                isCurrentDay ? "bg-purple-50" : "bg-gray-50"
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    {format(day, "d 'de' MMMM", { locale: ptBR })}
                  </span>
                  <span className="text-gray-400">
                    {format(day, "EEEE", { locale: ptBR })}
                  </span>
                </div>
              </div>

              <div className="p-2 space-y-2">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    className={cn(
                      "p-3 rounded-lg border cursor-move transition-all",
                      "hover:shadow-md hover:border-purple-200",
                      task.completed ? "bg-gray-50 border-gray-200" : "bg-white border-gray-100",
                      {
                        "border-red-200 bg-red-50": task.priority === "high",
                        "border-yellow-200 bg-yellow-50": task.priority === "medium",
                        "border-green-200 bg-green-50": task.priority === "low"
                      }
                    )}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {task.title}
                    </div>
                    {task.category && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
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

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
