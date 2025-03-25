
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Trash2, Edit, Plus } from "lucide-react";
import { supabase, deleteJournalEntry, fetchJournalEntries } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface JournalEntry {
  id: string;
  content: string;
  created_at: string;
  prompt?: string;
}

export function JournalsTab() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Fetch journal entries on component mount
  useEffect(() => {
    loadEntries();
  }, []);
  
  const loadEntries = async () => {
    try {
      setIsLoading(true);
      const data = await fetchJournalEntries();
      setEntries(data as JournalEntry[]);
    } catch (error) {
      console.error("Error loading journal entries:", error);
      toast.error("Erro ao carregar entradas do diário");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNewEntry = async () => {
    if (!newEntry.trim()) {
      toast.error("Por favor, escreva algo antes de salvar");
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }
      
      const { data, error } = await supabase
        .from("journal_entries")
        .insert([
          {
            content: newEntry,
            user_id: user.id,
          },
        ])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast.success("Entrada adicionada com sucesso!");
      setNewEntry("");
      
      // Add the new entry to the entries list
      setEntries([data as JournalEntry, ...entries]);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding journal entry:", error);
      toast.error("Erro ao adicionar entrada");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteEntry = async (entryId: string) => {
    try {
      if (isDeleting) return;
      
      setIsDeleting(true);
      console.log("Deleting entry:", entryId);
      
      const result = await deleteJournalEntry(entryId);
      
      if (result.success) {
        // Update UI by removing the deleted entry
        setEntries(entries.filter(entry => entry.id !== entryId));
        toast.success("Entrada excluída com sucesso!");
      } else {
        toast.error("Erro ao excluir entrada");
        console.error("Delete operation returned success:false");
        // Reload entries to ensure UI is in sync with database
        await loadEntries();
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Erro ao excluir entrada");
      // Reload entries to ensure UI is in sync with database
      await loadEntries();
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleEditEntry = async () => {
    if (!currentEntry || !editContent.trim()) {
      toast.error("Conteúdo inválido");
      return;
    }
    
    try {
      setIsEditing(true);
      
      const { error } = await supabase
        .from("journal_entries")
        .update({
          content: editContent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentEntry.id);
      
      if (error) {
        throw error;
      }
      
      // Update the entry in the local state
      setEntries(
        entries.map((entry) =>
          entry.id === currentEntry.id
            ? { ...entry, content: editContent }
            : entry
        )
      );
      
      toast.success("Entrada atualizada com sucesso!");
      setCurrentEntry(null);
    } catch (error) {
      console.error("Error updating entry:", error);
      toast.error("Erro ao atualizar entrada");
      // Reload entries to ensure UI is in sync with database
      await loadEntries();
    } finally {
      setIsEditing(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "PPP", { locale: ptBR });
  };
  
  const openEditDialog = (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setEditContent(entry.content);
  };
  
  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Meus Diários</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-1">
              <Plus size={16} /> Nova Entrada
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Entrada de Diário</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <Textarea
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
                placeholder="O que você está pensando hoje?"
                rows={8}
                className="w-full"
              />
            </div>
            <DialogFooter className="mt-4">
              <Button 
                onClick={handleNewEntry} 
                disabled={isLoading || !newEntry.trim()}
              >
                {isLoading ? "Salvando..." : "Salvar Entrada"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading && entries.length === 0 ? (
        <div className="text-center p-10">Carregando entradas...</div>
      ) : entries.length === 0 ? (
        <div className="text-center p-10">
          Você ainda não tem nenhuma entrada. Crie sua primeira entrada de diário!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {entries.map((entry) => (
            <Card key={entry.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start">
                <CardTitle className="text-sm text-gray-500">
                  {formatDate(entry.created_at)}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openEditDialog(entry)}
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteEntry(entry.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="whitespace-pre-wrap">{entry.content}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Edit Dialog */}
      {currentEntry && (
        <Dialog
          open={!!currentEntry}
          onOpenChange={(open) => {
            if (!open) setCurrentEntry(null);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Entrada</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                className="w-full"
              />
            </div>
            <DialogFooter className="mt-4">
              <Button 
                onClick={handleEditEntry} 
                disabled={isEditing || !editContent.trim()}
              >
                {isEditing ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
