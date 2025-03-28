
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSubscription(userId: string | undefined, forceAccept = false) {
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async (id: string, force = false) => {
    if (!id) {
      setHasSubscription(false);
      setLoading(false);
      return;
    }
    
    try {
      console.log(`Verificando assinatura para usuário ${id}`);
      
      let foundValidSubscription = false;
      
      try {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", id)
          .maybeSingle();

        if (error) {
          console.error("Erro ao verificar assinatura:", error);
          foundValidSubscription = false;
        } else if (data) {
          if (force) {
            console.log("Aceitando assinatura em qualquer estado devido a forceAccept");
            foundValidSubscription = true;
          } else {
            const isActive = data.status === 'active' || data.status === 'trialing';
            foundValidSubscription = isActive;
            console.log(`Status da assinatura: ${data.status}, isActive: ${isActive}`);
          }
        } else {
          console.log("Nenhuma assinatura encontrada para o usuário");
          foundValidSubscription = false;
        }
      } catch (err) {
        console.error("Erro na verificação de assinatura:", err);
        foundValidSubscription = false;
      }
      
      console.log(`Resultado da verificação de assinatura: ${foundValidSubscription}`);
      setHasSubscription(foundValidSubscription);
      setLoading(false);
    } catch (err) {
      console.error("Erro na verificação de assinatura:", err);
      setHasSubscription(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      checkSubscription(userId, forceAccept);
    }
  }, [userId, forceAccept]);

  return { hasSubscription, loading, checkSubscription };
}
