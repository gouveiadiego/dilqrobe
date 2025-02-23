
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
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
  dateFilter,
  setDateFilter,
  sectionFilter,
  setSectionFilter,
  categories,
  sections,
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

        <Select value={filter} onValueChange={(v: typeof filter) => setFilter(v)}>
          <SelectTrigger className="w-[180px] bg-white border-gray-200 hover:border-purple-200">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="completed">Concluídas</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={categoryFilter} 
          onValueChange={(v: string) => setCategoryFilter(v)}
        >
          <SelectTrigger className="w-[180px] bg-white border-gray-200 hover:border-purple-200">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
            ))}
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

        <Select 
          value={sectionFilter} 
          onValueChange={(v: string) => setSectionFilter(v)}
        >
          <SelectTrigger className="w-[180px] bg-white border-gray-200 hover:border-purple-200">
            <SelectValue placeholder="Seção" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((section) => (
              <SelectItem key={section.value} value={section.value}>
                {section.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className={`w-[180px] justify-start text-left font-normal bg-white border-gray-200 hover:border-purple-200 ${
                dateFilter ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {dateFilter ? dateFilter.toLocaleDateString() : "Filtrar por data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={dateFilter}
              onSelect={setDateFilter}
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {dateFilter && (
          <Button 
            variant="ghost" 
            onClick={() => setDateFilter(null)}
            className="px-2 hover:text-purple-500"
          >
            Limpar data
          </Button>
        )}
      </div>
    </div>
  );
}
