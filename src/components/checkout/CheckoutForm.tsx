
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CheckoutFormProps {
  priceId: string;
  productName: string;
  onSuccess?: () => void;
}

export function CheckoutForm({ priceId, productName, onSuccess }: CheckoutFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado para assinar um plano");
        return;
      }
      
      // Call the create-checkout-session edge function
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          userId: user.id,
          email: user.email,
          returnUrl: window.location.origin + '/success'
        }
      });
      
      if (error) {
        console.error('Error creating checkout session:', error);
        toast.error("Erro ao criar sessão de pagamento");
        return;
      }
      
      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        toast.error("Erro ao processar pagamento");
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error in handleSubscribe:', error);
      toast.error("Ocorreu um erro ao processar sua solicitação");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button 
      onClick={handleSubscribe} 
      disabled={loading}
      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        <>Assinar {productName}</>
      )}
    </Button>
  );
}
