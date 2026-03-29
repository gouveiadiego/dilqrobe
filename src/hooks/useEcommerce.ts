import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function useEcommerce() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    getUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ---- SUPPLIERS ----
  const suppliersQuery = useQuery({
    queryKey: ["ecommerce-suppliers", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("ecommerce_suppliers" as any)
        .select("*")
        .eq("user_id", userId)
        .order("name");
      if (error) throw error;
      return data as any[];
    },
    enabled: !!userId,
  });

  const addSupplier = useMutation({
    mutationFn: async (supplier: any) => {
      const { error } = await supabase
        .from("ecommerce_suppliers" as any)
        .insert({ ...supplier, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-suppliers"] });
      toast.success("Fornecedor adicionado!");
    },
    onError: () => toast.error("Erro ao adicionar fornecedor"),
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase
        .from("ecommerce_suppliers" as any)
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-suppliers"] });
      toast.success("Fornecedor atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar fornecedor"),
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ecommerce_suppliers" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-suppliers"] });
      toast.success("Fornecedor removido!");
    },
    onError: () => toast.error("Erro ao remover fornecedor"),
  });

  // ---- PRODUCTS ----
  const productsQuery = useQuery({
    queryKey: ["ecommerce-products", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("ecommerce_products" as any)
        .select("*")
        .eq("user_id", userId)
        .order("code");
      if (error) throw error;
      return data as any[];
    },
    enabled: !!userId,
  });

  const addProduct = useMutation({
    mutationFn: async (product: any) => {
      const { error } = await supabase
        .from("ecommerce_products" as any)
        .insert({ ...product, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-products"] });
      toast.success("Produto adicionado!");
    },
    onError: () => toast.error("Erro ao adicionar produto"),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase
        .from("ecommerce_products" as any)
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-products"] });
      toast.success("Produto atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar produto"),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ecommerce_products" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-products"] });
      toast.success("Produto removido!");
    },
    onError: () => toast.error("Erro ao remover produto"),
  });

  // ---- SALES ----
  const salesQuery = useQuery({
    queryKey: ["ecommerce-sales", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("ecommerce_sales" as any)
        .select("*")
        .eq("user_id", userId)
        .order("sale_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!userId,
  });

  const addSale = useMutation({
    mutationFn: async (sale: any) => {
      const { error } = await supabase
        .from("ecommerce_sales" as any)
        .insert({ ...sale, user_id: userId });
      if (error) throw error;
      // Update product qty_sold
      if (sale.product_id && sale.quantity) {
        const product = (productsQuery.data || []).find((p: any) => p.id === sale.product_id);
        if (product) {
          await supabase
            .from("ecommerce_products" as any)
            .update({ qty_sold: (product.qty_sold || 0) + sale.quantity })
            .eq("id", sale.product_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-sales"] });
      queryClient.invalidateQueries({ queryKey: ["ecommerce-products"] });
      toast.success("Venda registrada!");
    },
    onError: () => toast.error("Erro ao registrar venda"),
  });

  const deleteSale = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ecommerce_sales" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-sales"] });
      queryClient.invalidateQueries({ queryKey: ["ecommerce-products"] });
      toast.success("Venda removida!");
    },
    onError: () => toast.error("Erro ao remover venda"),
  });

  // ---- BONIFICATIONS ----
  const bonificationsQuery = useQuery({
    queryKey: ["ecommerce-bonifications", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("ecommerce_bonifications" as any)
        .select("*")
        .eq("user_id", userId)
        .order("bonification_date", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!userId,
  });

  const addBonification = useMutation({
    mutationFn: async (bonif: any) => {
      const { error } = await supabase
        .from("ecommerce_bonifications" as any)
        .insert({ ...bonif, user_id: userId });
      if (error) throw error;
      // Update product qty_gifted
      if (bonif.product_id && bonif.quantity) {
        const product = (productsQuery.data || []).find((p: any) => p.id === bonif.product_id);
        if (product) {
          await supabase
            .from("ecommerce_products" as any)
            .update({ qty_gifted: (product.qty_gifted || 0) + bonif.quantity })
            .eq("id", bonif.product_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-bonifications"] });
      queryClient.invalidateQueries({ queryKey: ["ecommerce-products"] });
      toast.success("Bonificação registrada!");
    },
    onError: () => toast.error("Erro ao registrar bonificação"),
  });

  const deleteBonification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ecommerce_bonifications" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-bonifications"] });
      queryClient.invalidateQueries({ queryKey: ["ecommerce-products"] });
      toast.success("Bonificação removida!");
    },
    onError: () => toast.error("Erro ao remover bonificação"),
  });

  return {
    suppliers: suppliersQuery.data || [],
    suppliersLoading: suppliersQuery.isLoading,
    addSupplier,
    updateSupplier,
    deleteSupplier,

    products: productsQuery.data || [],
    productsLoading: productsQuery.isLoading,
    addProduct,
    updateProduct,
    deleteProduct,

    sales: salesQuery.data || [],
    salesLoading: salesQuery.isLoading,
    addSale,
    deleteSale,

    bonifications: bonificationsQuery.data || [],
    bonificationsLoading: bonificationsQuery.isLoading,
    addBonification,
    deleteBonification,
  };
}
