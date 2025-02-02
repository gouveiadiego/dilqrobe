import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Task } from "@/types/task";

interface AddTaskProps {
  onAdd: (task: Omit<Task, "id" | "completed">) => void;
}

export function AddTask({ onAdd }: AddTaskProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAdd({
      title: title.trim(),
      priority,
      dueDate: null, // Simplified by removing due date for faster task creation
    });

    setTitle("");
    setPriority("medium");
    setOpen(false);
  };

  // Quick add function - adds task with default medium priority
  const handleQuickAdd = () => {
    if (!title.trim()) return;
    
    onAdd({
      title: title.trim(),
      priority: "medium",
      dueDate: null,
    });

    setTitle("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Digite sua tarefa aqui..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleQuickAdd();
                }
              }}
            />
            <Button 
              type="button" 
              onClick={handleQuickAdd}
              className="whitespace-nowrap"
            >
              Adicionar Rápido
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <Select value={priority} onValueChange={(v: Task["priority"]) => setPriority(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
            
            <Button type="submit" className="flex-1">
              Adicionar Tarefa
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}