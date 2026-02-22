
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

  const groupActiveTasksByDate = (tasks: Task[]) => {
    const activeTasks = tasks.filter(task => !task.completed);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdue: Task[] = [];
    const doToday: Task[] = [];
    const doTomorrow: Task[] = [];
    const upcoming: Task[] = [];
    const noDate: Task[] = [];

    activeTasks.forEach(task => {
      if (!task.due_date) {
        noDate.push(task);
        return;
      }

      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);

      if (isToday(dueDate)) {
        doToday.push(task);
      } else if (isTomorrow(dueDate)) {
        doTomorrow.push(task);
      } else if (dueDate < today) {
        overdue.push(task);
      } else {
        upcoming.push(task);
      }
    });

    // Sort upcoming by closest date
    upcoming.sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

    return { overdue, doToday, doTomorrow, upcoming, noDate, total: activeTasks.length };
  };

  const groupedCompletedTasks = groupTasksByPeriod(tasks);
  const activeGroups = groupActiveTasksByDate(tasks);

  const renderTaskSection = (
    title: string,
    tasks: Task[],
    icon: React.ReactNode,
    colorClass: string,
    emptyMessage: string,
    emptyIcon: React.ReactNode
  ) => {
    if (tasks.length === 0 && title !== "Fazer Hoje") return null;

    return (
      <div className={`rounded-xl border border-gray-100 overflow-hidden mb-8 transition-all hover:shadow-md bg-white`}>
        <div className={`p-4 border-b border-gray-100 flex items-center justify-between ${colorClass}`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center shadow-sm p-2 rounded-lg bg-white/50 backdrop-blur-sm">
              {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>
          <span className="text-sm font-medium px-3 py-1 bg-white/60 rounded-full text-gray-700 shadow-sm border border-white/40">
            {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}
          </span>
        </div>

        <div className="p-4 sm:p-6 bg-white">
          {tasks.length === 0 ? (
            <div className="text-center py-10 rounded-xl border border-dashed border-gray-200 bg-gray-50/50">
              <div className="flex justify-center mb-3 text-gray-400 opacity-80">{emptyIcon}</div>
              <p className="text-gray-500 font-medium">{emptyMessage}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {tasks.map((task) => (
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
      </div>
    );
  };

  return (
    <div className="space-y-2">

      {activeGroups.total === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-green-200 bg-green-50/50 my-8">
          <div className="w-20 h-20 rounded-full bg-green-100 mx-auto flex items-center justify-center mb-6 shadow-sm">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Tudo limpo!</h2>
          <p className="text-gray-600 text-lg">Você não tem mais tarefas ativas pendentes. Aproveite!</p>
        </div>
      ) : (
        <div className="animate-fade-in pb-4">
          {renderTaskSection(
            "Atrasadas",
            activeGroups.overdue,
            <AlertTriangle className="h-5 w-5 text-red-600" />,
            "bg-red-50/80 border-l-4 border-l-red-500",
            "Nenhuma tarefa atrasada. Ótimo trabalho!",
            <CheckCircle2 className="h-10 w-10" />
          )}

          {renderTaskSection(
            "Fazer Hoje",
            activeGroups.doToday,
            <Rocket className="h-5 w-5 text-purple-600" />,
            "bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-l-purple-500",
            "Nenhuma tarefa para hoje. Relaxe ou puxe algo do backlog!",
            <Sparkles className="h-10 w-10" />
          )}

          {renderTaskSection(
            "Amanhã",
            activeGroups.doTomorrow,
            <Clock className="h-5 w-5 text-blue-600" />,
            "bg-blue-50/60 border-l-4 border-l-blue-400",
            "Nada agendado para amanhã.",
            <Target className="h-10 w-10" />
          )}

          {renderTaskSection(
            "Próximos Dias",
            activeGroups.upcoming,
            <Calendar className="h-5 w-5 text-teal-600" />,
            "bg-teal-50/50 border-l-4 border-l-teal-400",
            "Nenhuma tarefa futura.",
            <Calendar className="h-10 w-10" />
          )}

          {renderTaskSection(
            "Sem Data / Caixa de Entrada",
            activeGroups.noDate,
            <Target className="h-5 w-5 text-gray-600" />,
            "bg-gray-50 border-l-4 border-l-gray-400",
            "Sua caixa de entrada está vazia.",
            <CheckCircle2 className="h-10 w-10" />
          )}
        </div>
      )}

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
