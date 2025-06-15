
import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import React from "react";

interface SectionSelectorPopoverProps {
  sections: { value: string; label: string }[];
  selectedSection: string;
  onSelect: (section: string) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function SectionSelectorPopover({
  sections,
  selectedSection,
  onSelect,
  isOpen,
  onOpenChange,
}: SectionSelectorPopoverProps) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={`h-8 w-8 ${selectedSection !== 'inbox' ? 'text-purple-400 hover:text-purple-500' : 'text-gray-400 hover:text-gray-500'}`}>
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-2">
        <div className="flex flex-col gap-1">
          {sections.map(sec => (
            <Button key={sec.value} variant="ghost" className={`justify-start ${selectedSection === sec.value ? 'text-purple-400' : ''}`} onClick={() => onSelect(sec.value)}>
              {sec.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
