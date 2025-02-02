import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import { Trash2 } from "lucide-react";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const priorityClass = {
    high: "priority-high",
    medium: "priority-medium",
    low: "priority-low",
  }[task.priority];

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border bg-white transition-all",
        task.completed && "opacity-60"
      )}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        className="h-5 w-5"
      />
      <div className="flex-1">
        <p
          className={cn(
            "text-sm font-medium",
            task.completed && "line-through text-muted-foreground"
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
            {task.priority}
          </span>
          {task.dueDate && (
            <span className="text-xs text-muted-foreground">
              Due {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="text-muted-foreground hover:text-destructive transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}