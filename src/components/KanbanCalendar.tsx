
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
  subMonths,
  getDay,
  isSameMonth,
  isWithinInterval,
  addWeeks
} from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, CalendarIcon, Repeat } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface KanbanCalendarProps {
  tasks: Task[];
  onTaskDrop: (taskId: string, date: Date) => void;
}

// Utility function to generate future recurring task instances
const generateRecurringInstances = (
  task: Task, 
  startMonth: Date, 
  endMonth: Date
): Task[] => {
  if (!task.is_recurring || task.completed || !task.due_date) {
    return [];
  }

  const originalDate = new Date(task.due_date);
  const instances: Task[] = [];
  const maxInstancesPerMonth = 4; // Limit to avoid excessive instances
  
  // Only generate future instances if the task is not completed
  // Check if the task has a limit and if we've reached it
  if (
    task.recurrence_count !== null && 
    task.recurrence_completed !== undefined && 
    task.recurrence_completed >= task.recurrence_count
  ) {
    return [];
  }

  // Generate recurring instances for approximately 3 months ahead
  const maxDate = new Date(endMonth);
  maxDate.setMonth(maxDate.getMonth() + 3);
  
  // Generate a reasonable number of instances
  let instanceDate = new Date(originalDate);
  let count = 0;
  
  while (instanceDate <= maxDate && count < maxInstancesPerMonth) {
    // Skip the original date as it's already in the tasks list
    if (!isEqual(
      new Date(instanceDate.getFullYear(), instanceDate.getMonth(), instanceDate.getDate()),
      new Date(originalDate.getFullYear(), originalDate.getMonth(), originalDate.getDate())
    )) {
      // Create a virtual instance of the recurring task
      instances.push({
        ...task,
        due_date: instanceDate.toISOString(),
        _isRecurringInstance: true, // Mark as a virtual instance
        id: `${task.id}_instance_${count}` // Create a unique ID for the instance
      } as Task);
    }
    
    // Move to next week for the next instance
    instanceDate = addWeeks(instanceDate, 1);
    count++;
  }
  
  return instances;
};

export function KanbanCalendar({
  tasks,
  onTaskDrop
}: KanbanCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

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

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Format month name with first letter capitalized
  const formattedMonth = format(currentMonth, "MMMM 'de' yyyy", { locale: pt })
    .replace(/^\w/, (c) => c.toUpperCase());

  const handleDragStart = (taskId: string) => {
    setDraggingTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (draggingTaskId) {
      // If dragged task is a recurring instance, extract the original task ID
      const originalTaskId = draggingTaskId.includes('_instance_') 
        ? draggingTaskId.split('_instance_')[0] 
        : draggingTaskId;
        
      onTaskDrop(originalTaskId, date);
      setDraggingTaskId(null);
    }
  };

  const getTasksForDay = (date: Date) => {
    const regularTasks = tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      // Compare year, month, and day for more accurate date comparison
      return isEqual(
        new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate()),
        new Date(date.getFullYear(), date.getMonth(), date.getDate())
      );
    });

    // Generate recurring task instances if we're looking at future months
    let recurringInstances: Task[] = [];
    
    // Only generate instances for non-current months
    if (!isSameMonth(date, new Date())) {
      // Get recurring tasks
      const recurringTasks = tasks.filter(task => 
        task.is_recurring && !task.completed && task.due_date
      );
      
      // Generate instances for each recurring task
      recurringTasks.forEach(task => {
        const instances = generateRecurringInstances(
          task, 
          monthStart,
          monthEnd
        );
        
        // Filter instances for this specific day
        const instancesForDay = instances.filter(instance => {
          if (!instance.due_date) return false;
          const instanceDate = new Date(instance.due_date);
          return isEqual(
            new Date(instanceDate.getFullYear(), instanceDate.getMonth(), instanceDate.getDate()),
            new Date(date.getFullYear(), date.getMonth(), date.getDate())
          );
        });
        
        recurringInstances = [...recurringInstances, ...instancesForDay];
      });
    }
    
    // Combine regular tasks and recurring instances
    return [...regularTasks, ...recurringInstances];
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="icon"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline"
                  className="min-w-[200px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formattedMonth}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={currentMonth}
                  onSelect={(date) => {
                    if (date) {
                      setCurrentMonth(date);
                      setCalendarOpen(false);
                    }
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            <Button 
              variant="outline" 
              size="icon"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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
                        {task.is_recurring && (
                          <span className="inline-flex ml-1">
                            <Repeat className="h-3 w-3 text-purple-500" />
                          </span>
                        )}
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
