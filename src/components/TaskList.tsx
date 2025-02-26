
import { Task } from "@/types/task";
import { TaskItem } from "@/components/TaskItem";
import { isThisWeek, isThisMonth, parseISO, isToday, isTomorrow } from "date-fns";
import { ScrollArea } from "./ui/scroll-area";

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
    <div className="space-y-8">
      {/* Seções do topo: Fazer Hoje e Amanhã */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Fazer Hoje</h3>
          <ScrollArea className="h-[400px]">
            <div className="pr-4 space-y-4">
              {todayTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Nenhuma tarefa para hoje
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

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Amanhã</h3>
          <ScrollArea className="h-[400px]">
            <div className="pr-4 space-y-4">
              {tomorrowTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Nenhuma tarefa para amanhã
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

      {/* Seção inferior: Tarefas Ativas */}
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Tarefas Ativas</h3>
        <ScrollArea className="h-[400px]">
          <div className="pr-4 space-y-4">
            {activeTasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Nenhuma tarefa ativa encontrada
              </div>
            ) : (
              activeTasks.map((task) => (
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

      {/* Seção de tarefas concluídas */}
      {(groupedCompletedTasks.thisWeek.length > 0 || 
        groupedCompletedTasks.thisMonth.length > 0 || 
        groupedCompletedTasks.older.length > 0) && (
        <div className="space-y-6 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Tarefas Concluídas</h3>
          
          {groupedCompletedTasks.thisWeek.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowThisWeek(!showThisWeek)}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                {showThisWeek ? '▼' : '▶'} Esta Semana ({groupedCompletedTasks.thisWeek.length})
              </button>
              {showThisWeek && (
                <div className="space-y-2 pl-4">
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
            <div className="space-y-2">
              <button
                onClick={() => setShowThisMonth(!showThisMonth)}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                {showThisMonth ? '▼' : '▶'} Este Mês ({groupedCompletedTasks.thisMonth.length})
              </button>
              {showThisMonth && (
                <div className="space-y-2 pl-4">
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
            <div className="space-y-2">
              <button
                onClick={() => setShowOlder(!showOlder)}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                {showOlder ? '▼' : '▶'} Mais Antigas ({groupedCompletedTasks.older.length})
              </button>
              {showOlder && (
                <div className="space-y-2 pl-4">
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

