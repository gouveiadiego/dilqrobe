
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Calendar as CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MeetingFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const MeetingFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedDate,
  onDateSelect,
  onClearFilters,
  hasActiveFilters
}: MeetingFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
      <div className="relative flex-1 w-full max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar reuniões..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 border-gray-200 focus:border-[#9b87f5] focus:ring-[#9b87f5]/20"
        />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[160px] border-gray-200 focus:border-[#9b87f5] focus:ring-[#9b87f5]/20">
            <Filter className="h-4 w-4 mr-2 text-gray-500" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="scheduled">Agendadas</SelectItem>
            <SelectItem value="completed">Concluídas</SelectItem>
            <SelectItem value="canceled">Canceladas</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="text-[#9b87f5] hover:text-[#7E69AB] hover:bg-[#9b87f5]/10"
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {selectedDate && (
        <div className="mt-3 p-2 bg-[#9b87f5]/10 rounded-md flex justify-between items-center w-full">
          <div className="text-sm flex items-center">
            <CalendarIcon className="h-4 w-4 mr-1 text-[#9b87f5]" />
            <span>Filtrando por data: <strong>{selectedDate.toLocaleDateString()}</strong></span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDateSelect(null)}
            className="text-xs h-7 px-2 text-[#9b87f5] hover:text-[#7E69AB] hover:bg-[#9b87f5]/10"
          >
            Remover filtro
          </Button>
        </div>
      )}
    </div>
  );
};
