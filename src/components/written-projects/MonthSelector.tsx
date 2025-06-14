
import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface MonthSelectorProps {
  month: Date;
  onMonthChange: (d: Date) => void;
  loadingAI: boolean;
  onGenerateIdeas: () => void;
}

export function MonthSelector({ month, onMonthChange, loadingAI, onGenerateIdeas }: MonthSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">Mês:</span>
      <input
        type="month"
        className="border rounded px-2 py-1 text-sm"
        value={format(month, "yyyy-MM")}
        onChange={e => {
          const [yyyy, mm] = e.target.value.split("-");
          onMonthChange(new Date(Number(yyyy), Number(mm) - 1));
        }}
      />
      <Button
        variant="outline"
        size="sm"
        className="ml-auto flex items-center gap-1"
        disabled={loadingAI}
        onClick={onGenerateIdeas}
        title="Gerar ideias de posts para o mês com IA"
      >
        <Sparkles className="w-4 h-4" />
        {loadingAI ? "Gerando..." : "Gerar ideias IA"}
      </Button>
    </div>
  );
}
