
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { SubTask, Task } from "@/types/task";
import { Trash2, Tag, Plus, ChevronDown, ChevronUp, Bell, Pencil, Check, X } from "lucide-react";
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddSubtask?: (taskId: string, subtaskTitle: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  categories: { id: string; name: string; }[];
}

export function TaskItem({ 
  task, 
  onToggle, 
  onDelete, 
  onAddSubtask, 
  onToggleSubtask,
  onUpdateTask,
  categories 
}: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDate, setEditDate] = useState<Date | null>(task.due_date ? new Date(task.due_date) : null);
  const [editCategory, setEditCategory] = useState(task.category || "");
  
  const priorityClass = {
    high: "text-red-400 bg-red-400/10 border-red-400/20",
    medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    low: "text-green-400 bg-green-400/10 border-green-400/20",
  }[task.priority];

  const priorityLabel = {
    high: "Alta",
    medium: "Média",
    low: "Baixa",
  }[task.priority];

  const statusClass = task.completed ? "bg-gray-50" : "bg-white";

  const handleAddSubtask = () => {
    if (!newSubtask.trim() || !onAddSubtask) return;
    onAddSubtask(task.id, newSubtask.trim());
    setNewSubtask("");
  };

  const handleSaveEdit = () => {
    if (!onUpdateTask) return;
    
    onUpdateTask(task.id, {
      title: editTitle,
      due_date: editDate?.toISOString() || null,
      category: editCategory || null
    });
    
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditDate(task.due_date ? new Date(task.due_date) : null);
    setEditCategory(task.category || "");
    setIsEditing(false);
  };

  const getDueStatus = () => {
    if (!task.due_date) return null;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dueDate < today) {
      return "text-red-500";
    } else if (dueDate.toDateString() === today.toDateString()) {
      return "text-orange-500";
    } else if (dueDate.toDateString() === tomorrow.toDateString()) {
      return "text-yellow-500";
    }
    return "text-gray-400";
  };

  return (
    <div
      className={cn(
        "group flex flex-col gap-4 p-4 rounded-lg transition-all duration-200 border border-gray-100",
        statusClass,
        "hover:shadow-lg hover:shadow-purple-500/5"
      )}
    >
      <div className="flex items-center gap-4">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          className="h-5 w-5 border-2 border-gray-300 data-[state=checked]:border-purple-500 data-[state=checked]:bg-purple-500"
        />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full"
                placeholder="Título da tarefa"
              />
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      editDate ? "text-gray-900" : "text-gray-500"
                    )}>
                      <Bell className="mr-2 h-4 w-4" />
                      {editDate ? format(editDate, "PPP", { locale: ptBR }) : "Data de entrega"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editDate}
                      onSelect={setEditDate}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem categoria</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  <Check className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "text-sm font-medium text-gray-900",
                    task.completed && "line-through text-gray-400"
                  )}
                >
                  {task.title}
                </p>
                {task.subtasks.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              <div className="flex gap-2 mt-1 flex-wrap">
                <span className={cn("text-xs px-2 py-0.5 rounded-full border", priorityClass)}>
                  {priorityLabel}
                </span>
                {task.category && (
                  <span className="text-xs px-2 py-0.5 rounded-full border text-purple-400 bg-purple-400/10 border-purple-400/20 flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {task.category}
                  </span>
                )}
                {task.due_date && (
                  <span className={cn("text-xs flex items-center gap-1", getDueStatus())}>
                    <Bell className="h-3 w-3" />
                    {format(new Date(task.due_date), "PPP", { locale: ptBR })}
                  </span>
                )}
                {task.section !== "inbox" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {task.section}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 text-gray-400 hover:text-purple-500"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(task.id)}
            className="h-8 w-8 text-gray-400 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Subtasks section */}
      {isExpanded && (
        <div className="pl-9 space-y-2">
          {task.subtasks.map((subtask: SubTask) => (
            <div key={subtask.id} className="flex items-center gap-2">
              <Checkbox
                checked={subtask.completed}
                onCheckedChange={() => onToggleSubtask?.(task.id, subtask.id)}
                className="h-4 w-4 border-2 border-gray-300 data-[state=checked]:border-purple-500 data-[state=checked]:bg-purple-500"
              />
              <span className={cn(
                "text-sm",
                subtask.completed && "line-through text-gray-400"
              )}>
                {subtask.title}
              </span>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              placeholder="Nova sub-tarefa..."
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAddSubtask}
              className="h-8 px-2"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
