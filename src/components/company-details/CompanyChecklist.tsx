
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChecklistItem {
  id: string;
  company_id: string;
  title: string;
  completed: boolean;
  created_at: string;
  category: string | null;
}

interface CompanyChecklistProps {
  companyId: string;
}

export function CompanyChecklist({ companyId }: CompanyChecklistProps) {
  const [newItemText, setNewItemText] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<string>("geral");
  const [categories, setCategories] = useState<string[]>(["geral", "design", "desenvolvimento", "conteúdo", "seo"]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const queryClient = useQueryClient();

  // Inicializa todas as categorias como expandidas
  useEffect(() => {
    const expanded: Record<string, boolean> = {};
    categories.forEach(cat => {
      expanded[cat] = true;
    });
    setExpandedCategories(expanded);
  }, [categories]);

  const { data: checklistItems = [], isLoading } = useQuery({
    queryKey: ['company-checklist', companyId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('project_checklist')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error('Erro ao carregar checklist');
        throw error;
      }
      
      return data || [];
    }
  });

  const addItemMutation = useMutation({
    mutationFn: async ({ title, category }: { title: string, category: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const newItem = {
        company_id: companyId,
        title,
        category,
        completed: false,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('project_checklist')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setNewItemText("");
      queryClient.invalidateQueries({ queryKey: ['company-checklist', companyId] });
      toast.success('Item adicionado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao adicionar item');
      console.error(error);
    }
  });

  const toggleItemMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from('project_checklist')
        .update({ completed })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-checklist', companyId] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar item');
      console.error(error);
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_checklist')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-checklist', companyId] });
      toast.success('Item removido com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao remover item');
      console.error(error);
    }
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemText.trim()) {
      addItemMutation.mutate({
        title: newItemText.trim(),
        category: newItemCategory
      });
    }
  };

  const handleToggleItem = (id: string, currentStatus: boolean) => {
    toggleItemMutation.mutate({ id, completed: !currentStatus });
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("Tem certeza que deseja remover este item?")) {
      deleteItemMutation.mutate(id);
    }
  };

  const handleAddCustomCategory = () => {
    if (customCategory.trim() && !categories.includes(customCategory.trim())) {
      setCategories([...categories, customCategory.trim()]);
      setNewItemCategory(customCategory.trim());
      setCustomCategory("");
      setShowCustomCategoryInput(false);
    }
  };

  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category]
    });
  };

  // Agrupar itens por categoria
  const groupedItems = checklistItems.reduce((acc: Record<string, ChecklistItem[]>, item) => {
    const category = item.category || "geral";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  // Garantir que todas as categorias existentes estejam no estado de categorias
  useEffect(() => {
    const existingCategories = Object.keys(groupedItems).filter(cat => cat && !categories.includes(cat));
    if (existingCategories.length > 0) {
      setCategories([...categories, ...existingCategories]);
    }
  }, [checklistItems]);

  if (isLoading) return <div>Carregando checklist...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Checklist do Projeto</h3>
      
      <form onSubmit={handleAddItem} className="flex flex-col space-y-2">
        <div className="flex space-x-2">
          <Input 
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Adicionar nova tarefa..."
            className="flex-1"
          />
          <Button type="submit">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
        
        <div className="flex space-x-2 items-center">
          <Label htmlFor="category" className="w-24">Categoria:</Label>
          {showCustomCategoryInput ? (
            <div className="flex-1 flex space-x-2">
              <Input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Nova categoria..."
                className="flex-1"
              />
              <Button type="button" onClick={handleAddCustomCategory} variant="outline" size="sm">
                Adicionar
              </Button>
              <Button type="button" onClick={() => setShowCustomCategoryInput(false)} variant="outline" size="sm">
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex space-x-2">
              <Select
                value={newItemCategory}
                onValueChange={setNewItemCategory}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                onClick={() => setShowCustomCategoryInput(true)} 
                variant="outline" 
                size="sm"
              >
                Nova
              </Button>
            </div>
          )}
        </div>
      </form>

      <div className="space-y-4">
        {checklistItems.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhum item na checklist ainda.</p>
        ) : (
          Object.keys(groupedItems).sort().map((category) => (
            <div key={category} className="border rounded-lg overflow-hidden">
              <div 
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
                onClick={() => toggleCategoryExpansion(category)}
              >
                <h4 className="font-medium text-gray-700">
                  {expandedCategories[category] ? <ChevronDown className="inline h-4 w-4 mr-1" /> : <ChevronRight className="inline h-4 w-4 mr-1" />}
                  {category.charAt(0).toUpperCase() + category.slice(1)} ({groupedItems[category].length})
                </h4>
                <div className="text-xs text-gray-500">
                  {groupedItems[category].filter(item => item.completed).length} de {groupedItems[category].length} completos
                </div>
              </div>
              
              {expandedCategories[category] && (
                <div className="space-y-1 p-2 bg-white">
                  {groupedItems[category].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center space-x-2 flex-1">
                        <Checkbox 
                          id={`check-${item.id}`}
                          checked={item.completed}
                          onCheckedChange={() => handleToggleItem(item.id, item.completed)}
                        />
                        <Label 
                          htmlFor={`check-${item.id}`}
                          className={`${item.completed ? 'line-through text-gray-500' : ''} cursor-pointer`}
                        >
                          {item.title}
                        </Label>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
