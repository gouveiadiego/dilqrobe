
import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

type EditorialPost = {
  id: string;
  idea: string;
  status: string;
  post_date: string;
};

interface EditorialIdeasListProps {
  days: Date[];
  calendarPosts: EditorialPost[];
  onAddTask: (post: EditorialPost) => void;
}

export function EditorialIdeasList({ days, calendarPosts, onAddTask }: EditorialIdeasListProps) {
  return (
    <div className="space-y-2">
      {days.map(day => {
        const postsOfDay = calendarPosts.filter(p => format(new Date(p.post_date), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"));
        if (postsOfDay.length === 0) return null;
        return (
          <Card className="p-3 flex gap-3 items-center" key={day.toISOString()}>
            <span className="text-sm font-semibold text-dilq-purple w-24">{format(day, "dd/MM", { locale: ptBR })}</span>
            <div className="flex-1 space-y-1">
              {postsOfDay.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="text-sm">{p.idea}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 ml-2">{p.status}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Transformar em tarefa"
                    onClick={() => onAddTask(p)}
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
