
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  company_id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

interface CompanyChecklistProps {
  companyId: string;
}

export function CompanyChecklist({ companyId }: CompanyChecklistProps) {
  const [newItemText, setNewItemText] = useState("");
  const queryClient = useQueryClient();

  const { data: checklistItems = [], isLoading } = useQuery({
    queryKey: ['company-checklist', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_checklist')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error('Erro ao carregar checklist');
        throw error;
      }
      
      return data as ChecklistItem[];
    }
  });

  const addItemMutation = useMutation({
    mutationFn: async (title: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const newItem = {
        company_id: companyId,
        title,
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
      addItemMutation.mutate(newItemText.trim());
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

  if (isLoading) return <div>Carregando checklist...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Checklist do Projeto</h3>
      
      <form onSubmit={handleAddItem} className="flex space-x-2">
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
      </form>

      <div className="space-y-2">
        {checklistItems.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nenhum item na checklist ainda.</p>
        ) : (
          checklistItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded-md bg-white">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id={`check-${item.id}`}
                  checked={item.completed}
                  onCheckedChange={() => handleToggleItem(item.id, item.completed)}
                />
                <Label 
                  htmlFor={`check-${item.id}`}
                  className={`${item.completed ? 'line-through text-gray-500' : ''}`}
                >
                  {item.title}
                </Label>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
