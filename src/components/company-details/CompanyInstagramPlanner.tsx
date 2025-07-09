import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Plus, Calendar as CalendarIcon, Grid, Share2, Sparkles, Instagram, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

type InstagramPost = {
  id: string;
  user_id: string;
  company_id: string;
  post_date: string;
  idea: string;
  status: string;
  responsible?: string;
  created_at: string;
  updated_at: string;
};

interface CompanyInstagramPlannerProps {
  companyId: string;
  companyName: string;
}

export function CompanyInstagramPlanner({ companyId, companyName }: CompanyInstagramPlannerProps) {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [newPostIdea, setNewPostIdea] = useState("");
  const [newPostDate, setNewPostDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [newPostStatus, setNewPostStatus] = useState("planejado");
  const [editingPost, setEditingPost] = useState<InstagramPost | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  // Buscar posts do Instagram para a empresa
  const { data: instagramPosts = [], isLoading, refetch } = useQuery({
    queryKey: ["instagram-posts", companyId, currentMonth.getFullYear(), currentMonth.getMonth()],
    queryFn: async () => {
      const from = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const to = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("editorial_calendar_posts")
        .select("*")
        .eq("company_id", companyId)
        .gte("post_date", from)
        .lte("post_date", to)
        .order("post_date", { ascending: true });
      
      if (error) throw error;
      return data as InstagramPost[];
    },
  });

  // Adicionar novo post
  const addPostMutation = useMutation({
    mutationFn: async (postData: { idea: string; date: string; status: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("Usuário não autenticado");
      
      const { error } = await supabase
        .from("editorial_calendar_posts")
        .insert({
          user_id: userData.user.id,
          company_id: companyId,
          post_date: postData.date,
          idea: postData.idea,
          status: postData.status,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setShowNewPostDialog(false);
      setNewPostIdea("");
      setNewPostDate(format(new Date(), "yyyy-MM-dd"));
      setNewPostStatus("planejado");
      queryClient.invalidateQueries({ queryKey: ["instagram-posts"] });
      toast.success("Ideia de post adicionada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao adicionar post: " + error.message);
    },
  });

  // Editar post
  const editPostMutation = useMutation({
    mutationFn: async (postData: { id: string; idea: string; status: string }) => {
      const { error } = await supabase
        .from("editorial_calendar_posts")
        .update({
          idea: postData.idea,
          status: postData.status,
        })
        .eq("id", postData.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingPost(null);
      queryClient.invalidateQueries({ queryKey: ["instagram-posts"] });
      toast.success("Post atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar post: " + error.message);
    },
  });

  // Deletar post
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("editorial_calendar_posts")
        .delete()
        .eq("id", postId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-posts"] });
      toast.success("Post removido com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao remover post: " + error.message);
    },
  });

  // Gerar ideias com IA
  const generateIdeasWithAI = async () => {
    setLoadingAI(true);
    try {
      const prompt = `Você é um especialista em marketing digital e Instagram. Crie 10 ideias criativas e engajantes de posts para Instagram para a empresa "${companyName}" para o mês de ${format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}. Inclua datas comemorativas relevantes e conteúdo de valor. Responda no formato JSON: [{"data":"YYYY-MM-DD","ideia":"texto da ideia detalhada"}]. Seja criativo e pense em posts que gerem engajamento.`;
      
      const { data: responseData, error: responseError } = await supabase.functions.invoke('generate-with-ai', {
        body: { prompt }
      });

      if (responseError) {
        toast.error("Erro ao chamar função de IA: " + responseError.message);
        return;
      }

      if (!responseData?.generatedText) {
        toast.error("Nenhuma resposta gerada pela IA");
        return;
      }

      let ideas: Array<{ data: string, ideia: string }> = [];
      try {
        ideas = JSON.parse(responseData.generatedText);
      } catch {
        toast.error("A IA respondeu em formato inesperado");
        return;
      }

      if (ideas.length === 0) {
        toast.error("Nenhuma sugestão gerada pela IA");
        return;
      }
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("Usuário não autenticado");

      // Evitar duplicatas
      const existingDays = new Set(instagramPosts.map(p => p.post_date));
      const ideasToInsert = ideas.filter(
        (i) => !existingDays.has(i.data)
      ).map(i => ({
        user_id: userData.user.id,
        company_id: companyId,
        post_date: i.data,
        idea: i.ideia,
        status: "planejado",
      }));

      if (ideasToInsert.length === 0) {
        toast.info("Todas as datas do mês já contêm ideias.");
        return;
      }
      
      const { error } = await supabase.from("editorial_calendar_posts").insert(ideasToInsert);
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["instagram-posts"] });
      toast.success(`${ideasToInsert.length} ideias adicionadas com sucesso!`);
    } catch (error: any) {
      toast.error("Erro ao gerar ideias: " + error.message);
    } finally {
      setLoadingAI(false);
    }
  };

  // Criar link de compartilhamento
  const createShareLink = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) throw new Error("Usuário não autenticado");

      // Verificar se já existe um link ativo
      const { data: existingLink } = await supabase
        .from("company_share_links")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .single();

      if (existingLink) {
        const shareUrl = `${window.location.origin}/shared-company/${existingLink.share_token}`;
        navigator.clipboard.writeText(shareUrl);
        toast.success("Link copiado para a área de transferência!");
        return;
      }

      // Criar novo link
      const shareToken = crypto.randomUUID();
      const { error } = await supabase
        .from("company_share_links")
        .insert({
          company_id: companyId,
          created_by: userData.user.id,
          share_token: shareToken,
        });

      if (error) throw error;

      const shareUrl = `${window.location.origin}/shared-company/${shareToken}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link de compartilhamento criado e copiado!");
    } catch (error: any) {
      toast.error("Erro ao criar link: " + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planejado": return "bg-blue-100 text-blue-800";
      case "produzindo": return "bg-yellow-100 text-yellow-800";
      case "publicado": return "bg-green-100 text-green-800";
      case "cancelado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleAddPost = () => {
    if (!newPostIdea.trim()) {
      toast.error("Digite uma ideia para o post");
      return;
    }
    addPostMutation.mutate({
      idea: newPostIdea.trim(),
      date: newPostDate,
      status: newPostStatus,
    });
  };

  const handleEditPost = () => {
    if (!editingPost || !editingPost.idea.trim()) {
      toast.error("Digite uma ideia para o post");
      return;
    }
    editPostMutation.mutate({
      id: editingPost.id,
      idea: editingPost.idea,
      status: editingPost.status,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-600" />
            Planejamento Instagram - {companyName}
          </h3>
          <p className="text-sm text-muted-foreground">
            Planeje e organize suas ideias de posts para Instagram
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'calendar' : 'grid')}
          >
            {viewMode === 'grid' ? <CalendarIcon className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            {viewMode === 'grid' ? 'Calendário' : 'Quadros'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={createShareLink}
          >
            <Share2 className="h-4 w-4 mr-1" />
            Compartilhar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={generateIdeasWithAI}
            disabled={loadingAI}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            {loadingAI ? "Gerando..." : "IA"}
          </Button>
          
          <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nova Ideia
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Ideia de Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Data do Post</label>
                  <Input
                    type="date"
                    value={newPostDate}
                    onChange={(e) => setNewPostDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Ideia do Post</label>
                  <Textarea
                    placeholder="Descreva sua ideia de post para Instagram..."
                    value={newPostIdea}
                    onChange={(e) => setNewPostIdea(e.target.value)}
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={newPostStatus} onValueChange={setNewPostStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planejado">Planejado</SelectItem>
                      <SelectItem value="produzindo">Produzindo</SelectItem>
                      <SelectItem value="publicado">Publicado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddPost} className="w-full">
                  Adicionar Ideia
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Seletor de Mês */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
        >
          ← Mês Anterior
        </Button>
        <span className="font-medium">
          {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
        >
          Próximo Mês →
        </Button>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="text-center py-8">Carregando posts...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {instagramPosts.map((post) => (
            <Card key={post.id} className="relative group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(post.status)} variant="outline">
                    {post.status}
                  </Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPost(post)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePostMutation.mutate(post.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(post.post_date), "dd 'de' MMMM", { locale: ptBR })}
                  </div>
                  <p className="text-sm leading-relaxed line-clamp-4">
                    {post.idea}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {instagramPosts.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Instagram className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma ideia de post encontrada para este mês</p>
              <p className="text-sm">Clique em "Nova Ideia" ou "IA" para começar</p>
            </div>
          )}
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Post</DialogTitle>
          </DialogHeader>
          {editingPost && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Data do Post</label>
                <Input
                  type="date"
                  value={editingPost.post_date}
                  disabled
                />
              </div>
              <div>
                <label className="text-sm font-medium">Ideia do Post</label>
                <Textarea
                  value={editingPost.idea}
                  onChange={(e) => setEditingPost({ ...editingPost, idea: e.target.value })}
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={editingPost.status} 
                  onValueChange={(value) => setEditingPost({ ...editingPost, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planejado">Planejado</SelectItem>
                    <SelectItem value="produzindo">Produzindo</SelectItem>
                    <SelectItem value="publicado">Publicado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleEditPost} className="w-full">
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}