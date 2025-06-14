import { useState, useMemo } from "react";
import { Task } from "@/types/task";
import { format, isAfter, isBefore, isToday, isTomorrow, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Trash2, Edit, ChevronDown, ChevronUp, Clock, CalendarIcon, Tag, Flag, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { TaskTimer } from "./TaskTimer";
import { TaskComments } from "./TaskComments";
import { TaskAttachments } from "./TaskAttachments";

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, updates: any) => void;
  categories: { id: string; name: string }[];
  showThisWeek: boolean;
  setShowThisWeek: (show: boolean) => void;
  showThisMonth: boolean;
  setShowThisMonth: (show: boolean) => void;
  showOlder: boolean;
  setShowOlder: (show: boolean) => void;
  onAddSubtask: (taskId: string, subtaskTitle: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
}

export function TaskList({
  tasks,
  onToggleTask,
  onDeleteTask,
  onUpdateTask,
  categories,
  showThisWeek,
  setShowThisWeek,
  showThisMonth,
  setShowThisMonth,
  showOlder,
  setShowOlder,
  onAddSubtask,
  onToggleSubtask
}: TaskListProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState<Task["priority"]>("medium");
  const [editDueDate, setEditDueDate] = useState<Date | null>(null);
  const [editCategory, setEditCategory] = useState<string | null>(null);
  const [editSection, setEditSection] = useState<string>("inbox");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<string>("");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const sections = useMemo(() => [
    { value: "inbox", label: "Caixa de entrada" },
    { value: "monday", label: "Segunda-feira" },
    { value: "tuesday", label: "Terça-feira" },
    { value: "wednesday", label: "Quarta-feira" },
    { value: "thursday", label: "Quinta-feira" },
    { value: "friday", label: "Sexta-feira" },
    { value: "weekend", label: "Fim de semana" }
  ], []);

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditDueDate(task.due_date ? new Date(task.due_date) : null);
    setEditCategory(task.category);
    setEditSection(task.section || "inbox");
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
  };

  const saveEdit = (id: string) => {
    onUpdateTask(id, {
      title: editTitle,
      priority: editPriority,
      due_date: editDueDate ? editDueDate.toISOString() : null,
      category: editCategory,
      section: editSection
    });
    setEditingTaskId(null);
  };

  const handleAddSubtask = (taskId: string) => {
    if (newSubtaskTitle.trim()) {
      onAddSubtask(taskId, newSubtaskTitle.trim());
      setNewSubtaskTitle("");
    }
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
  };

  const todayTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      return isToday(new Date(task.due_date));
    });
  }, [tasks]);

  const tomorrowTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      return isTomorrow(new Date(task.due_date));
    });
  }, [tasks]);

  const thisWeekTasks = useMemo(() => {
    if (!showThisWeek) return [];
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    return tasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      return !isToday(dueDate) && 
             !isTomorrow(dueDate) && 
             isAfter(dueDate, weekStart) && 
             isBefore(dueDate, weekEnd);
    });
  }, [tasks, showThisWeek]);

  const thisMonthTasks = useMemo(() => {
    if (!showThisMonth) return [];
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    return tasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      return isAfter(dueDate, weekEnd) && 
             isAfter(dueDate, monthStart) && 
             isBefore(dueDate, monthEnd);
    });
  }, [tasks, showThisMonth]);

  const olderTasks = useMemo(() => {
    if (!showOlder) return [];
    const now = new Date();
    
    return tasks.filter(task => {
      if (!task.due_date) return true; // Tasks without due date are considered "older"
      const dueDate = new Date(task.due_date);
      return isBefore(dueDate, now) && !isToday(dueDate);
    });
  }, [tasks, showOlder]);

  const noDateTasks = useMemo(() => {
    return tasks.filter(task => !task.due_date);
  }, [tasks]);

  const renderTaskItem = (task: Task) => {
    const isEditing = editingTaskId === task.id;
    const isExpanded = expandedTaskId === task.id;

    return (
      <div 
        key={task.id} 
        className={cn(
          "bg-white rounded-lg shadow border px-3 py-2 mb-2 transition-all",
          task.completed ? "opacity-60" : "",
          isExpanded ? "shadow-md" : ""
        )}
      >
        {isEditing ? (
          <div className="space-y-3">
            <Input 
              value={editTitle} 
              onChange={e => setEditTitle(e.target.value)} 
              className="w-full"
            />
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Prioridade</label>
                <Select value={editPriority} onValueChange={(value: Task["priority"]) => setEditPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Categoria</label>
                <Select 
                  value={editCategory || ""} 
                  onValueChange={setEditCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem categoria</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Data</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editDueDate ? format(editDueDate, "PPP", { locale: ptBR }) : "Sem data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editDueDate}
                      onSelect={setEditDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Seção</label>
                <Select value={editSection} onValueChange={setEditSection}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(section => (
                      <SelectItem key={section.value} value={section.value}>
                        {section.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={cancelEdit}>Cancelar</Button>
              <Button size="sm" onClick={() => saveEdit(task.id)}>Salvar</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-gray-800">{task.title}</div>
              {/* Cronômetro/timer */}
              <TaskTimer task={task} onUpdate={updates => onUpdateTask(task.id, updates)} />
            </div>

            {/* Tempo estimado */}
            <div className="text-xs text-gray-500">
              {task.estimated_time_minutes ? (
                <span>⏳ {task.estimated_time_minutes} min estimados</span>
              ) : (
                <span className="text-gray-300">Sem tempo estimado</span>
              )}
            </div>
            
            {/* Comentários */}
            <TaskComments task={task} onUpdate={updates => onUpdateTask(task.id, updates)} />

            {/* Anexos */}
            <TaskAttachments task={task} onUpdate={updates => onUpdateTask(task.id, updates)} />

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={task.completed} 
                  onCheckedChange={() => onToggleTask(task.id)}
                  className={cn(
                    task.priority === "high" ? "border-red-400 data-[state=checked]:bg-red-500" :
                    task.priority === "medium" ? "border-yellow-400 data-[state=checked]:bg-yellow-500" :
                    "border-green-400 data-[state=checked]:bg-green-500"
                  )}
                />
                <span className={cn("text-sm", task.completed ? "line-through text-gray-400" : "")}>
                  {task.title}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => toggleExpand(task.id)}>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => startEdit(task)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDeleteTask(task.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {isExpanded && (
              <div className="mt-3 space-y-3 border-t pt-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  {task.due_date && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </Badge>
                  )}
                  
                  {task.category && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {task.category}
                    </Badge>
                  )}
                  
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "flex items-center gap-1",
                      task.priority === "high" ? "border-red-200 bg-red-50 text-red-700" :
                      task.priority === "medium" ? "border-yellow-200 bg-yellow-50 text-yellow-700" :
                      "border-green-200 bg-green-50 text-green-700"
                    )}
                  >
                    <Flag className="h-3 w-3" />
                    {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                  </Badge>
                  
                  {task.section && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <LayoutGrid className="h-3 w-3" />
                      {sections.find(s => s.value === task.section)?.label || task.section}
                    </Badge>
                  )}
                </div>
                
                {/* Subtasks */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Subtarefas</div>
                  
                  {task.subtasks && task.subtasks.length > 0 ? (
                    <div className="space-y-1">
                      {task.subtasks.map(subtask => (
                        <div key={subtask.id} className="flex items-center gap-2">
                          <Checkbox 
                            checked={subtask.completed} 
                            onCheckedChange={() => onToggleSubtask(task.id, subtask.id)}
                          />
                          <span className={cn("text-sm", subtask.completed ? "line-through text-gray-400" : "")}>
                            {subtask.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">Nenhuma subtarefa</div>
                  )}
                  
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Nova subtarefa..." 
                      value={newSubtaskTitle}
                      onChange={e => setNewSubtaskTitle(e.target.value)}
                      className="text-sm"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          handleAddSubtask(task.id);
                        }
                      }}
                    />
                    <Button size="sm" onClick={() => handleAddSubtask(task.id)}>Adicionar</Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="space-y-6">
        {todayTasks.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Hoje</h3>
            <div className="space-y-2">
              {todayTasks.map(renderTaskItem)}
            </div>
          </div>
        )}
        
        {tomorrowTasks.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Amanhã</h3>
            <div className="space-y-2">
              {tomorrowTasks.map(renderTaskItem)}
            </div>
          </div>
        )}
        
        {thisWeekTasks.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 flex items-center justify-between">
              <span>Esta semana</span>
              <Button variant="ghost" size="sm" onClick={() => setShowThisWeek(false)}>Ocultar</Button>
            </h3>
            <div className="space-y-2">
              {thisWeekTasks.map(renderTaskItem)}
            </div>
          </div>
        )}
        
        {!showThisWeek && (
          <Button variant="outline" className="w-full" onClick={() => setShowThisWeek(true)}>
            Mostrar tarefas desta semana
          </Button>
        )}
        
        {thisMonthTasks.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 flex items-center justify-between">
              <span>Este mês</span>
              <Button variant="ghost" size="sm" onClick={() => setShowThisMonth(false)}>Ocultar</Button>
            </h3>
            <div className="space-y-2">
              {thisMonthTasks.map(renderTaskItem)}
            </div>
          </div>
        )}
        
        {!showThisMonth && (
          <Button variant="outline" className="w-full" onClick={() => setShowThisMonth(true)}>
            Mostrar tarefas deste mês
          </Button>
        )}
        
        {olderTasks.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800 flex items-center justify-between">
              <span>Atrasadas</span>
              <Button variant="ghost" size="sm" onClick={() => setShowOlder(false)}>Ocultar</Button>
            </h3>
            <div className="space-y-2">
              {olderTasks.map(renderTaskItem)}
            </div>
          </div>
        )}
        
        {!showOlder && olderTasks.length > 0 && (
          <Button variant="outline" className="w-full" onClick={() => setShowOlder(true)}>
            Mostrar tarefas atrasadas
          </Button>
        )}
        
        {noDateTasks.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Sem data definida</h3>
            <div className="space-y-2">
              {noDateTasks.map(renderTaskItem)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
