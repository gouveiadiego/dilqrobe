
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import React from "react";

const PROJECT_CATEGORIES = ["Geral", "Conteúdo", "SEO", "Desenvolvimento"];

interface ProjectCategorySelectorPopoverProps {
  selectedProjectCategory: string | null;
  onSelect: (category: string) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ProjectCategorySelectorPopover({
  selectedProjectCategory,
  onSelect,
  isOpen,
  onOpenChange,
}: ProjectCategorySelectorPopoverProps) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={`h-8 w-8 ${selectedProjectCategory ? 'text-purple-400 hover:text-purple-500' : 'text-gray-400 hover:text-gray-500'}`}>
          <Briefcase className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="flex flex-col gap-1">
          {PROJECT_CATEGORIES.map((pCat) => (
            <Button key={pCat} variant="ghost" className={`justify-start ${selectedProjectCategory === pCat ? 'text-purple-400' : ''}`} onClick={() => onSelect(pCat)}>
              <Briefcase className="h-4 w-4 mr-2" />
              {pCat}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
