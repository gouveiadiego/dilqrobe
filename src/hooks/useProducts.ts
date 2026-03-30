import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

export const useProducts = () => {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error loading products:', error);
        toast.error('Erro ao carregar produtos');
        throw error;
      }
      
      return data as Product[];
    }
  });

  const addProductMutation = useMutation({
    mutationFn: async (newProduct: ProductInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const productWithUser = { ...newProduct, user_id: user.id };

      const { data, error } = await supabase
        .from('products')
        .insert([productWithUser])
        .select()
        .single();

      if (error) {
        console.error('Error adding product:', error);
        toast.error('Erro ao adicionar produto');
        throw error;
      }

      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto adicionado com sucesso');
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ProductUpdate }) => {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);

      if (error) {
        toast.error('Erro ao atualizar produto');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto atualizado com sucesso');
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error('Erro ao deletar produto');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto removido com sucesso');
    }
  });

  const bulkUpsertMutation = useMutation({
    mutationFn: async (products: ProductInsert[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Fetch existing products for the user (to match by multi-field identity)
      const { data: existingProducts } = await supabase
        .from('products')
        .select('*') // Getting all fields including potential size/color
        .eq('user_id', user.id);

      // 2. Create a lookup map (normalized composite key -> id)
      // Key format: "name|size|color" (all trimmed and lowercase)
      const identityMap = new Map();
      existingProducts?.forEach((p: any) => {
        const namePart = (p.name || '').trim().toLowerCase();
        const sizePart = (p.size || '').trim().toLowerCase();
        const colorPart = (p.color || '').trim().toLowerCase();
        const compositeKey = `${namePart}|${sizePart}|${colorPart}`;
        
        identityMap.set(compositeKey, p.id);
      });

      // 3. Process incoming products: Attach IDs and Deduplicate locally using the same composite logic
      const deduplicatedMap = new Map();
      
      products.forEach(p => {
        const namePart = (p.name || '').trim().toLowerCase();
        const sizePart = ((p as any).size || '').trim().toLowerCase();
        const colorPart = ((p as any).color || '').trim().toLowerCase();
        const compositeKey = `${namePart}|${sizePart}|${colorPart}`;
        
        const existingId = identityMap.get(compositeKey);
        
        const productToUpsert: any = {
          ...p,
          user_id: user.id
        };

        if (existingId) {
          productToUpsert.id = existingId;
        }

        // Use the compositeKey as the key to deduplicate within the spreadsheet itself
        deduplicatedMap.set(compositeKey, productToUpsert);
      });

      const finalProducts = Array.from(deduplicatedMap.values());

      // 4. Split into Updates and Inserts to avoid PostgREST null padding issues
      const toUpdate = finalProducts.filter(p => p.id);
      const toInsert = finalProducts.filter(p => !p.id);

      let results: any[] = [];

      if (toUpdate.length > 0) {
        const { data: updateData, error: updateError } = await supabase
          .from('products')
          .upsert(toUpdate)
          .select();
        
        if (updateError) throw updateError;
        if (updateData) results = [...results, ...updateData];
      }

      if (toInsert.length > 0) {
        const { data: insertData, error: insertError } = await supabase
          .from('products')
          .insert(toInsert)
          .select();
        
        if (insertError) throw insertError;
        if (insertData) results = [...results, ...insertData];
      }

      return results as Product[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produtos importados com sucesso');
    }
  });

  return {
    products,
    isLoading,
    addProduct: addProductMutation,
    updateProduct: updateProductMutation,
    deleteProduct: deleteProductMutation,
    bulkUpsert: bulkUpsertMutation,
  };
};
