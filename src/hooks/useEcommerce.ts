import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useEcommerce = () => {
  const queryClient = useQueryClient();

  // Suppliers
  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ["ecommerce_suppliers"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("ecommerce_suppliers")
        .select("*")
        .eq('user_id', user.id)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const addSupplier = useMutation({
    mutationFn: async (newSupplier: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("ecommerce_suppliers")
        .insert([{ ...newSupplier, user_id: user.id }])
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce_suppliers"] });
      toast.success("Fornecedor cadastrado com sucesso!");
    },
  });

  // Sales
  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ["ecommerce_sales"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("ecommerce_sales")
        .select("*, products(name, sku, size, color)")
        .eq('user_id', user.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addSale = useMutation({
    mutationFn: async (newSale: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("ecommerce_sales")
        .insert([{ ...newSale, user_id: user.id }])
        .select();
      if (error) throw error;
      
      // Update product stock
      if (newSale.product_id && newSale.quantity) {
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", newSale.product_id)
          .single();
        
        if (product) {
          await supabase
            .from("products")
            .update({ stock_quantity: product.stock_quantity - newSale.quantity })
            .eq("id", newSale.product_id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce_sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Venda registrada com sucesso!");
    },
  });

  // Bonuses
  const { data: bonuses = [], isLoading: loadingBonuses } = useQuery({
    queryKey: ["ecommerce_bonuses"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("ecommerce_bonuses")
        .select("*, products(name, sku, size, color)")
        .eq('user_id', user.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addBonus = useMutation({
    mutationFn: async (newBonus: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("ecommerce_bonuses")
        .insert([{ ...newBonus, user_id: user.id }])
        .select();
      if (error) throw error;

      // Update product stock for bonus (decrement)
      if (newBonus.product_id && newBonus.quantity) {
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", newBonus.product_id)
          .single();
        
        if (product) {
          await supabase
            .from("products")
            .update({ stock_quantity: product.stock_quantity - newBonus.quantity })
            .eq("id", newBonus.product_id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce_bonuses"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Bonificação registrada!");
    },
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ecommerce_suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce_suppliers"] });
      toast.success("Fornecedor excluído.");
    },
  });

  return {
    suppliers,
    loadingSuppliers,
    addSupplier,
    deleteSupplier,
    sales,
    loadingSales,
    addSale,
    bonuses,
    loadingBonuses,
    addBonus,
  };
};
