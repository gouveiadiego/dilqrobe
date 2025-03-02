
import { Task } from "@/types/task";
import { TaskItem } from "@/components/TaskItem";
import { isThisWeek, isThisMonth, parseISO, isToday, isTomorrow } from "date-fns";
import { ScrollArea } from "./ui/scroll-area";
import { Rocket, Calendar, CheckCircle2, AlertTriangle, Clock, ChevronDown, ChevronUp, Sparkles, Target } from "lucide-react";

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onUpdateTask: (taskId: string, updates: any) => void;
  categories: { id: string; name: string; }[];
  showThisWeek: boolean;
  setShowThisWeek: (show: boolean) => void;
  showThisMonth: boolean;
  setShowThisMonth: (show: boolean) => void;
  showOlder: boolean;
  setShowOlder: (show: boolean) => void;
}

export function TaskList({
  tasks,
  onToggleTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onUpdateTask,
  categories,
  showThisWeek,
  setShowThisWeek,
  showThisMonth,
  setShowThisMonth,
  showOlder,
  setShowOlder,
}: TaskListProps) {
  const groupTasksByPeriod = (tasks: Task[]) => {
    const completedTasks = tasks.filter(task => task.completed);
    
    const thisWeekTasks = completedTasks.filter(task => 
      isThisWeek(parseISO(task.created_at || ''))
    );

    const thisMonthTasks = completedTasks.filter(task => 
      isThisMonth(parseISO(task.created_at || '')) && 
      !isThisWeek(parseISO(task.created_at || ''))
    );

    const olderTasks = completedTasks.filter(task => 
      !isThisMonth(parseISO(task.created_at || ''))
    );

    return {
      thisWeek: thisWeekTasks,
      thisMonth: thisMonthTasks,
      older: olderTasks
    };
  };

  const activeTasks = tasks.filter(task => !task.completed);
  const todayTasks = tasks.filter(task => !task.completed && task.due_date && isToday(new Date(task.due_date)));
  const tomorrowTasks = tasks.filter(task => !task.completed && task.due_date && isTomorrow(new Date(task.due_date)));
  const groupedCompletedTasks = groupTasksByPeriod(tasks);

  return (
    <div className="space-y-10">
      {/* Grade de Seções no Topo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dilq-accent to-dilq-teal flex items-center justify-center shadow-lg">
              <Rocket className="h-5 w-5 text-white animate-float" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-br from-dilq-accent to-dilq-teal bg-clip-text text-transparent">
              Fazer Hoje
            </h3>
          </div>
          <div className="relative overflow-hidden before:absolute before:inset-x-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-dilq-accent/50 before:to-transparent"></div>
          <ScrollArea className="h-[400px] pr-2">
            <div className="space-y-4 pr-4">
              {todayTasks.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
                  <div className="relative">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <Sparkles className="h-5 w-5 absolute top-0 right-1/3 text-dilq-accent animate-pulse-subtle" />
                  </div>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma tarefa para hoje</p>
                  <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Adicione sua primeira tarefa do dia</p>
                </div>
              ) : (
                todayTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={onToggleTask}
                    onDelete={onDeleteTask}
                    onAddSubtask={onAddSubtask}
                    onToggleSubtask={onToggleSubtask}
                    onUpdateTask={onUpdateTask}
                    categories={categories}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dilq-teal to-blue-400 flex items-center justify-center shadow-lg">
              <Clock className="h-5 w-5 text-white animate-pulse-subtle" />
            </div>
            <h3 className="text-xl font-semibold bg-gradient-to-br from-dilq-teal to-blue-400 bg-clip-text text-transparent">
              Amanhã
            </h3>
          </div>
          <div className="relative overflow-hidden before:absolute before:inset-x-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-dilq-teal/50 before:to-transparent"></div>
          <ScrollArea className="h-[400px] pr-2">
            <div className="space-y-4 pr-4">
              {tomorrowTasks.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
                  <div className="relative">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <Target className="h-5 w-5 absolute top-0 right-1/3 text-blue-400 animate-pulse-subtle" />
                  </div>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma tarefa para amanhã</p>
                  <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Planeje seus próximos passos</p>
                </div>
              ) : (
                tomorrowTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={onToggleTask}
                    onDelete={onDeleteTask}
                    onAddSubtask={onAddSubtask}
                    onToggleSubtask={onToggleSubtask}
                    onUpdateTask={onUpdateTask}
                    categories={categories}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Seção de Tarefas Ativas */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
            <AlertTriangle className="h-6 w-6 text-white animate-pulse-subtle" />
          </div>
          <h3 className="text-2xl font-semibold bg-gradient-to-br from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Tarefas Ativas
          </h3>
          <div className="h-1 flex-grow ml-4 bg-gradient-to-r from-blue-500/50 to-purple-500/50 rounded-full"></div>
        </div>
        <div className="relative overflow-hidden before:absolute before:inset-x-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-purple-500/50 before:to-transparent mb-6"></div>
        <ScrollArea className="h-[400px] pr-2">
          <div className="space-y-4 pr-4">
            {activeTasks.length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto flex items-center justify-center mb-4 relative shimmer-effect">
                  <CheckCircle2 className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer dark:via-purple-500/10"></div>
                </div>
                <p className="text-gray-400 dark:text-gray-500">Nenhuma tarefa ativa encontrada</p>
                <p className="text-gray-300 dark:text-gray-600 text-sm mt-1">Todas as suas tarefas foram concluídas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={onToggleTask}
                    onDelete={onDeleteTask}
                    onAddSubtask={onAddSubtask}
                    onToggleSubtask={onToggleSubtask}
                    onUpdateTask={onUpdateTask}
                    categories={categories}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Seção de Tarefas Concluídas */}
      {(groupedCompletedTasks.thisWeek.length > 0 || 
        groupedCompletedTasks.thisMonth.length > 0 || 
        groupedCompletedTasks.older.length > 0) && (
        <div className="space-y-6 pt-8 relative before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-gray-200 dark:before:via-gray-700 before:to-transparent">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="h-6 w-6 text-white animate-pulse-subtle" />
            </div>
            <h3 className="text-2xl font-semibold bg-gradient-to-br from-green-400 to-emerald-600 bg-clip-text text-transparent">
              Tarefas Concluídas
            </h3>
            <div className="h-1 flex-grow ml-4 bg-gradient-to-r from-green-400/50 to-emerald-600/50 rounded-full"></div>
          </div>
          
          {groupedCompletedTasks.thisWeek.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowThisWeek(!showThisWeek)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-dilq-accent dark:hover:text-dilq-accent transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 w-full backdrop-blur-sm"
              >
                {showThisWeek ? (
                  <ChevronDown className="h-4 w-4 text-dilq-accent" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-dilq-accent" />
                )}
                <span>Esta Semana</span>
                <span className="ml-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs">
                  {groupedCompletedTasks.thisWeek.length}
                </span>
              </button>
              {showThisWeek && (
                <div className="space-y-3 pl-6 pt-2 animate-fade-in">
                  {groupedCompletedTasks.thisWeek.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={onToggleTask}
                      onDelete={onDeleteTask}
                      onAddSubtask={onAddSubtask}
                      onToggleSubtask={onToggleSubtask}
                      onUpdateTask={onUpdateTask}
                      categories={categories}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {groupedCompletedTasks.thisMonth.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowThisMonth(!showThisMonth)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-dilq-accent transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 w-full"
              >
                {showThisMonth ? (
                  <ChevronDown className="h-4 w-4 text-dilq-accent" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-dilq-accent" />
                )}
                <span>Este Mês</span>
                <span className="ml-2 bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs">
                  {groupedCompletedTasks.thisMonth.length}
                </span>
              </button>
              {showThisMonth && (
                <div className="space-y-3 pl-6 pt-2">
                  {groupedCompletedTasks.thisMonth.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={onToggleTask}
                      onDelete={onDeleteTask}
                      onAddSubtask={onAddSubtask}
                      onToggleSubtask={onToggleSubtask}
                      onUpdateTask={onUpdateTask}
                      categories={categories}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {groupedCompletedTasks.older.length > 0 && (
            <div className="space-y-3">
              <button
                onClick={() => setShowOlder(!showOlder)}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-dilq-accent transition-colors px-3 py-2 rounded-lg hover:bg-gray-50 w-full"
              >
                {showOlder ? (
                  <ChevronDown className="h-4 w-4 text-dilq-accent" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-dilq-accent" />
                )}
                <span>Mais Antigas</span>
                <span className="ml-2 bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs">
                  {groupedCompletedTasks.older.length}
                </span>
              </button>
              {showOlder && (
                <div className="space-y-3 pl-6 pt-2">
                  {groupedCompletedTasks.older.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={onToggleTask}
                      onDelete={onDeleteTask}
                      onAddSubtask={onAddSubtask}
                      onToggleSubtask={onToggleSubtask}
                      onUpdateTask={onUpdateTask}
                      categories={categories}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
