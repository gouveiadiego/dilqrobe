
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Subscription {
  id: string;
  status: string;
  productName: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export function SubscriptionManager() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado para visualizar sua assinatura");
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('get-subscription', {
        body: { // Changed from query to body
          userId: user.id
        }
      });
      
      if (error) {
        console.error('Error fetching subscription:', error);
        toast.error("Erro ao buscar informações da assinatura");
        return;
      }
      
      setSubscription(data);
    } catch (error) {
      console.error('Error in fetchSubscription:', error);
      toast.error("Ocorreu um erro ao carregar sua assinatura");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCanceling(true);
      
      if (!subscription) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado para cancelar sua assinatura");
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { // Changed from query to body
          subscriptionId: subscription.id,
          userId: user.id
        }
      });
      
      if (error) {
        console.error('Error canceling subscription:', error);
        toast.error("Erro ao cancelar assinatura");
        return;
      }
      
      toast.success("Assinatura cancelada com sucesso");
      fetchSubscription(); // Refresh subscription data
    } catch (error) {
      console.error('Error in handleCancelSubscription:', error);
      toast.error("Ocorreu um erro ao cancelar sua assinatura");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl">Nenhuma assinatura ativa</CardTitle>
          <CardDescription>
            Você ainda não possui uma assinatura ativa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            <p>Assine um de nossos planos para ter acesso completo</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => window.location.href = '/#pricing'}>
            Ver planos disponíveis
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={subscription.status === 'active' ? 'border-green-200' : 'border-amber-200'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {subscription.status === 'active' ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Assinatura Ativa</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span>Assinatura {subscription.status}</span>
            </>
          )}
        </CardTitle>
        <CardDescription>
          Plano: {subscription.productName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Período atual termina em:
          </div>
          <div>
            {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
          </div>
        </div>
        
        {subscription.cancelAtPeriodEnd && (
          <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">
            Sua assinatura será cancelada no final do período atual
          </div>
        )}
      </CardContent>
      <CardFooter>
        {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
          <Button 
            variant="outline" 
            onClick={handleCancelSubscription}
            disabled={canceling}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            {canceling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              <>Cancelar assinatura</>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
