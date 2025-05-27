
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
    <div className="space-y-8 bg-white">
      {/* Grade de Seções no Topo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seção Fazer Hoje */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#9b87f5]/10 to-[#33C3F0]/10 p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9b87f5] to-[#33C3F0] flex items-center justify-center shadow-sm">
                <Rocket className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Fazer Hoje</h3>
                <p className="text-xs text-gray-500">{todayTasks.length} tarefas</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <ScrollArea className="h-[350px]">
              <div className="space-y-3">
                {todayTasks.length === 0 ? (
                  <div className="text-center py-8 rounded-lg border border-dashed border-gray-200 bg-gray-50">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-400 text-sm">Nenhuma tarefa para hoje</p>
                    <p className="text-gray-300 text-xs mt-1">Aproveite o seu dia!</p>
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
        </div>

        {/* Seção Amanhã */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Amanhã</h3>
                <p className="text-xs text-gray-500">{tomorrowTasks.length} tarefas</p>
              </div>
            </div>
          </div>
          <div className="p-4">
            <ScrollArea className="h-[350px]">
              <div className="space-y-3">
                {tomorrowTasks.length === 0 ? (
                  <div className="text-center py-8 rounded-lg border border-dashed border-gray-200 bg-gray-50">
                    <Target className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-400 text-sm">Nenhuma tarefa para amanhã</p>
                    <p className="text-gray-300 text-xs mt-1">Planeje seus próximos passos</p>
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
      </div>

      {/* Seção de Tarefas Ativas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-sm">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Tarefas Ativas</h3>
              <p className="text-sm text-gray-500">{activeTasks.length} tarefas pendentes</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {activeTasks.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                  <div className="w-16 h-16 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-gray-700 font-medium">Parabéns! Todas as tarefas foram concluídas!</p>
                  <p className="text-gray-400 text-sm mt-1">Você está em dia com suas atividades</p>
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
      </div>

      {/* Seção de Tarefas Concluídas */}
      {(groupedCompletedTasks.thisWeek.length > 0 || 
        groupedCompletedTasks.thisMonth.length > 0 || 
        groupedCompletedTasks.older.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Tarefas Concluídas</h3>
                <p className="text-sm text-gray-500">Histórico de conquistas</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {groupedCompletedTasks.thisWeek.length > 0 && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowThisWeek(!showThisWeek)}
                  className="flex items-center justify-between w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {showThisWeek ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="font-medium text-gray-900">Esta Semana</span>
                  </div>
                  <span className="bg-green-100 text-green-700 rounded-full px-2 py-1 text-xs font-medium">
                    {groupedCompletedTasks.thisWeek.length}
                  </span>
                </button>
                {showThisWeek && (
                  <div className="space-y-3 pl-6">
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
                  className="flex items-center justify-between w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {showThisMonth ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="font-medium text-gray-900">Este Mês</span>
                  </div>
                  <span className="bg-blue-100 text-blue-700 rounded-full px-2 py-1 text-xs font-medium">
                    {groupedCompletedTasks.thisMonth.length}
                  </span>
                </button>
                {showThisMonth && (
                  <div className="space-y-3 pl-6">
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
                  className="flex items-center justify-between w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {showOlder ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="font-medium text-gray-900">Mais Antigas</span>
                  </div>
                  <span className="bg-gray-200 text-gray-700 rounded-full px-2 py-1 text-xs font-medium">
                    {groupedCompletedTasks.older.length}
                  </span>
                </button>
                {showOlder && (
                  <div className="space-y-3 pl-6">
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
        </div>
      )}
    </div>
  );
}
