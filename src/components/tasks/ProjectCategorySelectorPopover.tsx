
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import React from "react";

interface ProjectCategory {
  id: string;
  name: string;
}

interface ProjectCategorySelectorPopoverProps {
  projectCategories: ProjectCategory[];
  selectedProjectCategory: string | null;
  onSelect: (category: string) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function ProjectCategorySelectorPopover({
  projectCategories,
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
          {projectCategories.length === 0 && (
            <span className="text-sm text-gray-400 p-2">Nenhuma categoria criada</span>
          )}
          {projectCategories.map((pCat) => (
            <Button 
              key={pCat.id} 
              variant="ghost" 
              className={`justify-start ${selectedProjectCategory === pCat.id ? 'text-purple-400' : ''}`} 
              onClick={() => onSelect(pCat.id)}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              {pCat.name}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
