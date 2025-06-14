import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, List } from "lucide-react";
import { toast } from "sonner";

type Template = {
  id: string;
  title: string;
  description?: string;
};

type TemplateItem = {
  id: string;
  template_id: string;
  title: string;
  description?: string;
  order_index: number;
};

export function ProjectTemplatesManager() {
  const queryClient = useQueryClient();
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");

  // Carregar templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['project-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_templates')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Template[];
    }
  });

  // Carregar itens do template selecionado
  const { data: templateItems = [], refetch: refetchItems } = useQuery({
    queryKey: ['project-template-items', selectedTemplate?.id],
    queryFn: async () => {
      if (!selectedTemplate) return [];
      const { data, error } = await supabase
        .from('project_template_items')
        .select('*')
        .eq('template_id', selectedTemplate.id)
        .order('order_index', { ascending: true });
      if (error) throw error;
      return data as TemplateItem[];
    },
    enabled: !!selectedTemplate,
  });

  // Criar novo template
  const addTemplateMutation = useMutation({
    mutationFn: async ({ title, description }: { title: string; description: string }) => {
      // Buscar usuário logado
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) throw new Error("Falha ao obter usuário logado.");
      const user_id = userData.user.id;
      const { data, error } = await supabase
        .from('project_templates')
        .insert({ title, description, user_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Template criado!");
      setShowNewTemplate(false);
      setTemplateTitle("");
      setTemplateDesc("");
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
    }
  });

  // Remover template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template removido!");
      setSelectedTemplate(null);
      queryClient.invalidateQueries({ queryKey: ['project-templates'] });
    }
  });

  // Adicionar item ao template selecionado
  const addItemMutation = useMutation({
    mutationFn: async ({ title, description }: { title: string; description: string }) => {
      if (!selectedTemplate) throw new Error("Selecione um template.");
      const order_index = (templateItems?.length || 0);
      const { data, error } = await supabase
        .from('project_template_items')
        .insert({
          template_id: selectedTemplate.id,
          title,
          description,
          order_index
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Item adicionado!");
      setNewItemTitle("");
      setNewItemDesc("");
      refetchItems();
    }
  });

  // Remover item do template
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_template_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item removido!");
      refetchItems();
    }
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <List className="w-5 h-5 text-dilq-purple" />
        <h3 className="text-lg md:text-xl font-bold">Templates de Tarefas</h3>
        <span className="ml-auto">
          <Button variant="outline" size="sm" onClick={() => setShowNewTemplate(v => !v)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo template
          </Button>
        </span>
      </div>
      {showNewTemplate && (
        <div className="p-3 rounded-lg border border-gray-100 bg-gray-50 space-y-2">
          <Input
            value={templateTitle}
            onChange={e => setTemplateTitle(e.target.value)}
            placeholder="Nome do template (ex: Site, Gestão de Tráfego Pago)"
          />
          <Textarea
            value={templateDesc}
            onChange={e => setTemplateDesc(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                if (!templateTitle) {
                  toast.error("Título obrigatório");
                  return;
                }
                addTemplateMutation.mutate({ title: templateTitle, description: templateDesc });
              }}
            >
              Salvar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNewTemplate(false)}>Cancelar</Button>
          </div>
        </div>
      )}
      <div>
        {isLoadingTemplates ? (
          <div>Carregando...</div>
        ) : templates.length === 0 ? (
          <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-100 text-gray-400">
            Nenhum template cadastrado ainda.
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map(t => (
              <div key={t.id} className={`p-3 rounded-lg border ${selectedTemplate?.id === t.id ? "border-dilq-purple bg-purple-50/30" : "border-gray-100 bg-white"} flex items-center`}>
                <div className="flex-1" onClick={() => setSelectedTemplate(t)} style={{ cursor: "pointer" }}>
                  <span className="font-medium">{t.title}</span>
                  {t.description && <span className="text-xs ml-2 text-gray-500">{t.description}</span>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedTemplate(t)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteTemplateMutation.mutate(t.id)}>
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Itens do template selecionado */}
      {selectedTemplate && (
        <div className="rounded-lg bg-white border border-gray-100 p-4 mt-2">
          <h4 className="text-md font-semibold mb-2">
            Itens de "{selectedTemplate.title}"
            <span className="ml-2 text-xs font-normal text-gray-400">{templateItems?.length} item(s)</span>
          </h4>
          <div className="space-y-2 mb-2">
            {templateItems?.length === 0 && (
              <div className="text-gray-400 text-sm bg-gray-50 rounded p-2">Nenhum item cadastrado nesse template.</div>
            )}
            {templateItems?.map(item => (
              <div key={item.id} className="flex items-center gap-2 py-1 pl-1">
                <div className="flex-1">
                  <span className="font-medium">{item.title}</span>
                  {item.description && <span className="ml-2 text-xs text-gray-500">{item.description}</span>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteItemMutation.mutate(item.id)}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newItemTitle}
              onChange={e => setNewItemTitle(e.target.value)}
              placeholder="Novo item (ex: Criar landing page)"
            />
            <Input
              value={newItemDesc}
              onChange={e => setNewItemDesc(e.target.value)}
              placeholder="Descrição (opcional)"
            />
            <Button
              onClick={() => {
                if (!newItemTitle) { toast.error("Título obrigatório"); return; }
                addItemMutation.mutate({ title: newItemTitle, description: newItemDesc });
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
