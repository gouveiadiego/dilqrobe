
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import React from "react";

interface CategorySelectorPopoverProps {
  categories: { id: string; name: string }[];
  selectedCategory: string | null;
  onSelect: (categoryId: string) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CategorySelectorPopover({
  categories,
  selectedCategory,
  onSelect,
  isOpen,
  onOpenChange,
}: CategorySelectorPopoverProps) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={`h-8 w-8 ${selectedCategory ? 'text-purple-400 hover:text-purple-500' : 'text-gray-400 hover:text-gray-500'}`}>
          <Tag className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2">
        <div className="flex flex-col gap-1">
          {categories.map(cat => (
            <Button key={cat.id} variant="ghost" className={`justify-start ${selectedCategory === cat.id ? 'text-purple-400' : ''}`} onClick={() => onSelect(cat.id)}>
              <Tag className="h-4 w-4 mr-2" />
              {cat.name}
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
  );
}
