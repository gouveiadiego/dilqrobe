import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, FileText } from "lucide-react";
import { Budget } from "./types";
import { BudgetCard } from "./BudgetCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BudgetListProps {
  budgets: Budget[];
  isLoading: boolean;
  onView: (budget: Budget) => void;
  onDuplicate: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
  onDownloadPDF: (budget: Budget) => void;
}

export function BudgetList({
  budgets,
  isLoading,
  onView,
  onDuplicate,
  onDelete,
  onDownloadPDF
}: BudgetListProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "value" | "name">("date");

  const filteredBudgets = budgets
    .filter(budget => 
      budget.client_name.toLowerCase().includes(search.toLowerCase()) ||
      budget.client_email?.toLowerCase().includes(search.toLowerCase()) ||
      budget.company_name?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "value":
          return b.total_amount - a.total_amount;
        case "name":
          return a.client_name.localeCompare(b.client_name);
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, email ou empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value: "date" | "value" | "name") => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Data (mais recente)</SelectItem>
              <SelectItem value="value">Valor (maior)</SelectItem>
              <SelectItem value="name">Nome (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Budget list */}
      {filteredBudgets.length > 0 ? (
        <div className="grid gap-4">
          {filteredBudgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onView={onView}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onDownloadPDF={onDownloadPDF}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          {search ? (
            <>
              <p className="text-lg font-medium">Nenhum orçamento encontrado</p>
              <p className="text-muted-foreground">Tente buscar com outros termos</p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium">Nenhum orçamento criado</p>
              <p className="text-muted-foreground">Crie seu primeiro orçamento clicando no botão acima</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
