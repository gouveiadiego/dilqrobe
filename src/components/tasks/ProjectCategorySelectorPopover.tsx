
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCategories } from "@/hooks/useCategories";

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
  projectCompanyId: string | null;
}

export function ProjectCategorySelectorPopover({
  projectCategories,
  selectedProjectCategory,
  onSelect,
  isOpen,
  onOpenChange,
  projectCompanyId,
}: ProjectCategorySelectorPopoverProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const { addCategory } = useCategories();

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      toast.error("O nome da categoria não pode estar em branco.");
      return;
    }
    if (!projectCompanyId) {
      toast.error("Nenhuma empresa selecionada para adicionar a categoria.");
      return;
    }
    addCategory({
      name: newCategoryName.trim(),
      project_company_id: projectCompanyId,
    });
    setNewCategoryName("");
  };

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={`h-8 w-8 ${selectedProjectCategory ? 'text-purple-400 hover:text-purple-500' : 'text-gray-400 hover:text-gray-500'}`}>
          <Briefcase className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2">
        <div className="flex flex-col gap-1">
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
          {projectCategories.length === 0 && (
            <span className="text-sm text-gray-400 p-2 text-center">Nenhuma categoria criada</span>
          )}
        </div>
        <div className="mt-2 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nova categoria..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="h-8"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCategory();
                }
              }}
            />
            <Button size="icon" className="h-8 w-8" onClick={handleAddCategory}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
