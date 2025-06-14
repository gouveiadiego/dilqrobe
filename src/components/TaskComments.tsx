
import { useState } from "react";
import { Task, TaskComment, TaskUpdate } from "@/types/task";
import { Button } from "@/components/ui/button";

interface TaskCommentsProps {
  task: Task;
  onUpdate: (updates: TaskUpdate) => void;
}

export function TaskComments({ task, onUpdate }: TaskCommentsProps) {
  const [input, setInput] = useState("");
  const comments = task.comments ?? [];

  function handleAddComment() {
    if (!input.trim()) return;
    const newComment: TaskComment = {
      id: crypto.randomUUID(),
      author: "Você",
      content: input.trim(),
      created_at: new Date().toISOString()
    };
    onUpdate({ comments: [...comments, newComment] });
    setInput("");
  }

  function handleDelete(id: string) {
    onUpdate({ comments: comments.filter(c => c.id !== id) });
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="font-medium text-xs text-gray-700 mb-2">Comentários</div>
      <div className="space-y-1 max-h-36 overflow-y-auto">
        {comments.map(c => (
          <div key={c.id} className="flex justify-between items-center text-xs bg-gray-50 py-1 px-2 rounded border border-gray-100">
            <span>
              <span className="font-semibold">{c.author}:</span> {c.content}
            </span>
            <Button onClick={() => handleDelete(c.id)} size="icon" variant="ghost" className="text-red-400 hover:text-red-600" aria-label="Remover comentário">
              ×
            </Button>
          </div>
        ))}
        {comments.length === 0 && <div className="text-gray-400 text-xs">Nenhum comentário</div>}
      </div>
      <div className="flex gap-2 mt-1">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Novo comentário..."
          className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm"
          onKeyDown={e => { if (e.key === "Enter") handleAddComment(); }}
        />
        <Button size="sm" onClick={handleAddComment}>Enviar</Button>
      </div>
    </div>
  );
}
