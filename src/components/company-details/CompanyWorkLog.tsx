
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, CheckSquare, FileText, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WorkLogEntry {
  id: string;
  company_id: string;
  user_id: string;
  checklist_item_id: string | null;
  title: string;
  description: string | null;
  completed_at: string;
  category: string | null;
  month_year: string;
  created_at: string;
}

interface CompanyWorkLogProps {
  companyId: string;
}

export function CompanyWorkLog({ companyId }: CompanyWorkLogProps) {
  const [newEntryTitle, setNewEntryTitle] = useState("");
  const [newEntryDescription, setNewEntryDescription] = useState("");
  const [newEntryCategory, setNewEntryCategory] = useState("geral");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingCategory, setEditingCategory] = useState("");
  const queryClient = useQueryClient();

  const categories = ["geral", "design", "desenvolvimento", "conteúdo", "seo", "reunião", "planejamento"];

  // Buscar entradas do diário de bordo
  const { data: workLogEntries = [], isLoading } = useQuery({
    queryKey: ['company-work-log', companyId, selectedMonth],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('company_work_log')
        .select('*')
        .eq('company_id', companyId)
        .eq('month_year', selectedMonth)
        .order('completed_at', { ascending: false });
      
      if (error) {
        toast.error('Erro ao carregar diário de bordo');
        throw error;
      }
      
      return data || [];
    }
  });

  // Buscar lista de meses disponíveis
  const { data: availableMonths = [] } = useQuery({
    queryKey: ['company-work-log-months', companyId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('company_work_log')
        .select('month_year')
        .eq('company_id', companyId)
        .order('month_year', { ascending: false });
      
      if (error) throw error;
      
      // Remover duplicatas e retornar lista única
      const uniqueMonths = [...new Set(data?.map(entry => entry.month_year) || [])];
      return uniqueMonths;
    }
  });

  // Adicionar nova entrada manual
  const addEntryMutation = useMutation({
    mutationFn: async ({ title, description, category }: { title: string, description: string, category: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const newEntry = {
        company_id: companyId,
        user_id: user.id,
        title,
        description,
        category,
        month_year: selectedMonth
      };

      const { data, error } = await supabase
        .from('company_work_log')
        .insert([newEntry])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setNewEntryTitle("");
      setNewEntryDescription("");
      setNewEntryCategory("geral");
      queryClient.invalidateQueries({ queryKey: ['company-work-log', companyId, selectedMonth] });
      queryClient.invalidateQueries({ queryKey: ['company-work-log-months', companyId] });
      toast.success('Entrada adicionada ao diário de bordo');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar entrada');
      console.error(error);
    }
  });

  // Editar entrada
  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, title, description, category }: { id: string; title: string; description: string; category: string }) => {
      const { error } = await supabase
        .from('company_work_log')
        .update({ title, description, category })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      setEditingEntryId(null);
      queryClient.invalidateQueries({ queryKey: ['company-work-log', companyId, selectedMonth] });
      toast.success('Entrada atualizada');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar entrada');
      console.error(error);
    }
  });

  // Deletar entrada
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('company_work_log')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-work-log', companyId, selectedMonth] });
      queryClient.invalidateQueries({ queryKey: ['company-work-log-months', companyId] });
      toast.success('Entrada removida');
    },
    onError: (error) => {
      toast.error('Erro ao remover entrada');
      console.error(error);
    }
  });

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEntryTitle.trim()) {
      addEntryMutation.mutate({
        title: newEntryTitle.trim(),
        description: newEntryDescription.trim(),
        category: newEntryCategory
      });
    }
  };

  const handleEditEntry = (entry: WorkLogEntry) => {
    setEditingEntryId(entry.id);
    setEditingTitle(entry.title);
    setEditingDescription(entry.description || "");
    setEditingCategory(entry.category || "geral");
  };

  const handleSaveEdit = (id: string) => {
    if (editingTitle.trim()) {
      updateEntryMutation.mutate({
        id,
        title: editingTitle.trim(),
        description: editingDescription.trim(),
        category: editingCategory
      });
    }
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm("Tem certeza que deseja remover esta entrada?")) {
      deleteEntryMutation.mutate(id);
    }
  };

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case 'design': return '🎨';
      case 'desenvolvimento': return '💻';
      case 'conteúdo': return '📝';
      case 'seo': return '🔍';
      case 'reunião': return '🤝';
      case 'planejamento': return '📋';
      default: return '📌';
    }
  };

  if (isLoading) return <div>Carregando diário de bordo...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Diário de Bordo</h3>
        <div className="flex items-center space-x-2">
          <Label htmlFor="month-select">Mês:</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {format(new Date(month + '-01'), "MMMM 'de' yyyy", { locale: pt })}
                </SelectItem>
              ))}
              {!availableMonths.includes(format(new Date(), "yyyy-MM")) && (
                <SelectItem value={format(new Date(), "yyyy-MM")}>
                  {format(new Date(), "MMMM 'de' yyyy", { locale: pt })} (atual)
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Formulário para adicionar nova entrada manual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Entrada Manual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddEntry} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={newEntryTitle}
                  onChange={(e) => setNewEntryTitle(e.target.value)}
                  placeholder="O que foi feito..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={newEntryCategory} onValueChange={setNewEntryCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={newEntryDescription}
                onChange={(e) => setNewEntryDescription(e.target.value)}
                placeholder="Descreva detalhes do que foi realizado..."
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Entrada
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de entradas do diário */}
      <div className="space-y-4">
        {workLogEntries.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma entrada no diário para este mês ainda.</p>
              <p className="text-sm">As tarefas concluídas no checklist aparecerão aqui automaticamente.</p>
            </CardContent>
          </Card>
        ) : (
          workLogEntries.map((entry) => (
            <Card key={entry.id} className="relative">
              <CardContent className="p-4">
                {editingEntryId === entry.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Título</Label>
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Categoria</Label>
                        <Select value={editingCategory} onValueChange={setEditingCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => handleSaveEdit(entry.id)}>
                        <Save className="h-4 w-4 mr-1" />
                        Salvar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingEntryId(null)}>
                        <X className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getCategoryIcon(entry.category)}</span>
                        <h4 className="font-medium">{entry.title}</h4>
                        {entry.checklist_item_id && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckSquare className="h-3 w-3 mr-1" />
                            Checklist
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditEntry(entry)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteEntry(entry.id)}>
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    
                    {entry.description && (
                      <p className="text-gray-600 mb-3 whitespace-pre-wrap">{entry.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(entry.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                        </div>
                        {entry.category && (
                          <Badge variant="outline" className="text-xs">
                            {entry.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
