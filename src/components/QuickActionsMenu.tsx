
import { Button } from "@/components/ui/button";
import { ListChecks, ArrowRight, CheckSquare, Zap } from "lucide-react";

interface QuickActionsMenuProps {
  onCompleteAll: () => void;
  onPostponeAll: () => void;
  focusMode: boolean;
  onToggleFocus: () => void;
}

export function QuickActionsMenu({
  onCompleteAll,
  onPostponeAll,
  focusMode,
  onToggleFocus,
}: QuickActionsMenuProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4 items-center">
      <Button
        variant="outline"
        onClick={onCompleteAll}
        className="gap-1 text-green-700 border-green-200 hover:bg-green-50"
      >
        <CheckSquare className="h-4 w-4" />
        Marcar todas como concluídas
      </Button>
      <Button
        variant="outline"
        onClick={onPostponeAll}
        className="gap-1 text-blue-700 border-blue-200 hover:bg-blue-50"
      >
        <ArrowRight className="h-4 w-4" />
        Adiar todas para amanhã
      </Button>
      <Button
        variant={focusMode ? "default" : "outline"}
        onClick={onToggleFocus}
        className={focusMode ? "bg-yellow-400 text-yellow-900 hover:bg-yellow-500" : "gap-1 text-yellow-800 border-yellow-200 hover:bg-yellow-50"}
      >
        <Zap className="h-4 w-4" />
        {focusMode ? "Sair do Modo Foco" : "Ativar Modo Foco"}
      </Button>
    </div>
  );
}
