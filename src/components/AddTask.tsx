import { Input } from "@/components/ui/input";
import { Task } from "@/types/task";
import { useState } from "react";
import { CalendarIcon, Flag, Tag } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { ptBR } from "date-fns/locale";
import { Checkbox } from "./ui/checkbox";

interface AddTaskProps {
  onAdd: (task: Omit<Task, "id" | "completed" | "user_id" | "subtasks">) => void;
  categories: {
    id: string;
    name: string;
  }[];
  sections: {
    value: string;
    label: string;
  }[];
}

export function AddTask({
  onAdd,
  categories,
  sections
}: AddTaskProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [date, setDate] = useState<Date | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [section, setSection] = useState("inbox");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceCount, setRecurrenceCount] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(false);

  const handleQuickAdd = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      priority,
      due_date: date ? date.toISOString() : new Date().toISOString(),
      category,
      section,
      is_recurring: isRecurring,
      recurrence_count: recurrenceCount,
      recurrence_completed: 0
    });
    setTitle("");
    setDate(null);
    setPriority("medium");
    setCategory(null);
    setSection("inbox");
    setIsRecurring(false);
    setRecurrenceCount(null);
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setIsOpen(false);
  };

  const handleSectionSelect = (selectedSection: string) => {
    setSection(selectedSection);
    setIsSectionOpen(false);
  };

  const getPriorityColor = (p: Task["priority"]) => {
    switch (p) {
      case "high":
        return "text-red-400 hover:text-red-500";
      case "medium":
        return "text-yellow-400 hover:text-yellow-500";
      case "low":
        return "text-green-400 hover:text-green-500";
      default:
        return "";
    }
  };

  return <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Input 
            placeholder="Digite sua tarefa e pressione Enter..." 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            className="w-full bg-white border-gray-200 text-gray-900 placeholder:text-gray-500 pr-36 focus:ring-purple-200" 
            onKeyDown={e => {
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
                <Button variant="ghost" size="icon" className={`h-8 w-8 ${category ? 'text-purple-400 hover:text-purple-500' : 'text-gray-400 hover:text-gray-500'}`}>
                  <Tag className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-2">
                <div className="flex flex-col gap-1">
                  {categories.map(cat => <Button key={cat.id} variant="ghost" className={`justify-start ${category === cat.name ? 'text-purple-400' : ''}`} onClick={() => handleCategorySelect(cat.name)}>
                      <Tag className="h-4 w-4 mr-2" />
                      {cat.name}
                    </Button>)}
                  {categories.length === 0 && <span className="text-sm text-gray-400 p-2">
                      Nenhuma categoria criada
                    </span>}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className={`h-8 w-8 ${getPriorityColor(priority)}`}>
                  <Flag className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-2">
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" className="justify-start text-red-400 hover:text-red-500" onClick={() => setPriority("high")}>
                    <Flag className="h-4 w-4 mr-2" />
                    Alta
                  </Button>
                  <Button variant="ghost" className="justify-start text-yellow-400 hover:text-yellow-500" onClick={() => setPriority("medium")}>
                    <Flag className="h-4 w-4 mr-2" />
                    Média
                  </Button>
                  <Button variant="ghost" className="justify-start text-green-400 hover:text-green-500" onClick={() => setPriority("low")}>
                    <Flag className="h-4 w-4 mr-2" />
                    Baixa
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className={`h-8 w-8 ${date ? 'text-purple-400 hover:text-purple-500' : 'text-gray-400 hover:text-gray-500'}`}>
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR} initialFocus />
              </PopoverContent>
            </Popover>

            <Popover open={isSectionOpen} onOpenChange={setIsSectionOpen}>
              <PopoverTrigger asChild>
                
              </PopoverTrigger>
              <PopoverContent className="w-40 p-2">
                <div className="flex flex-col gap-1">
                  {sections.map(sec => <Button key={sec.value} variant="ghost" className={`justify-start ${section === sec.value ? 'text-purple-400' : ''}`} onClick={() => handleSectionSelect(sec.value)}>
                      {sec.label}
                    </Button>)}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isRecurring"
            checked={isRecurring}
            onCheckedChange={(checked) => {
              setIsRecurring(checked as boolean);
              if (!checked) setRecurrenceCount(null);
            }}
          />
          <label htmlFor="isRecurring" className="text-sm text-gray-700">
            Tarefa recorrente
          </label>
        </div>

        {isRecurring && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              placeholder="Número de repetições"
              value={recurrenceCount === null ? '' : recurrenceCount}
              onChange={(e) => setRecurrenceCount(e.target.value ? Number(e.target.value) : null)}
              className="w-40"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRecurrenceCount(null)}
              className={recurrenceCount === null ? 'bg-purple-100 text-purple-700' : ''}
            >
              ∞ Infinito
            </Button>
          </div>
        )}
      </div>
    </div>;
}
