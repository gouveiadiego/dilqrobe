
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { format } from "date-fns";

interface NewIdeaDialogProps {
  visible: boolean;
  day: Date;
  ideaInput: string;
  setIdeaInput: (s: string) => void;
  onClose: () => void;
  onAdd: () => void;
}

export function NewIdeaDialog({ visible, day, ideaInput, setIdeaInput, onClose, onAdd }: NewIdeaDialogProps) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
          onClick={onClose}
        >
          ×
        </button>
        <h3 className="font-semibold mb-2">
          Nova ideia para {format(day, "dd/MM/yyyy")}
        </h3>
        <Input
          placeholder="Descreva a ideia do post"
          value={ideaInput}
          onChange={e => setIdeaInput(e.target.value)}
          autoFocus
        />
        <Button
          className="mt-4 w-full"
          disabled={!ideaInput.trim()}
          onClick={onAdd}
        >
          <Plus className="w-4 h-4 mr-1" />
          Adicionar ideia
        </Button>
      </div>
    </div>
  );
}
