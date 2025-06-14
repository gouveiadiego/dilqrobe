
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast, useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import { CompanySelector } from "./CompanySelector";
import { MonthSelector } from "./MonthSelector";
import { EditorialCalendarView } from "./EditorialCalendarView";
import { EditorialIdeasList } from "./EditorialIdeasList";
import { NewIdeaDialog } from "./NewIdeaDialog";

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
      const prompt = `Você é um especialista em marketing. Crie uma ideia de post INSTAGRAM para cada data importante, datas comemorativas e ao menos 1 ideia criativa para o segmento dessa empresa para o mês de ${format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}. Responda no formato JSON: [{"data":"YYYY-MM-DD","ideia":"texto da ideia"}], com uma entrada por dia apenas se tiver sugestão pertinente (não precisa preencher todos os dias). Segmento: ${selectedCompany.name}`;
      const { data: responseData, error: responseError } = await supabase.functions.invoke('generate-with-ai', {
        body: { prompt }
      });

      if (responseError) {
        toast({
          title: "Erro ao chamar função de IA",
          description: responseError.message || "Erro desconhecido",
          variant: "destructive",
        });
        setLoadingAI(false);
        return;
      }

      // LOG de debug para checar o que veio
      console.log("Resposta da função IA (Gemini):", responseData);

      let generatedText: string = "";
      try {
        if (!responseData?.generatedText) {
          throw new Error(responseData?.error || "Nenhuma resposta gerada pela IA.");
        }
        generatedText = responseData.generatedText;
      } catch (err) {
        toast({
          title: "Erro ao processar resposta da IA",
          description: typeof err === "string" ? err : "A resposta da IA veio vazia ou em formato inesperado: " + JSON.stringify(responseData),
          variant: "destructive",
        });
        setLoadingAI(false);
        return;
      }

      let ideas: Array<{ data: string, ideia: string }> = [];
      try {
        ideas = JSON.parse(generatedText);
      } catch {
        toast({ title: "A IA respondeu em formato inesperado", description: generatedText, variant: "destructive" });
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
      toast({ 
        title: "Erro ao usar IA", 
        description: typeof e === "string" ? e : (e?.message || "Erro desconhecido"), 
        variant: "destructive"
      });
    } finally {
      setLoadingAI(false);
    }
  };

  // Converter ideia em tarefa
  const addAsTaskMutation = useMutation({
    mutationFn: async (post: EditorialPost) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("Usuário não autenticado");
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

  const days = eachDayOfInterval({ start: startOfMonth(selectedMonth), end: endOfMonth(selectedMonth) });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-2 bg-gradient-to-r from-dilq-accent to-dilq-purple bg-clip-text text-transparent">
          Calendário Editorial por Empresa
        </h2>
        <p className="text-gray-500 text-sm">Planeje e visualize ideias de posts para Instagram vinculadas a cada empresa/projeto.</p>
      </div>

      <CompanySelector
        companies={companies}
        selectedCompany={selectedCompany}
        onSelect={setSelectedCompany}
        loading={loadingCompanies}
      />

      {selectedCompany && (
        <div className="space-y-6">
          <MonthSelector
            month={selectedMonth}
            onMonthChange={setSelectedMonth}
            loadingAI={loadingAI}
            onGenerateIdeas={generateIdeasWithAI}
          />

          <EditorialCalendarView
            month={selectedMonth}
            calendarPosts={calendarPosts}
            onDayClick={day => setShowNewIdea({ day })}
            onMonthChange={setSelectedMonth}
          />

          <EditorialIdeasList
            days={days}
            calendarPosts={calendarPosts}
            onAddTask={p => addAsTaskMutation.mutate(p)}
          />
        </div>
      )}

      <NewIdeaDialog
        visible={!!showNewIdea}
        day={showNewIdea?.day ?? new Date()}
        ideaInput={ideaInput}
        setIdeaInput={setIdeaInput}
        onClose={() => setShowNewIdea(null)}
        onAdd={() => {
          if (!showNewIdea) return;
          addIdeaMutation.mutate({ day: showNewIdea.day, idea: ideaInput.trim() });
        }}
      />
    </div>
  );
}
