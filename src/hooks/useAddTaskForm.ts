
import { useState } from "react";
import { Task } from "@/types/task";
import { useProjectCompanies } from "@/hooks/useProjectCompanies";

interface UseAddTaskFormProps {
  onAdd: (task: Omit<Task, "id" | "completed" | "user_id" | "subtasks"> & { projectCategory?: string }) => void;
}

export function useAddTaskForm({ onAdd }: UseAddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [date, setDate] = useState<Date | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [projectCategory, setProjectCategory] = useState<string | null>(null);
  const [section, setSection] = useState("inbox");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceCount, setRecurrenceCount] = useState<number | null>(null);
  const [recurrenceType, setRecurrenceType] = useState<Task["recurrence_type"]>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isProjectCategoryOpen, setIsProjectCategoryOpen] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(false);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);

  const { companies, isLoading: companiesLoading } = useProjectCompanies();

  const handleQuickAdd = () => {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      priority,
      due_date: date ? date.toISOString() : null,
      category,
      section,
      is_recurring: isRecurring,
      recurrence_count: recurrenceCount,
      recurrence_completed: 0,
      recurrence_type: isRecurring ? recurrenceType : null,
      project_company_id: selectedCompanyId,
      projectCategory,
    });
    setTitle("");
    setDate(null);
    setPriority("medium");
    setCategory(null);
    setSection("inbox");
    setIsRecurring(false);
    setRecurrenceCount(null);
    setRecurrenceType(null);
    setSelectedCompanyId(null);
    setProjectCategory(null);
  };
  
  const handleCategorySelect = (selectedCategoryId: string) => {
    setCategory(selectedCategoryId);
    setIsCategoryOpen(false);
  };

  const handleProjectCategorySelect = (selectedProjectCategory: string) => {
    setProjectCategory(selectedProjectCategory);
    setIsProjectCategoryOpen(false);
  };

  const handleSectionSelect = (selectedSection: string) => {
    setSection(selectedSection);
    setIsSectionOpen(false);
  };

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
    if (companyId) {
      setCategory(null); // Clear personal category
    } else {
      setProjectCategory(null); // Clear project category
    }
    setIsCompanyOpen(false);
  };
  
  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  return {
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
    selectedCompany
    // Note: projectCategories will be provided by parent, see AddTask below
  };
}
