
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCategories } from "@/hooks/useCategories";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const { addCategory, deleteCategory } = useCategories();

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
            <div key={pCat.id} className="flex items-center justify-between group">
              <Button 
                variant="ghost" 
                className={`flex-1 justify-start ${selectedProjectCategory === pCat.name ? 'text-purple-400' : ''}`} 
                onClick={() => onSelect(pCat.name)}
              >
                <Briefcase className="h-4 w-4 mr-2" />
                {pCat.name}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir a categoria "{pCat.name}"? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteCategory(pCat.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
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
