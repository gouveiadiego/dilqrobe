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
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/ui/pagination-controls";

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

  // Novos estados para busca/filtro/ordenação
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [order, setOrder] = useState<"newest" | "oldest">("newest");

  const {
    paginatedData: paginatedEntries,
    currentPage,
    totalPages,
    goToPage,
    hasNextPage,
    hasPrevPage
  } = usePagination({ data: entries, itemsPerPage: 6 });
  
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
        setEntries(entries.filter(entry => entry.id !== entryId));
        toast.success("Entrada excluída com sucesso!");
      } else {
        toast.error("Erro ao excluir entrada");
        console.error("Delete operation returned success:false");
        await loadEntries();
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Erro ao excluir entrada");
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
  
  // Função de filtro por data
  function filterByDate(entry: JournalEntry) {
    if (dateFilter === "all") return true;
    const entryDate = new Date(entry.created_at);
    const now = new Date();

    if (dateFilter === "today") {
      return (
        entryDate.getFullYear() === now.getFullYear() &&
        entryDate.getMonth() === now.getMonth() &&
        entryDate.getDate() === now.getDate()
      );
    }
    if (dateFilter === "week") {
      const firstDayOfWeek = new Date(now);
      firstDayOfWeek.setDate(now.getDate() - now.getDay());
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
      return entryDate >= firstDayOfWeek && entryDate <= lastDayOfWeek;
    }
    if (dateFilter === "month") {
      return (
        entryDate.getFullYear() === now.getFullYear() &&
        entryDate.getMonth() === now.getMonth()
      );
    }
    return true;
  }

  // Memoized filtered/sorted entries
  const visibleEntries = React.useMemo(() => {
    let filtered = entries
      .filter(entry => 
        search.length === 0 ||
        entry.content.toLowerCase().includes(search.toLowerCase()) ||
        (entry.prompt && entry.prompt.toLowerCase().includes(search.toLowerCase()))
      )
      .filter(filterByDate);

    filtered = filtered.sort((a, b) => {
      if (order === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return filtered;
  }, [entries, search, dateFilter, order]);

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold">Meus Diários</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-1 w-full sm:w-auto">
              <Plus size={16} /> 
              <span className="sm:hidden">Nova Entrada</span>
              <span className="hidden sm:inline">Nova Entrada</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-4 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Entrada de Diário</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <Textarea
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
                placeholder="O que você está pensando hoje?"
                rows={6}
                className="w-full resize-none"
              />
            </div>
            <DialogFooter className="mt-4">
              <Button 
                onClick={handleNewEntry} 
                disabled={isLoading || !newEntry.trim()}
                className="w-full sm:w-auto"
              >
                {isLoading ? "Salvando..." : "Salvar Entrada"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Barra de busca, filtros e ordenação */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-full mb-2">
        <input
          type="text"
          placeholder="Buscar pelo texto..."
          className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-accent"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2">
          <select
            title="Filtrar por data"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 rounded px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">Todas</option>
            <option value="today">Hoje</option>
            <option value="week">Semana</option>
            <option value="month">Mês</option>
          </select>
          <select
            title="Ordenar"
            value={order}
            onChange={e => setOrder(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 rounded px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="newest">Mais recente</option>
            <option value="oldest">Mais antiga</option>
          </select>
        </div>
      </div>

      {isLoading && entries.length === 0 ? (
        <LoadingSpinner size="lg" text="Carregando entradas..." className="h-64" />
      ) : visibleEntries.length === 0 ? (
        <EmptyState
          title="Nenhuma entrada encontrada"
          description="Você ainda não tem nenhuma entrada. Crie sua primeira entrada de diário!"
          action={{
            label: "Nova Entrada",
            onClick: () => setIsDialogOpen(true)
          }}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {visibleEntries.map((entry) => (
              <Card key={entry.id} className="overflow-hidden h-fit">
                <CardHeader className="p-3 md:p-4 pb-2 flex flex-row justify-between items-start">
                  <CardTitle className="text-sm text-gray-500 flex-1 mr-2">
                    {formatDate(entry.created_at)}
                  </CardTitle>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditDialog(entry)}
                      className="h-8 w-8"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteEntry(entry.id)}
                      disabled={isDeleting}
                      className="h-8 w-8"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-2">
                  <div className="whitespace-pre-wrap text-sm md:text-base break-words line-clamp-6">
                    {entry.content}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            className="mt-6"
          />
        </div>
      )}
      
      {currentEntry && (
        <Dialog
          open={!!currentEntry}
          onOpenChange={(open) => {
            if (!open) setCurrentEntry(null);
          }}
        >
          <DialogContent className="mx-4 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Entrada</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={6}
                className="w-full resize-none"
              />
            </div>
            <DialogFooter className="mt-4">
              <Button 
                onClick={handleEditEntry} 
                disabled={isEditing || !editContent.trim()}
                className="w-full sm:w-auto"
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
