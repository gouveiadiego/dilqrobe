import { Input } from "@/components/ui/input";
import { Task } from "@/types/task";
import { useState } from "react";

interface AddTaskProps {
  onAdd: (task: Omit<Task, "id" | "completed">) => void;
}

export function AddTask({ onAdd }: AddTaskProps) {
  const [title, setTitle] = useState("");

  const handleQuickAdd = () => {
    if (!title.trim()) return;
    
    onAdd({
      title: title.trim(),
      priority: "medium", // Default priority
      dueDate: null,
    });

    setTitle("");
  };

  return (
    <div className="relative">
      <Input
        placeholder="Digite sua tarefa e pressione Enter..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-[#2A2F3C] border-none text-white placeholder:text-gray-400"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleQuickAdd();
          }
        }}
        autoFocus
      />
    </div>
  );
}