
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface SubscriptionType {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  price_id: string | null;
  plan_type: string;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
  stripe_data?: {
    status: string;
    current_period_end: number;
    cancel_at_period_end: boolean;
  };
}

export function SubscriptionManager() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionType | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      
      // Get the current user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        console.error("Error getting user:", authError);
        return;
      }

      const userId = authData.user.id;
      
      // Call the get-subscription function
      const { data, error } = await supabase.functions.invoke('get-subscription', {
        query: { userId }
      });

      if (error) {
        console.error("Error fetching subscription:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da assinatura.",
          variant: "destructive",
        });
        return;
      }

      setSubscription(data.subscription);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao buscar os dados da assinatura.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (priceType: 'monthly' | 'yearly') => {
    try {
      setCheckoutLoading(true);
      
      // Get the current user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para assinar.",
          variant: "destructive",
        });
        return;
      }

      const userId = authData.user.id;
      
      // Generate the return URL (current origin)
      const returnUrl = window.location.origin;
      
      // Call the create-checkout function
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceType, 
          userId, 
          returnUrl 
        }
      });

      if (error) {
        console.error("Error creating checkout session:", error);
        toast({
          title: "Erro",
          description: "Não foi possível criar a sessão de pagamento.",
          variant: "destructive",
        });
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar a sessão de pagamento.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Handle the query parameters after returning from Stripe
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const sessionId = queryParams.get('session_id');
    const success = queryParams.get('success');
    const canceled = queryParams.get('canceled');

    // Remove query parameters
    if (sessionId || success || canceled) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }

    // Show toast based on the query parameters
    if (success === 'true') {
      toast({
        title: "Sucesso!",
        description: "Sua assinatura foi processada com sucesso!",
      });
      // Refresh subscription data
      fetchSubscription();
    } else if (canceled === 'true') {
      toast({
        title: "Cancelado",
        description: "O processo de assinatura foi cancelado.",
      });
    }
  }, []);

  const renderSubscriptionDetails = () => {
    if (!subscription) {
      return (
        <CardDescription>
          Você ainda não possui uma assinatura ativa.
        </CardDescription>
      );
    }

    return (
      <div className="space-y-2">
        <p><strong>Plano:</strong> {subscription.plan_type === 'yearly' ? 'Anual' : 'Mensal'}</p>
        <p><strong>Status:</strong> {getStatusTranslation(subscription.status)}</p>
        {subscription.trial_end && (
          <p><strong>Período de teste termina em:</strong> {formatDate(subscription.trial_end)}</p>
        )}
        {subscription.current_period_end && (
          <p><strong>Próxima cobrança:</strong> {formatDate(subscription.current_period_end)}</p>
        )}
      </div>
    );
  };

  const getStatusTranslation = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'trialing': return 'Em período de teste';
      case 'incomplete': return 'Incompleta';
      case 'incomplete_expired': return 'Expirada';
      case 'past_due': return 'Pagamento atrasado';
      case 'canceled': return 'Cancelada';
      case 'unpaid': return 'Não paga';
      default: return status;
    }
  };

  const isActiveOrTrialing = subscription?.status === 'active' || subscription?.status === 'trialing';

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Gerenciar Assinatura</CardTitle>
        <CardDescription>
          Gerencie sua assinatura e detalhes de pagamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : (
          renderSubscriptionDetails()
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {!isActiveOrTrialing && (
          <>
            <Button 
              onClick={() => createCheckoutSession('monthly')} 
              disabled={checkoutLoading} 
              className="w-full"
            >
              {checkoutLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Assinar Plano Mensal (R$19/mês)
            </Button>
            <Button 
              onClick={() => createCheckoutSession('yearly')} 
              disabled={checkoutLoading} 
              className="w-full"
            >
              {checkoutLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Assinar Plano Anual (R$190/ano)
            </Button>
          </>
        )}
        {isActiveOrTrialing && (
          <p className="text-center text-gray-600 dark:text-gray-400">
            Para gerenciar sua assinatura atual, acesse o portal de gerenciamento.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
