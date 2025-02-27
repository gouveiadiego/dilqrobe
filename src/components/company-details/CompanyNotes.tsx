
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

interface Note {
  id: string;
  company_id: string;
  content: string;
  updated_at: string;
}

interface CompanyNotesProps {
  companyId: string;
}

export function CompanyNotes({ companyId }: CompanyNotesProps) {
  const [content, setContent] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: note, isLoading } = useQuery({
    queryKey: ['company-note', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_notes')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao carregar anotações:', error);
        return null;
      }
      
      return data as Note | null;
    }
  });

  useEffect(() => {
    if (note) {
      setContent(note.content);
      setNoteId(note.id);
    }
  }, [note]);

  const saveNoteMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      if (noteId) {
        // Update existing note
        const { error } = await supabase
          .from('project_notes')
          .update({ content })
          .eq('id', noteId);

        if (error) throw error;
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('project_notes')
          .insert([{
            company_id: companyId,
            content,
            user_id: user.id
          }])
          .select()
          .single();

        if (error) throw error;
        setNoteId(data.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-note', companyId] });
      toast.success('Anotações salvas com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao salvar anotações');
      console.error(error);
    }
  });

  const handleSave = () => {
    saveNoteMutation.mutate();
  };

  if (isLoading) return <div>Carregando anotações...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Anotações do Projeto</h3>
      
      <Textarea 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Adicione aqui suas anotações, links, observações ou qualquer informação relevante para este projeto..."
        className="min-h-[200px]"
      />
      
      <Button onClick={handleSave} disabled={saveNoteMutation.isPending}>
        <Save className="h-4 w-4 mr-2" />
        {saveNoteMutation.isPending ? 'Salvando...' : 'Salvar Anotações'}
      </Button>
    </div>
  );
}
