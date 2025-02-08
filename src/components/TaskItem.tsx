
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import { Trash2, Tag } from "lucide-react";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
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

  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-4 rounded-lg transition-all duration-200 border border-gray-100",
        statusClass,
        "hover:shadow-lg hover:shadow-purple-500/5"
      )}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        className="h-5 w-5 border-2 border-gray-300 data-[state=checked]:border-purple-500 data-[state=checked]:bg-purple-500"
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate text-gray-900",
            task.completed && "line-through text-gray-400"
          )}
        >
          {task.title}
        </p>
        <div className="flex gap-2 mt-1">
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full border",
              priorityClass
            )}
          >
            {priorityLabel}
          </span>
          {task.category && (
            <span className="text-xs px-2 py-0.5 rounded-full border text-purple-400 bg-purple-400/10 border-purple-400/20 flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {task.category}
            </span>
          )}
          {task.due_date && (
            <span className="text-xs text-gray-400">
              Vence em {new Date(task.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all duration-200 p-2 rounded-full hover:bg-red-400/10"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
