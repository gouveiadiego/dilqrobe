import { Input } from "@/components/ui/input";
import { Task } from "@/types/task";
import { useState } from "react";
import { CalendarIcon, Flag, Tag } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { ptBR } from "date-fns/locale";

interface AddTaskProps {
  onAdd: (task: Omit<Task, "id" | "completed">) => void;
  categories: string[];
}

export function AddTask({ onAdd, categories }: AddTaskProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [date, setDate] = useState<Date | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleQuickAdd = () => {
    if (!title.trim()) return;
    
    onAdd({
      title: title.trim(),
      priority,
      dueDate: date ? date.toISOString() : null,
      category,
    });

    setTitle("");
    setDate(null);
    setPriority("medium");
    setCategory(null);
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setIsOpen(false);
  };

  const getPriorityColor = (p: Task["priority"]) => {
    switch (p) {
      case "high": return "text-red-400";
      case "medium": return "text-yellow-400";
      case "low": return "text-green-400";
      default: return "";
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <div className="relative flex-1">
        <Input
          placeholder="Digite sua tarefa e pressione Enter..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[#2A2F3C] border-none text-white placeholder:text-gray-400 pr-28"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleQuickAdd();
            }
          }}
          autoFocus
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className={`h-8 w-8 ${category ? 'text-purple-400' : 'text-gray-400'}`}
              >
                <Tag className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2">
              <div className="flex flex-col gap-1">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant="ghost"
                    className={`justify-start ${category === cat ? 'text-purple-400' : ''}`}
                    onClick={() => handleCategorySelect(cat)}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    {cat}
                  </Button>
                ))}
                {categories.length === 0 && (
                  <span className="text-sm text-gray-400 p-2">
                    Nenhuma categoria criada
                  </span>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className={`h-8 w-8 ${getPriorityColor(priority)}`}
              >
                <Flag className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2">
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  className="justify-start text-red-400"
                  onClick={() => setPriority("high")}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Alta
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-yellow-400"
                  onClick={() => setPriority("medium")}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Média
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start text-green-400"
                  onClick={() => setPriority("low")}
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Baixa
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className={`h-8 w-8 ${date ? 'text-purple-400' : 'text-gray-400'}`}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}