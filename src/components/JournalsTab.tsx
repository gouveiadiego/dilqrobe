import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Pencil, BookHeart, Brain, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";

const journalPrompts = [
  "Como você está se sentindo hoje?",
  "O que te fez sorrir hoje?",
  "Qual foi seu maior aprendizado hoje?",
  "Do que você é grato hoje?",
  "Que objetivo você quer alcançar esta semana?",
  "Como você pode tornar amanhã melhor que hoje?"
];

export function JournalsTab() {
  const [journalEntry, setJournalEntry] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState(journalPrompts[0]);

  const handleNewPrompt = () => {
    const newPrompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];
    setCurrentPrompt(newPrompt);
  };

  const handleSaveEntry = () => {
    if (!journalEntry.trim()) {
      toast.error("Por favor, escreva algo antes de salvar.");
      return;
    }
    
    // TODO: Implement actual saving logic
    toast.success("Entrada salva com sucesso!");
    setJournalEntry("");
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Diário Pessoal</h2>
        <p className="text-muted-foreground">
          Seu espaço seguro para reflexão, crescimento e memórias.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dias Consecutivos</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 dias</div>
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
            <div className="text-2xl font-bold">32 entradas</div>
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
            <div className="text-2xl font-bold">Positivo</div>
            <p className="text-xs text-muted-foreground">
              Baseado nas suas últimas entradas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Writing Section */}
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
          <Textarea
            placeholder="Comece a escrever aqui..."
            className="min-h-[200px] resize-none"
            value={journalEntry}
            onChange={(e) => setJournalEntry(e.target.value)}
          />
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

      {/* Benefits Section */}
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
    </div>
  );
}