
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleApiError, handleSuccess } from "@/utils/errorHandler";
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

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      console.log("Fetching categories");
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }
      
      const transformedData = data.map(category => ({
        ...category,
        type: (category.type === "income" || category.type === "expense") ? category.type as CategoryType : undefined
      }));
      
      console.log("Fetched categories:", transformedData);
      return transformedData as Category[];
    }
  });

  const addCategoryMutation = useMutation({
    mutationFn: async ({ name, type }: { name: string; type?: CategoryType }) => {
      console.log("Adding category:", { name, type });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name,
          type: type, // This allows creating categories without a type (for tasks)
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error("Error adding category:", error);
        throw error;
      }

      return {
        ...data,
        type: (data.type === "income" || data.type === "expense") ? data.type as CategoryType : undefined
      } as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleSuccess('Categoria adicionada com sucesso');
    },
    onError: (error) => {
      handleApiError(error, 'Erro ao adicionar categoria');
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
        console.error("Error updating category:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleSuccess('Categoria atualizada com sucesso');
    },
    onError: (error) => {
      handleApiError(error, 'Erro ao atualizar categoria');
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting category:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      handleSuccess('Categoria excluída com sucesso');
    },
    onError: (error) => {
      handleApiError(error, 'Erro ao excluir categoria');
    }
  });

  return {
    categories,
    isLoading,
    addCategory: (params: { name: string; type?: CategoryType }) => {
      console.log("addCategory called with params:", params);
      if (!categories.some(cat => cat.name.toLowerCase() === params.name.toLowerCase())) {
        addCategoryMutation.mutate(params);
      } else {
        toast.error('Esta categoria já existe.');
      }
    },
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate
  };
};

