
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { SubTask, Task, TaskUpdate } from "@/types/task";
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
  onUpdateTask?: (taskId: string, updates: TaskUpdate) => void;
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
  const [editCategory, setEditCategory] = useState(task.category || "none");
  
  const priorityClass = {
    high: "text-red-500 bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm",
    medium: "text-yellow-600 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-sm",
    low: "text-green-600 bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm",
  }[task.priority];

  const priorityLabel = {
    high: "Alta",
    medium: "Média",
    low: "Baixa",
  }[task.priority];

  const completedClass = task.completed ? "opacity-75" : "";

  const handleAddSubtask = () => {
    if (!newSubtask.trim() || !onAddSubtask) return;
    onAddSubtask(task.id, newSubtask.trim());
    setNewSubtask("");
  };

  const handleSaveEdit = () => {
    if (!onUpdateTask) return;
    
    const updates: TaskUpdate = {
      title: editTitle,
      due_date: editDate?.toISOString() || null,
      category: editCategory === "none" ? null : editCategory
    };
    
    onUpdateTask(task.id, updates);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditDate(task.due_date ? new Date(task.due_date) : null);
    setEditCategory(task.category || "none");
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
        "futuristic-card group transition-all duration-200",
        completedClass,
        "hover:bg-white/80 backdrop-blur-sm"
      )}
    >
      <div className="flex items-center gap-4">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id)}
          className="h-5 w-5 border-2 border-gray-300 rounded-full
                   data-[state=checked]:border-dilq-accent data-[state=checked]:bg-dilq-accent
                   transition-colors duration-300"
        />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full focus:ring-dilq-accent focus:border-dilq-accent"
                placeholder="Título da tarefa"
              />
              <div className="flex gap-2 flex-wrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn(
                      "justify-start text-left font-normal",
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
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} className="bg-dilq-accent hover:bg-dilq-accent/90">
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
                    "text-sm font-medium",
                    task.completed ? "line-through text-gray-400" : "text-gray-800"
                  )}
                >
                  {task.title}
                </p>
                {task.subtasks.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-dilq-accent hover:text-dilq-accent/80 hover:bg-dilq-accent/10"
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
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full border backdrop-blur-sm", 
                  priorityClass
                )}>
                  {priorityLabel}
                </span>
                {task.category && (
                  <span className="text-xs px-2 py-0.5 rounded-full border text-dilq-accent bg-dilq-accent/10 border-dilq-accent/20 flex items-center gap-1 backdrop-blur-sm">
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
              className="h-8 w-8 text-gray-400 hover:text-dilq-accent hover:bg-dilq-accent/10 rounded-full"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(task.id)}
            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Subtasks section */}
      {isExpanded && (
        <div className="mt-4 pl-9 space-y-2 pt-3 border-t border-dashed border-gray-100">
          {task.subtasks.map((subtask: SubTask) => (
            <div key={subtask.id} className="flex items-center gap-2 group">
              <Checkbox
                checked={subtask.completed}
                onCheckedChange={() => onToggleSubtask?.(task.id, subtask.id)}
                className="h-4 w-4 border-2 border-gray-300 rounded-full
                        data-[state=checked]:border-dilq-accent data-[state=checked]:bg-dilq-accent"
              />
              <span className={cn(
                "text-sm transition-all duration-300",
                subtask.completed ? "line-through text-gray-400" : "text-gray-700"
              )}>
                {subtask.title}
              </span>
            </div>
          ))}
          <div className="flex gap-2 mt-3">
            <Input
              placeholder="Nova sub-tarefa..."
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              className="h-8 text-sm focus:ring-dilq-accent focus:border-dilq-accent"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddSubtask}
              className="h-8 px-3 text-dilq-accent border-dilq-accent/20 hover:bg-dilq-accent/10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
