
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
  user_id: string;
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      console.log("Fetching notes for company:", companyId, "and user:", user.id);
      
      const { data, error } = await supabase
        .from('project_notes')
        .select('*')
        .eq('company_id', companyId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao carregar anotações:', error);
        return null;
      }
      
      console.log("Notes data received:", data);
      return data as Note | null;
    },
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (note) {
      console.log("Note loaded:", note);
      setContent(note.content);
      setNoteId(note.id);
    } else {
      console.log("No note found, resetting form");
      // Don't clear content if already editing but no existing note
      if (!content) {
        setContent("");
      }
      setNoteId(null);
    }
  }, [note]);

  const saveNoteMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      console.log("Saving note for company:", companyId);
      console.log("Current content:", content);
      console.log("Note ID:", noteId);

      if (noteId) {
        // Update existing note
        console.log("Updating existing note:", noteId);
        const { data, error } = await supabase
          .from('project_notes')
          .update({ content })
          .eq('id', noteId)
          .select()
          .single();

        if (error) {
          console.error("Error updating note:", error);
          throw error;
        }
        
        console.log("Note updated successfully:", data);
        return data;
      } else {
        // Create new note
        console.log("Creating new note for company:", companyId);
        const { data, error } = await supabase
          .from('project_notes')
          .insert([{
            company_id: companyId,
            content,
            user_id: user.id
          }])
          .select()
          .single();

        if (error) {
          console.error("Error creating note:", error);
          throw error;
        }
        
        console.log("Note created successfully:", data);
        setNoteId(data.id);
        return data;
      }
    },
    onSuccess: (data) => {
      console.log("Mutation successful, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ['company-note', companyId] });
      toast.success('Anotações salvas com sucesso');
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast.error('Erro ao salvar anotações');
    }
  });

  const handleSave = () => {
    if (!content.trim()) {
      toast.error('As anotações não podem estar vazias');
      return;
    }
    
    console.log("Saving note...");
    saveNoteMutation.mutate();
  };

  if (isLoading) return <div className="py-4 text-gray-500">Carregando anotações...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Anotações do Projeto</h3>
      
      <Textarea 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Adicione aqui suas anotações, links, observações ou qualquer informação relevante para este projeto..."
        className="min-h-[200px] resize-none"
      />
      
      <Button 
        onClick={handleSave} 
        disabled={saveNoteMutation.isPending || !content.trim()}
        className="w-full md:w-auto"
      >
        <Save className="h-4 w-4 mr-2" />
        {saveNoteMutation.isPending ? 'Salvando...' : 'Salvar Anotações'}
      </Button>
    </div>
  );
}
