
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
  categoryFilter,
  setCategoryFilter,
  priorityFilter,
  setPriorityFilter,
}: TaskFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-gray-200 focus:ring-purple-200"
          />
        </div>

        <Select 
          value={categoryFilter} 
          onValueChange={(v: string) => setCategoryFilter(v)}
        >
          <SelectTrigger className="w-[180px] bg-white border-gray-200 hover:border-purple-200">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={priorityFilter} 
          onValueChange={(v: Task["priority"] | "all") => setPriorityFilter(v)}
        >
          <SelectTrigger className="w-[180px] bg-white border-gray-200 hover:border-purple-200">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as prioridades</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
