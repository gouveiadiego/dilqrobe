import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronDown, ChevronRight, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { useTasks } from "@/hooks/useTasks";
import { CategoryManager } from "@/components/CategoryManager";
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
export function CompanyChecklist({
  companyId
}: CompanyChecklistProps) {
  const [newItemText, setNewItemText] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<string>("geral");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemText, setEditingItemText] = useState("");
  const [editingItemCategory, setEditingItemCategory] = useState("");
  const queryClient = useQueryClient();

  // Hook para categorias do banco de dados
  const {
    categories: allCategories,
    addCategory,
    updateCategory,
    deleteCategory
  } = useCategories();

  // Hook para sincronização com tasks
  const {
    syncChecklistCompletionWithTasks
  } = useTasks();

  // Filtrar categorias desta empresa específica + categorias padrão de projeto
  const projectCategories = allCategories.filter(cat => !cat.type && cat.project_company_id === companyId);
  const projectCategoryNames = projectCategories.map(cat => cat.name);

  // Categorias padrão caso não existam categorias criadas
  const defaultCategories = ["geral", "design", "desenvolvimento", "conteúdo", "seo"];
  const availableCategories = projectCategoryNames.length > 0 ? projectCategoryNames : defaultCategories;

  // Inicializa todas as categorias como expandidas
  useEffect(() => {
    const expanded: Record<string, boolean> = {};
    availableCategories.forEach(cat => {
      expanded[cat] = true;
    });
    setExpandedCategories(expanded);
  }, [availableCategories]);
  const {
    data: checklistItems = [],
    isLoading
  } = useQuery({
    queryKey: ['company-checklist', companyId],
    queryFn: async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const {
        data,
        error
      } = await supabase.from('project_checklist').select('*').eq('company_id', companyId).order('created_at', {
        ascending: false
      });
      if (error) {
        toast.error('Erro ao carregar checklist');
        throw error;
      }
      return data || [];
    }
  });
  const addItemMutation = useMutation({
    mutationFn: async ({
      title,
      category
    }: {
      title: string;
      category: string;
    }) => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const newItem = {
        company_id: companyId,
        title,
        category,
        completed: false,
        user_id: user.id
      };
      const {
        data,
        error
      } = await supabase.from('project_checklist').insert([newItem]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setNewItemText("");
      queryClient.invalidateQueries({
        queryKey: ['company-checklist', companyId]
      });
      toast.success('Item adicionado com sucesso');
    },
    onError: error => {
      toast.error('Erro ao adicionar item');
      console.error(error);
    }
  });
  const toggleItemMutation = useMutation({
    mutationFn: async ({
      id,
      completed,
      title
    }: {
      id: string;
      completed: boolean;
      title: string;
    }) => {
      const {
        error
      } = await supabase.from('project_checklist').update({
        completed
      }).eq('id', id);
      if (error) throw error;

      // Sync with corresponding tasks
      await syncChecklistCompletionWithTasks(title, completed, companyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-checklist', companyId]
      });
      queryClient.invalidateQueries({
        queryKey: ['tasks']
      });
    },
    onError: error => {
      toast.error('Erro ao atualizar item');
      console.error(error);
    }
  });
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from('project_checklist').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-checklist', companyId]
      });
      toast.success('Item removido com sucesso');
    },
    onError: error => {
      toast.error('Erro ao remover item');
      console.error(error);
    }
  });
  const updateItemMutation = useMutation({
    mutationFn: async ({
      id,
      title,
      category
    }: {
      id: string;
      title: string;
      category: string;
    }) => {
      const {
        error
      } = await supabase.from('project_checklist').update({
        title,
        category
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingItemId(null);
      queryClient.invalidateQueries({
        queryKey: ['company-checklist', companyId]
      });
      toast.success('Item atualizado com sucesso');
    },
    onError: error => {
      toast.error('Erro ao atualizar item');
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
  const handleToggleItem = (id: string, currentStatus: boolean, title: string) => {
    toggleItemMutation.mutate({
      id,
      completed: !currentStatus,
      title
    });
  };
  const handleDeleteItem = (id: string) => {
    if (confirm("Tem certeza que deseja remover este item?")) {
      deleteItemMutation.mutate(id);
    }
  };
  const handleEditItem = (item: ChecklistItem) => {
    setEditingItemId(item.id);
    setEditingItemText(item.title);
    setEditingItemCategory(item.category || "geral");
  };
  const handleSaveEdit = (id: string) => {
    if (editingItemText.trim()) {
      updateItemMutation.mutate({
        id,
        title: editingItemText.trim(),
        category: editingItemCategory
      });
    } else {
      toast.error('O texto do item não pode estar vazio');
    }
  };
  const handleCancelEdit = () => {
    setEditingItemId(null);
  };
  const handleAddCustomCategory = () => {
    if (customCategory.trim() && !availableCategories.includes(customCategory.trim())) {
      // Salvar a nova categoria no banco de dados
      addCategory({
        name: customCategory.trim(),
        project_company_id: companyId
      });
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

  // Combinar categorias disponíveis com categorias que já têm itens (mas podem não estar no banco)
  const allCategoriesWithItems = [...new Set([...availableCategories, ...Object.keys(groupedItems)])];
  if (isLoading) return <div>Carregando checklist...</div>;
  return <div className="space-y-4">
      <h3 className="text-lg font-medium">Checklist do Projeto</h3>
      
      {/* Gerenciador de Categorias */}
      <CategoryManager categories={projectCategories} onAddCategory={params => addCategory({
      ...params,
      project_company_id: companyId
    })} onUpdateCategory={updateCategory} onDeleteCategory={deleteCategory} categoryStats={Object.keys(groupedItems).reduce((acc, category) => {
      const items = groupedItems[category];
      acc[category] = {
        total: items.length,
        completed: items.filter(item => item.completed).length
      };
      return acc;
    }, {} as Record<string, {
      total: number;
      completed: number;
    }>)} />
      
      <form onSubmit={handleAddItem} className="flex flex-col space-y-2">
        <div className="flex space-x-2">
          <Input value={newItemText} onChange={e => setNewItemText(e.target.value)} placeholder="Adicionar nova tarefa..." className="flex-1" />
          <Button type="submit">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
        
        <div className="flex space-x-2 items-center">
          <Label htmlFor="category" className="w-24">Categoria:</Label>
          {showCustomCategoryInput ? <div className="flex-1 flex space-x-2">
              <Input value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="Nova categoria..." className="flex-1" />
              <Button type="button" onClick={handleAddCustomCategory} variant="outline" size="sm">
                Adicionar
              </Button>
              <Button type="button" onClick={() => setShowCustomCategoryInput(false)} variant="outline" size="sm">
                Cancelar
              </Button>
            </div> : <div className="flex-1 flex space-x-2">
              <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {allCategoriesWithItems.map(category => <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="button" onClick={() => setShowCustomCategoryInput(true)} variant="outline" size="sm">
                Nova
              </Button>
            </div>}
        </div>
      </form>

      <div className="space-y-4">
        {checklistItems.length === 0 ? <p className="text-gray-500 text-center py-4">Nenhum item na checklist ainda.</p> : Object.keys(groupedItems).sort().map(category => <div key={category} className="border rounded-lg overflow-hidden">
              
              
              {expandedCategories[category] && <div className="space-y-1 p-2 bg-white">
                  {groupedItems[category].map(item => <div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      {editingItemId === item.id ? <div className="flex items-center space-x-2 flex-1">
                          <div className="flex-1 flex flex-col space-y-2">
                            <Input value={editingItemText} onChange={e => setEditingItemText(e.target.value)} className="flex-1" />
                            <Select value={editingItemCategory} onValueChange={setEditingItemCategory}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                               <SelectContent>
                                 {allCategoriesWithItems.map(cat => <SelectItem key={cat} value={cat}>
                                     {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                   </SelectItem>)}
                               </SelectContent>
                            </Select>
                          </div>
                          <div className="flex space-x-1">
                            <Button variant="outline" size="sm" onClick={() => handleSaveEdit(item.id)}>
                              <Save className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div> : <>
                          <div className="flex items-center space-x-2 flex-1">
                            <Checkbox id={`check-${item.id}`} checked={item.completed} onCheckedChange={() => handleToggleItem(item.id, item.completed, item.title)} />
                            <Label htmlFor={`check-${item.id}`} className={`${item.completed ? 'line-through text-gray-500' : ''} cursor-pointer`}>
                              {item.title}
                            </Label>
                          </div>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)}>
                              <Edit className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </>}
                    </div>)}
                </div>}
            </div>)}
      </div>
    </div>;
}