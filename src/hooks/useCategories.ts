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
  project_company_id?: string | null;
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
    mutationFn: async ({ name, type, project_company_id }: { name: string; type?: CategoryType, project_company_id?: string | null }) => {
      console.log("Adding category:", { name, type, project_company_id });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name,
          type: type, // This allows creating categories without a type (for tasks)
          user_id: user.id,
          project_company_id
        }])
        .select()
        .single();

      if (error) {
        console.error("Error adding category:", error);
        throw error;
      }

      return {
        ...data,
        type: (data.type === "income" || data.type === "expense") ? data.type as CategoryType : undefined,
        project_company_id: data.project_company_id
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
    mutationFn: async ({ id, name, type, project_company_id }: { id: string; name?: string; type?: CategoryType, project_company_id?: string | null }) => {
      const updates: { name?: string; type?: CategoryType; project_company_id?: string | null } = {};
      if (name) updates.name = name;
      if (type) updates.type = type;
      if (project_company_id !== undefined) updates.project_company_id = project_company_id;

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
    addCategory: (params: { name: string; type?: CategoryType; project_company_id?: string | null }) => {
      console.log("addCategory called with params:", params);
      const categoryExists = categories.some(cat => 
        cat.name.toLowerCase() === params.name.toLowerCase() &&
        (cat.project_company_id || null) === (params.project_company_id || null) &&
        (!cat.type && !params.type || cat.type === params.type)
      );
      if (!categoryExists) {
        addCategoryMutation.mutate(params);
      } else {
        toast.error('Esta categoria já existe.');
      }
    },
    updateCategory: updateCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate
  };
};
