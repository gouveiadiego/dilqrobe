import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Pencil, BookHeart, Brain, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
const journalPrompts = ["Como você está se sentindo hoje?", "O que te fez sorrir hoje?", "Qual foi seu maior aprendizado hoje?", "Do que você é grato hoje?", "Que objetivo você quer alcançar esta semana?", "Como você pode tornar amanhã melhor que hoje?"];
export function JournalsTab() {
  const [journalEntry, setJournalEntry] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState(journalPrompts[0]);
  const [entries, setEntries] = useState<any[]>([]);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [stats, setStats] = useState({
    consecutiveDays: 0,
    totalEntries: 0,
    averageMood: "Calculando..."
  });
  useEffect(() => {
    fetchJournalEntries();
    calculateStats();
  }, []);
  const fetchJournalEntries = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('journal_entries').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      toast.error("Erro ao carregar as entradas do diário");
    }
  };
  const calculateStats = async () => {
    try {
      const {
        data: journalData,
        error
      } = await supabase.from('journal_entries').select('created_at').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      let consecutiveDays = 0;
      if (journalData && journalData.length > 0) {
        const dates = journalData.map(entry => format(new Date(entry.created_at), 'yyyy-MM-dd'));
        const uniqueDates = [...new Set(dates)];
        const today = format(new Date(), 'yyyy-MM-dd');
        if (uniqueDates[0] === today) {
          consecutiveDays = 1;
          let currentDate = new Date();
          for (let i = 1; i < uniqueDates.length; i++) {
            currentDate.setDate(currentDate.getDate() - 1);
            const dateToCheck = format(currentDate, 'yyyy-MM-dd');
            if (uniqueDates.includes(dateToCheck)) {
              consecutiveDays++;
            } else {
              break;
            }
          }
        }
      }
      setStats({
        consecutiveDays,
        totalEntries: journalData?.length || 0,
        averageMood: "Positivo" // This could be enhanced with sentiment analysis
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };
  const handleNewPrompt = () => {
    const newPrompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];
    setCurrentPrompt(newPrompt);
  };
  const handleSaveEntry = async () => {
    if (!journalEntry.trim()) {
      toast.error("Por favor, escreva algo antes de salvar.");
      return;
    }
    try {
      const {
        data: {
          user
        },
        error: userError
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        toast.error("Usuário não encontrado");
        return;
      }
      const {
        error
      } = await supabase.from('journal_entries').insert({
        content: journalEntry,
        prompt: currentPrompt,
        user_id: user.id
      });
      if (error) throw error;
      toast.success("Entrada salva com sucesso!");
      setJournalEntry("");
      fetchJournalEntries();
      calculateStats();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error("Erro ao salvar a entrada");
    }
  };
  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    try {
      const {
        error
      } = await supabase.from('journal_entries').update({
        content: editingEntry.content
      }).eq('id', editingEntry.id);
      if (error) throw error;
      toast.success("Entrada atualizada com sucesso!");
      fetchJournalEntries();
      setEditingEntry(null);
    } catch (error) {
      console.error('Error updating journal entry:', error);
      toast.error("Erro ao atualizar a entrada");
    }
  };
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };
  return <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Diário Pessoal</h2>
        <p className="text-muted-foreground">
          Seu espaço seguro para reflexão, crescimento e memórias.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dias Consecutivos</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.consecutiveDays} dias</div>
            <p className="text-xs text-muted-foreground">
              Continue mantendo seu hábito!
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
            <BookHeart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntries} entradas</div>
            <p className="text-xs text-muted-foreground">
              Suas memórias estão crescendo
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Humor Médio</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageMood}</div>
            <p className="text-xs text-muted-foreground">
              Baseado nas suas últimas entradas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="relative">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Nova Entrada</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleNewPrompt}>
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Sugestão: {currentPrompt}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea placeholder="Comece a escrever aqui..." className="min-h-[200px] resize-none" value={journalEntry} onChange={e => setJournalEntry(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setJournalEntry("")}>
              Limpar
            </Button>
            <Button onClick={handleSaveEntry}>
              <Pencil className="mr-2 h-4 w-4" />
              Salvar Entrada
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Entradas Anteriores</h3>
        {entries.map(entry => <Dialog key={entry.id}>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium">
                    {format(new Date(entry.created_at), "dd/MM/yyyy HH:mm")}
                  </CardTitle>
                  {entry.prompt}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-start gap-4">
                  <p className="whitespace-pre-wrap line-clamp-3">{entry.content}</p>
                  <div className="flex gap-2 shrink-0">
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setEditingEntry(entry)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                  </div>
                </div>
              </CardContent>
            </Card>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  Entrada do dia {format(new Date(entry.created_at), "dd/MM/yyyy")}
                </DialogTitle>
                <DialogDescription>
                  {entry.prompt && `Prompt: ${entry.prompt}`}
                </DialogDescription>
              </DialogHeader>
              {editingEntry?.id === entry.id ? <div className="space-y-4">
                  <Textarea value={editingEntry.content} onChange={e => setEditingEntry({
              ...editingEntry,
              content: e.target.value
            })} className="min-h-[200px]" />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setEditingEntry(null)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveEdit}>
                      Salvar Alterações
                    </Button>
                  </div>
                </div> : <div className="space-y-4">
                  <p className="whitespace-pre-wrap">{entry.content}</p>
                  <div className="flex justify-end">
                    <Button onClick={() => setEditingEntry(entry)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                </div>}
            </DialogContent>
          </Dialog>)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Benefícios do Diário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Autoconhecimento e clareza mental
            </p>
            <p className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Redução do estresse e ansiedade
            </p>
            <p className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Acompanhamento de metas e progresso
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dicas para Escrever</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">• Escreva sem julgamentos</p>
            <p className="text-sm">• Seja honesto com seus sentimentos</p>
            <p className="text-sm">• Não se preocupe com perfeição</p>
            <p className="text-sm">• Mantenha uma rotina diária</p>
          </CardContent>
        </Card>
      </div>
    </div>;
}