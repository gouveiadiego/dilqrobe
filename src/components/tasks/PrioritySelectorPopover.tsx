
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Task } from "@/types/task";

interface PrioritySelectorPopoverProps {
  priority: Task["priority"];
  onSelect: (priority: Task["priority"]) => void;
}

const getPriorityColor = (p: Task["priority"]) => {
  switch (p) {
    case "high": return "text-red-400 hover:text-red-500";
    case "medium": return "text-yellow-400 hover:text-yellow-500";
    case "low": return "text-green-400 hover:text-green-500";
    default: return "";
  }
};

export function PrioritySelectorPopover({ priority, onSelect }: PrioritySelectorPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={`h-8 w-8 ${getPriorityColor(priority)}`}>
          <Flag className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2">
        <div className="flex flex-col gap-1">
          <Button variant="ghost" className="justify-start text-red-400 hover:text-red-500" onClick={() => onSelect("high")}>
            <Flag className="h-4 w-4 mr-2" />
            Alta
          </Button>
          <Button variant="ghost" className="justify-start text-yellow-400 hover:text-yellow-500" onClick={() => onSelect("medium")}>
            <Flag className="h-4 w-4 mr-2" />
            Média
          </Button>
          <Button variant="ghost" className="justify-start text-green-400 hover:text-green-500" onClick={() => onSelect("low")}>
            <Flag className="h-4 w-4 mr-2" />
            Baixa
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
