
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CategoryType = "expense" | "income";

export interface Category {
  id: string;
  name: string;
  type?: CategoryType;
  user_id?: string;
}

export const useCategories = () => {
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        toast.error('Erro ao carregar categorias');
        throw error;
      }
      
      return data;
    }
  });

  const addCategoryMutation = useMutation({
    mutationFn: async ({ name, type }: { name: string; type?: CategoryType }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name,
          type: type || 'expense', // Default to expense if not specified
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        toast.error('Erro ao adicionar categoria');
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria adicionada com sucesso');
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name, type }: { id: string; name?: string; type?: CategoryType }) => {
      const updates: { name?: string; type?: CategoryType } = {};
      if (name) updates.name = name;
      if (type) updates.type = type;

      const { error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id);

      if (error) {
        toast.error('Erro ao atualizar categoria');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria atualizada com sucesso');
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Erro ao excluir categoria');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria excluída com sucesso');
    }
  });

  return {
    categories,
    addCategory: (params: { name: string; type?: CategoryType }) => {
      if (!categories.some(cat => cat.name === params.name)) {
        addCategoryMutation.mutate(params);
      } else {
        toast.error('Esta categoria já existe');
      }
    },
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate
  };
};
