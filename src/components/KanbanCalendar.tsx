
import { useState } from "react";
import { Task } from "@/types/task";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isTomorrow, isAfter } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";

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
    <div className="w-full mt-8">
      <div className="grid grid-cols-1 md:grid-cols-[1fr,300px] gap-6">
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold">
              {format(currentMonth, "MMMM yyyy", { locale: pt })}
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
                    "min-h-[100px] rounded-lg border",
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
                        {format(day, "d", { locale: pt })}
                      </span>
                      <span className="text-gray-400 text-[10px]">
                        {format(day, "EEEE", { locale: pt })}
                      </span>
                    </div>
                  </div>

                  <div className="p-1 space-y-1">
                    {dayTasks.map((task) => (
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
                          "font-medium text-gray-900 line-clamp-2",
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

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Fazer Hoje</h3>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-4">
                {getTodayTasks().map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      "bg-white border-gray-200 hover:shadow-md",
                      {
                        "border-red-200 bg-red-50": task.priority === "high",
                        "border-yellow-200 bg-yellow-50": task.priority === "medium",
                        "border-green-200 bg-green-50": task.priority === "low"
                      }
                    )}
                  >
                    <div className="font-medium text-gray-900">{task.title}</div>
                    {task.category && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        {task.category}
                      </span>
                    )}
                  </div>
                ))}
                {getTodayTasks().length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhuma tarefa para hoje
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Amanhã</h3>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-4">
                {getTomorrowTasks().map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      "bg-white border-gray-200 hover:shadow-md",
                      {
                        "border-red-200 bg-red-50": task.priority === "high",
                        "border-yellow-200 bg-yellow-50": task.priority === "medium",
                        "border-green-200 bg-green-50": task.priority === "low"
                      }
                    )}
                  >
                    <div className="font-medium text-gray-900">{task.title}</div>
                    {task.category && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        {task.category}
                      </span>
                    )}
                  </div>
                ))}
                {getTomorrowTasks().length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhuma tarefa para amanhã
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Próximos Dias</h3>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-4">
                {getFutureTasks().map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all",
                      "bg-white border-gray-200 hover:shadow-md",
                      {
                        "border-red-200 bg-red-50": task.priority === "high",
                        "border-yellow-200 bg-yellow-50": task.priority === "medium",
                        "border-green-200 bg-green-50": task.priority === "low"
                      }
                    )}
                  >
                    <div className="font-medium text-gray-900">{task.title}</div>
                    <div className="flex gap-2 mt-1">
                      {task.category && (
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          {task.category}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="text-xs text-gray-500">
                          {format(new Date(task.due_date), "dd/MM/yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {getFutureTasks().length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhuma tarefa futura
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}

