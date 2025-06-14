
import { useRef } from "react";
import { Task, TaskAttachment, TaskUpdate } from "@/types/task";
import { Button } from "@/components/ui/button";

interface TaskAttachmentsProps {
  task: Task;
  onUpdate: (updates: TaskUpdate) => void;
}

export function TaskAttachments({ task, onUpdate }: TaskAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const attachments = task.attachments ?? [];

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    // Simplesmente gera um URL de blob para preview local (ideal: usar Supabase Storage!)
    const newAttachment: TaskAttachment = {
      id: crypto.randomUUID(),
      name: file.name,
      url: URL.createObjectURL(file),
      uploaded_at: new Date().toISOString()
    };
    onUpdate({ attachments: [...attachments, newAttachment] });
    event.target.value = "";
  }

  function handleRemove(id: string) {
    onUpdate({ attachments: attachments.filter(a => a.id !== id) });
  }

  return (
    <div className="mt-2">
      <div className="font-medium text-xs text-gray-700 mb-2">Anexos</div>
      <div className="flex gap-2 flex-wrap mb-1">
        {attachments.map(a => (
          <div key={a.id} className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1 text-xs">
            <a href={a.url} target="_blank" rel="noreferrer" className="underline truncate max-w-[120px]">{a.name}</a>
            <Button onClick={() => handleRemove(a.id)} size="icon" variant="ghost" className="text-red-400 hover:text-red-600" aria-label="Remover anexo">
              ×
            </Button>
          </div>
        ))}
        {attachments.length === 0 && <div className="text-gray-400 text-xs">Nenhum arquivo anexado</div>}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleUpload}
        accept="*"
      />
      <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
        Adicionar Anexo
      </Button>
    </div>
  );
}
