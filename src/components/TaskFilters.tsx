
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task } from "@/types/task";

interface TaskFiltersProps {
  search: string;
  setSearch: (search: string) => void;
  filter: "all" | "active" | "completed";
  setFilter: (filter: "all" | "active" | "completed") => void;
  categoryFilter: string | "all";
  setCategoryFilter: (category: string | "all") => void;
  priorityFilter: Task["priority"] | "all";
  setPriorityFilter: (priority: Task["priority"] | "all") => void;
  dateFilter: Date | null;
  setDateFilter: (date: Date | null) => void;
  sectionFilter: string;
  setSectionFilter: (section: string) => void;
  categories: { id: string; name: string; }[];
  sections: { value: string; label: string; }[];
}

export function TaskFilters({
  search,
  setSearch,
  filter,
  setFilter,
  categoryFilter,
  setCategoryFilter,
  priorityFilter,
  setPriorityFilter,
  sections,
  sectionFilter,
  setSectionFilter,
  categories,
}: TaskFiltersProps) {
  return (
    <div className="bg-gray-800/10 p-3 rounded-lg shadow-sm border border-gray-100 mb-4">
      <div className="flex gap-2 items-center flex-nowrap">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm bg-white border-gray-200 focus:ring-dilq-accent focus:border-dilq-accent"
          />
        </div>

        <Select 
          value={filter} 
          onValueChange={(v: "all" | "active" | "completed") => setFilter(v)}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm bg-white border-gray-200 hover:border-dilq-accent">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="completed">Concluídos</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={categoryFilter} 
          onValueChange={(v: string) => setCategoryFilter(v)}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm bg-white border-gray-200 hover:border-dilq-accent">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={priorityFilter} 
          onValueChange={(v: Task["priority"] | "all") => setPriorityFilter(v)}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm bg-white border-gray-200 hover:border-dilq-accent">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={sectionFilter} 
          onValueChange={(v: string) => setSectionFilter(v)}
        >
          <SelectTrigger className="w-[130px] h-9 text-sm bg-white border-gray-200 hover:border-dilq-accent">
            <SelectValue placeholder="Seção" />
          </SelectTrigger>
          <SelectContent>
            {sections.map(section => (
              <SelectItem key={section.value} value={section.value}>{section.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
