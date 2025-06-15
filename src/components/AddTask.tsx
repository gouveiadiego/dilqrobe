import { Input } from "@/components/ui/input";
import { Task } from "@/types/task";
import { Building } from "lucide-react";

import { useAddTaskForm } from "@/hooks/useAddTaskForm";
import { CategorySelectorPopover } from "./tasks/CategorySelectorPopover";
import { PrioritySelectorPopover } from "./tasks/PrioritySelectorPopover";
import { DueDateSelectorPopover } from "./tasks/DueDateSelectorPopover";
import { SectionSelectorPopover } from "./tasks/SectionSelectorPopover";
import { CompanySelectorPopover } from "./tasks/CompanySelectorPopover";
import { ProjectCategorySelectorPopover } from "./tasks/ProjectCategorySelectorPopover";
import { RecurringTaskOptions } from "./tasks/RecurringTaskOptions";

// new import
import { useCategories } from "@/hooks/useCategories";

interface AddTaskProps {
  onAdd: (task: Omit<Task, "id" | "completed" | "user_id" | "subtasks"> & { projectCategory?: string }) => void;
  categories: {
    id: string;
    name: string;
    project_company_id?: string | null;
  }[];
  sections: {
    value: string;
    label: string;
  }[];
}

export function AddTask({
  onAdd,
  // categories prop is not used directly, we fetch from the hook
  sections
}: AddTaskProps) {
  const {
    title, setTitle,
    priority, setPriority,
    date, setDate,
    category, handleCategorySelect,
    projectCategory, handleProjectCategorySelect,
    section, handleSectionSelect,
    isRecurring, setIsRecurring,
    recurrenceCount, setRecurrenceCount,
    recurrenceType, setRecurrenceType,
    selectedCompanyId, handleCompanySelect,
    companies, companiesLoading,
    handleQuickAdd,
    isCategoryOpen, setIsCategoryOpen,
    isProjectCategoryOpen, setIsProjectCategoryOpen,
    isSectionOpen, setIsSectionOpen,
    isCompanyOpen, setIsCompanyOpen,
    selectedCompany,
  } = useAddTaskForm({ onAdd });

  // Categorias do banco
  const { categories: allCategories } = useCategories();

  // Personal Categories: sem type e sem company id
  const personalCategories = allCategories.filter(
    cat => !cat.type && !cat.project_company_id
  );

  // Project Categories: inclui categorias de projeto específicas da empresa selecionada
  // e também categorias 'gerais' de projeto (sem empresa associada).
  const projectCategories = selectedCompanyId
    ? allCategories.filter(
        cat => !cat.type && (cat.project_company_id === selectedCompanyId || cat.project_company_id === null)
      )
    : [];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Input 
            placeholder="Digite sua tarefa e pressione Enter..." 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            className="w-full bg-white border-gray-200 text-gray-900 placeholder:text-gray-500 pr-48 focus:ring-purple-200" 
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleQuickAdd();
              }
            }}
            autoFocus 
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {selectedCompanyId
              ? (
                <ProjectCategorySelectorPopover
                  projectCategories={projectCategories}
                  selectedProjectCategory={projectCategory}
                  onSelect={handleProjectCategorySelect}
                  isOpen={isProjectCategoryOpen}
                  onOpenChange={setIsProjectCategoryOpen}
                  projectCompanyId={selectedCompanyId}
                />
              ) : (
                <CategorySelectorPopover
                  categories={personalCategories}
                  selectedCategory={category}
                  onSelect={handleCategorySelect}
                  isOpen={isCategoryOpen}
                  onOpenChange={setIsCategoryOpen}
                />
              )
            }

            <PrioritySelectorPopover priority={priority} onSelect={setPriority} />

            <DueDateSelectorPopover date={date} onSelect={setDate} />
            
            <SectionSelectorPopover
              sections={sections}
              selectedSection={section}
              onSelect={handleSectionSelect}
              isOpen={isSectionOpen}
              onOpenChange={setIsSectionOpen}
            />

            <CompanySelectorPopover
              companies={companies}
              selectedCompanyId={selectedCompanyId}
              onSelect={handleCompanySelect}
              isLoading={companiesLoading}
              isOpen={isCompanyOpen}
              onOpenChange={setIsCompanyOpen}
            />
          </div>
        </div>
      </div>

      {selectedCompany && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-purple-50 p-2 rounded">
          <Building className="h-4 w-4 text-purple-600" />
          <span>Empresa: <strong>{selectedCompany.name}</strong></span>
        </div>
      )}

      <RecurringTaskOptions
        isRecurring={isRecurring}
        onIsRecurringChange={setIsRecurring}
        recurrenceCount={recurrenceCount}
        onRecurrenceCountChange={setRecurrenceCount}
        recurrenceType={recurrenceType}
        onRecurrenceTypeChange={setRecurrenceType}
      />
    </div>
  );
}
