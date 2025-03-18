
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  CalendarDays, 
  Pencil, 
  BookHeart, 
  Brain, 
  Sparkles, 
  Target, 
  Trash2, 
  Calendar,
  Bookmark,
  GemIcon,
  LightbulbIcon,
  Star
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const journalPrompts = ["Como você está se sentindo hoje?", "O que te fez sorrir hoje?", "Qual foi seu maior aprendizado hoje?", "Do que você é grato hoje?", "Que objetivo você quer alcançar esta semana?", "Como você pode tornar amanhã melhor que hoje?"];

export function JournalsTab() {
  const [journalEntry, setJournalEntry] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState(journalPrompts[0]);
  const [entries, setEntries] = useState<any[]>([]);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [openDeleteAlertId, setOpenDeleteAlertId] = useState<string | null>(null);
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
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      toast.error("Erro ao carregar as entradas do diário");
    }
  };

  const calculateStats = async () => {
    try {
      const { data: journalData, error } = await supabase
        .from('journal_entries')
        .select('created_at')
        .order('created_at', { ascending: false });
        
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        toast.error("Usuário não encontrado");
        return;
      }

      const { error } = await supabase
        .from('journal_entries')
        .insert({
          content: journalEntry,
          prompt: currentPrompt,
          user_id: user.id
        });

      if (error) throw error;

      toast.success("Entrada salva com sucesso!");
      setJournalEntry("");
      await fetchJournalEntries();
      await calculateStats();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error("Erro ao salvar a entrada");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    
    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({ content: editingEntry.content })
        .eq('id', editingEntry.id);
        
      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      
      toast.success("Entrada atualizada com sucesso!");
      setDialogOpen(false);
      setEditingEntry(null);
      
      // Refresh entries from the database to ensure we have the latest data
      await fetchJournalEntries();
    } catch (error) {
      console.error('Error updating journal entry:', error);
      toast.error("Erro ao atualizar a entrada");
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId);
        
      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
      
      toast.success("Entrada excluída com sucesso!");
      setOpenDeleteAlertId(null);
      
      // Refresh entries from the database to ensure we have the latest data
      await fetchJournalEntries();
      await calculateStats();
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      toast.error("Erro ao excluir a entrada");
    }
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-lg bg-gradient-to-r from-dilq-purple/10 to-dilq-indigo/10 border border-white/20 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-dilq-purple/10 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2 z-0"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-dilq-indigo/10 rounded-full filter blur-3xl translate-y-1/2 -translate-x-1/2 z-0"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <BookHeart className="h-7 w-7 text-dilq-purple animate-pulse-subtle" />
            <h2 className="text-3xl font-bold bg-gradient-to-r from-dilq-indigo to-dilq-purple bg-clip-text text-transparent">
              Diário Pessoal
            </h2>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Seu espaço seguro para reflexão, crescimento e memórias. Registre seus pensamentos, sentimentos e descobertas neste ambiente digital criado especialmente para você.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="overflow-hidden relative backdrop-blur-sm border-none transition-all duration-300 hover:shadow-lg group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/5 z-0 group-hover:opacity-70 transition-opacity"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 relative z-10">
            <CardTitle className="text-sm font-medium">Dias Consecutivos</CardTitle>
            <CalendarDays className="h-5 w-5 text-dilq-purple animate-float" />
          </CardHeader>
          <CardContent className="relative z-10 pt-4">
            <div className="flex items-baseline gap-1">
              <div className="text-3xl font-bold bg-gradient-to-r from-dilq-indigo to-dilq-purple bg-clip-text text-transparent">
                {stats.consecutiveDays}
              </div>
              <div className="text-xl ml-1">dias</div>
            </div>
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <Star className="h-3 w-3 mr-1 text-amber-500" />
              <span>Continue mantendo seu hábito!</span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative backdrop-blur-sm border-none transition-all duration-300 hover:shadow-lg group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/5 z-0 group-hover:opacity-70 transition-opacity"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 relative z-10">
            <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
            <BookHeart className="h-5 w-5 text-dilq-indigo animate-float" />
          </CardHeader>
          <CardContent className="relative z-10 pt-4">
            <div className="flex items-baseline gap-1">
              <div className="text-3xl font-bold bg-gradient-to-r from-dilq-indigo to-dilq-purple bg-clip-text text-transparent">
                {stats.totalEntries}
              </div>
              <div className="text-xl ml-1">entradas</div>
            </div>
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <Bookmark className="h-3 w-3 mr-1 text-dilq-purple" />
              <span>Suas memórias estão crescendo</span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative backdrop-blur-sm border-none transition-all duration-300 hover:shadow-lg group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/5 z-0 group-hover:opacity-70 transition-opacity"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 relative z-10">
            <CardTitle className="text-sm font-medium">Humor Médio</CardTitle>
            <Brain className="h-5 w-5 text-blue-500 animate-float" />
          </CardHeader>
          <CardContent className="relative z-10 pt-4">
            <div className="flex items-baseline gap-1">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-dilq-indigo bg-clip-text text-transparent">
                {stats.averageMood}
              </div>
            </div>
            <div className="flex items-center mt-2 text-xs text-muted-foreground">
              <LightbulbIcon className="h-3 w-3 mr-1 text-amber-400" />
              <span>Baseado nas suas últimas entradas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Entry Section */}
      <Card className="relative overflow-hidden backdrop-blur-sm border border-white/10 shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-purple-600/5 z-0"></div>
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-dilq-purple" />
              <span>Nova Entrada</span>
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNewPrompt}
              className="rounded-full w-8 h-8 p-0 bg-purple-50 hover:bg-purple-100 text-dilq-purple"
            >
              <Sparkles className="h-4 w-4 animate-pulse-subtle" />
            </Button>
          </div>
          <CardDescription className="flex items-center gap-1 mt-1">
            <Target className="h-3 w-3 text-dilq-indigo" />
            <span className="italic">{currentPrompt}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          <Textarea 
            placeholder="Comece a escrever aqui..." 
            className="min-h-[200px] resize-none focus:ring-1 focus:ring-dilq-purple/40 transition-all border-dilq-purple/10 bg-white/80" 
            value={journalEntry} 
            onChange={e => setJournalEntry(e.target.value)} 
          />
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline"
              onClick={() => setJournalEntry("")}
              className="border-dilq-purple/20 text-dilq-purple hover:bg-dilq-purple/5 transition-all"
            >
              Limpar
            </Button>
            <Button 
              onClick={handleSaveEntry}
              className="bg-gradient-to-r from-dilq-indigo to-dilq-purple hover:from-dilq-indigo/90 hover:to-dilq-purple/90 transition-all shadow-md hover:shadow-lg"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Salvar Entrada
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Previous Entries Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-dilq-purple" />
          <span className="bg-gradient-to-r from-dilq-indigo to-dilq-purple bg-clip-text text-transparent">
            Entradas Anteriores
          </span>
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          {entries.map(entry => (
            <Card key={entry.id} className="relative overflow-hidden transition-all duration-300 hover:shadow-md group backdrop-blur-sm border border-gray-100/60">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white/80 z-0 group-hover:from-purple-50/50 group-hover:to-indigo-50/30 transition-all duration-500"></div>
              <CardHeader className="relative z-10 pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-dilq-indigo" />
                    {format(new Date(entry.created_at), "dd/MM/yyyy HH:mm")}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground italic bg-white/80 px-2 py-0.5 rounded-full text-xs border border-gray-100/80 shadow-sm">
                    {entry.prompt}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 pt-1">
                <div className="flex justify-between items-start gap-4">
                  <p className="whitespace-pre-wrap line-clamp-3 text-gray-700">{entry.content}</p>
                  <div className="flex gap-1 shrink-0">
                    <Dialog open={dialogOpen && editingEntry?.id === entry.id} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) setEditingEntry(null);
                      }}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full h-8 w-8 bg-white hover:bg-purple-50 text-dilq-purple border border-dilq-purple/10"
                          onClick={() => {
                            setEditingEntry(entry);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      
                      <DialogContent className="max-w-2xl backdrop-blur-md bg-white/95 border border-gray-100/70">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-dilq-purple" />
                            Entrada do dia {format(new Date(entry.created_at), "dd/MM/yyyy")}
                          </DialogTitle>
                          <DialogDescription className="flex items-center gap-1.5">
                            <Target className="h-3.5 w-3.5 text-dilq-indigo" />
                            {entry.prompt && entry.prompt}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea 
                            value={editingEntry?.id === entry.id ? editingEntry.content : entry.content} 
                            onChange={e => setEditingEntry({
                              ...editingEntry,
                              content: e.target.value
                            })} 
                            className="min-h-[200px] focus:ring-1 focus:ring-dilq-purple/40 transition-all border-dilq-purple/10 bg-white" 
                          />
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setEditingEntry(null);
                                setDialogOpen(false);
                              }}
                              className="border-dilq-purple/20 text-dilq-purple hover:bg-dilq-purple/5"
                            >
                              Cancelar
                            </Button>
                            <Button 
                              onClick={handleSaveEdit}
                              className="bg-gradient-to-r from-dilq-indigo to-dilq-purple hover:from-dilq-indigo/90 hover:to-dilq-purple/90 shadow-md"
                            >
                              Salvar Alterações
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <AlertDialog open={openDeleteAlertId === entry.id} onOpenChange={(open) => setOpenDeleteAlertId(open ? entry.id : null)}>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full h-8 w-8 bg-white hover:bg-red-50 text-red-500 border border-red-100/30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="backdrop-blur-md bg-white/90 border border-gray-100/70">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir entrada do diário?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente esta entrada do seu diário.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-dilq-purple/20 text-dilq-purple hover:bg-dilq-purple/5">
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                            onClick={() => handleDeleteEntry(entry.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Card className="overflow-hidden relative backdrop-blur-sm border-none transition-all duration-300 hover:shadow-lg group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-indigo-600/10 z-0 group-hover:opacity-70 transition-opacity"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-lg flex items-center gap-2">
              <GemIcon className="h-5 w-5 text-dilq-purple animate-pulse-subtle" />
              <span className="bg-gradient-to-r from-dilq-indigo to-dilq-purple bg-clip-text text-transparent">
                Benefícios do Diário
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 relative z-10">
            <p className="flex items-center gap-2 text-gray-700">
              <div className="h-7 w-7 rounded-full bg-purple-50 flex items-center justify-center">
                <Brain className="h-4 w-4 text-dilq-purple" />
              </div>
              <span>Autoconhecimento e clareza mental</span>
            </p>
            <p className="flex items-center gap-2 text-gray-700">
              <div className="h-7 w-7 rounded-full bg-indigo-50 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-dilq-indigo" />
              </div>
              <span>Redução do estresse e ansiedade</span>
            </p>
            <p className="flex items-center gap-2 text-gray-700">
              <div className="h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center">
                <Target className="h-4 w-4 text-blue-500" />
              </div>
              <span>Acompanhamento de metas e progresso</span>
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden relative backdrop-blur-sm border-none transition-all duration-300 hover:shadow-lg group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-blue-600/5 z-0 group-hover:opacity-70 transition-opacity"></div>
          <CardHeader className="relative z-10">
            <CardTitle className="text-lg flex items-center gap-2">
              <LightbulbIcon className="h-5 w-5 text-amber-500 animate-pulse-subtle" />
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                Dicas para Escrever
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 relative z-10">
            <p className="flex items-center gap-2 text-gray-700">
              <div className="h-7 w-7 rounded-full bg-amber-50 flex items-center justify-center">
                <Star className="h-4 w-4 text-amber-500" />
              </div>
              <span>Escreva sem julgamentos</span>
            </p>
            <p className="flex items-center gap-2 text-gray-700">
              <div className="h-7 w-7 rounded-full bg-amber-50 flex items-center justify-center">
                <Star className="h-4 w-4 text-amber-500" />
              </div>
              <span>Seja honesto com seus sentimentos</span>
            </p>
            <p className="flex items-center gap-2 text-gray-700">
              <div className="h-7 w-7 rounded-full bg-amber-50 flex items-center justify-center">
                <Star className="h-4 w-4 text-amber-500" />
              </div>
              <span>Não se preocupe com perfeição</span>
            </p>
            <p className="flex items-center gap-2 text-gray-700">
              <div className="h-7 w-7 rounded-full bg-amber-50 flex items-center justify-center">
                <Star className="h-4 w-4 text-amber-500" />
              </div>
              <span>Mantenha uma rotina diária</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
