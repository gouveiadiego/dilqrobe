
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { Plus, Sparkles, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Company = {
  id: string;
  name: string;
};

type EditorialPost = {
  id: string;
  user_id: string;
  company_id: string;
  post_date: string;
  idea: string;
  status: string;
  responsible?: string;
};

export function EditorialCalendar() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showNewIdea, setShowNewIdea] = useState<{ day: Date } | null>(null);
  const [ideaInput, setIdeaInput] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);

  // Buscar empresas registradas
  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ["project-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_companies")
        .select("id,name")
        .order("name");
      if (error) throw error;
      return data as Company[];
    },
  });

  // Buscar ideias de post do calendário editorial
  const { data: calendarPosts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ["editorial-calendar-posts", selectedCompany?.id, selectedMonth.getFullYear(), selectedMonth.getMonth()],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const from = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
      const to = format(endOfMonth(selectedMonth), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("editorial_calendar_posts")
        .select("*")
        .eq("company_id", selectedCompany.id)
        .gte("post_date", from)
        .lte("post_date", to);
      if (error) throw error;
      return data as EditorialPost[];
    },
    enabled: !!selectedCompany,
  });

  // Adicionar manualmente uma ideia
  const addIdeaMutation = useMutation({
    mutationFn: async ({ day, idea }: { day: Date, idea: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("Usuário não autenticado.");
      const { error } = await supabase
        .from("editorial_calendar_posts")
        .insert({
          user_id: userData.user.id,
          company_id: selectedCompany?.id,
          post_date: format(day, "yyyy-MM-dd"),
          idea,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setShowNewIdea(null);
      setIdeaInput("");
      queryClient.invalidateQueries({ queryKey: ["editorial-calendar-posts"] });
      toast({ title: "Nova ideia de post adicionada!" });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao adicionar ideia", description: e.message, variant: "destructive" });
    },
  });

  // Gerar ideias de IA para o mês inteiro
  const generateIdeasWithAI = async () => {
    if (!selectedCompany) {
      toast({ title: "Selecione uma empresa" });
      return;
    }
    setLoadingAI(true);
    try {
      // Usando o endpoint de IA já existente
      const prompt = `Você é um especialista em marketing. Crie uma ideia de post INSTAGRAM para cada data importante, datas comemorativas e ao menos 1 ideia criativa para o segmento dessa empresa para o mês de ${format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}. Responda no formato JSON: [{"data":"YYYY-MM-DD","ideia":"texto da ideia"}], com uma entrada por dia apenas se tiver sugestão pertinente (não precisa preencher todos os dias). Segmento: ${selectedCompany.name}`;
      const resp = await fetch("/api/generate-with-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const { generatedText } = await resp.json();
      let ideas: Array<{ data: string, ideia: string }> = [];
      try {
        ideas = JSON.parse(generatedText);
      } catch {
        toast({ title: "A IA respondeu em formato inesperado", variant: "destructive" });
        setLoadingAI(false);
        return;
      }

      if (ideas.length === 0) {
        toast({ title: "Nenhuma sugestão gerada pela IA :( " });
        setLoadingAI(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("Usuário não autenticado.");

      // Evitar duplicatas (não adicionar para dias já preenchidos)
      const existingDays = new Set(calendarPosts.map(p => p.post_date));
      const ideasToInsert = ideas.filter(
        (i) => !existingDays.has(i.data)
      ).map(i => ({
        user_id: userData.user.id,
        company_id: selectedCompany.id,
        post_date: i.data,
        idea: i.ideia,
        status: "planejado",
      }));

      if (ideasToInsert.length === 0) {
        toast({ title: "Todas as datas do mês já contem ideias." });
        setLoadingAI(false);
        return;
      }
      const { error } = await supabase.from("editorial_calendar_posts").insert(ideasToInsert);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["editorial-calendar-posts"] });
      toast({ title: "Sugestões do calendário adicionadas!" });
    } catch (e: any) {
      toast({ title: "Erro ao usar IA", description: e.message, variant: "destructive" });
    } finally {
      setLoadingAI(false);
    }
  };

  // Converter ideia em tarefa (opcional: você pode customizar para criar na lista de tarefas da empresa)
  const addAsTaskMutation = useMutation({
    mutationFn: async (post: EditorialPost) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("Usuário não autenticado");
      // Cria na tabela de tasks da empresa vinculada
      const { error } = await supabase.from("project_checklist").insert({
        user_id: userData.user.id,
        company_id: selectedCompany?.id,
        title: post.idea,
        category: "conteudo-instagram",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Tarefa criada na empresa com sucesso!" });
    },
    onError: (e: any) => {
      toast({ title: "Erro ao criar tarefa", description: e.message, variant: "destructive" });
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-dilq-accent to-dilq-purple bg-clip-text text-transparent">
          Calendário Editorial por Empresa
        </h2>
        <p className="text-gray-500 text-sm">Planeje e visualize ideias de posts para Instagram vinculadas a cada empresa/projeto.</p>
      </div>

      <div className="mb-4">
        <label className="block font-medium text-sm mb-1">Empresa:</label>
        <select
          className="w-full border-gray-200 rounded px-3 py-2"
          value={selectedCompany?.id || ""}
          onChange={(e) => {
            const c = companies.find(comp => comp.id === e.target.value);
            setSelectedCompany(c || null);
          }}
        >
          <option value="">Selecione uma empresa</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {selectedCompany && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="font-medium">Mês:</span>
            <input
              type="month"
              className="border rounded px-2 py-1 text-sm"
              value={format(selectedMonth, "yyyy-MM")}
              onChange={e => {
                const [yyyy, mm] = e.target.value.split("-");
                setSelectedMonth(new Date(Number(yyyy), Number(mm) - 1));
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="ml-auto flex items-center gap-1"
              disabled={loadingAI}
              onClick={generateIdeasWithAI}
              title="Gerar ideias de posts para o mês com IA"
            >
              <Sparkles className="w-4 h-4" />
              {loadingAI ? "Gerando..." : "Gerar ideias IA"}
            </Button>
          </div>

          {/* Calendário visual com indicações dos dias que têm ideias */}
          <div>
            <Calendar
              mode="single"
              month={selectedMonth}
              selected={null}
              onMonthChange={setSelectedMonth}
              modifiers={{
                postdays: calendarPosts.map(p => new Date(p.post_date))
              }}
              modifiersClassNames={{
                postdays: "bg-dilq-purple/40 rounded-full"
              }}
              // Clicando em um dia permite adicionar nova ideia
              onDayClick={day => setShowNewIdea({ day })}
              className="pointer-events-auto"
            />
            <div className="text-xs mt-1 text-gray-400">Clique em um dia para adicionar uma nova ideia de post.</div>
          </div>

          {/* Lista de ideias daquele mês */}
          <div className="space-y-2">
            {eachDayOfInterval({ start: startOfMonth(selectedMonth), end: endOfMonth(selectedMonth) }).map(day => {
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
                          onClick={() => addAsTaskMutation.mutate(p)}
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
        </div>
      )}

      {/* Dialog de adicionar manualmente nova ideia para um dia */}
      {showNewIdea && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
              onClick={() => setShowNewIdea(null)}
            >
              ×
            </button>
            <h3 className="font-semibold mb-2">
              Nova ideia para {format(showNewIdea.day, "dd/MM/yyyy")}
            </h3>
            <Input
              placeholder="Descreva a ideia do post"
              value={ideaInput}
              onChange={e => setIdeaInput(e.target.value)}
              autoFocus
            />
            <Button
              className="mt-4 w-full"
              disabled={!ideaInput.trim()}
              onClick={() => {
                addIdeaMutation.mutate({ day: showNewIdea.day, idea: ideaInput.trim() });
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar ideia
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
