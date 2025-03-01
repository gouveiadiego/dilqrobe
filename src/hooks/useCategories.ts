
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
      console.log("Fetching categories");
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.error("Error fetching categories:", error);
        toast.error('Erro ao carregar categorias');
        throw error;
      }
      
      // Transform the data to ensure type is CategoryType
      const transformedData = data.map(category => ({
        ...category,
        // Ensure type is either "expense" or "income", defaulting to "expense"
        type: (category.type === "income" ? "income" : "expense") as CategoryType
      }));
      
      console.log("Fetched categories:", transformedData);
      return transformedData as Category[];
    }
  });

  const addCategoryMutation = useMutation({
    mutationFn: async ({ name, type }: { name: string; type?: CategoryType }) => {
      // Log the parameters to debug
      console.log("Adding category:", { name, type });
      
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
        console.error("Error adding category:", error);
        toast.error('Erro ao adicionar categoria');
        throw error;
      }

      // Transform to ensure type compatibility
      return {
        ...data,
        type: (data.type === "income" ? "income" : "expense") as CategoryType
      } as Category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoria adicionada com sucesso');
    },
    onError: (error) => {
      console.error("Mutation error:", error);
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
        console.error("Error deleting category:", error);
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
      console.log("addCategory called with params:", params);
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
