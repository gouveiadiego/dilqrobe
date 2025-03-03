
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type SubscriptionStatus = 'loading' | 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'none';

type SubscriptionData = {
  status: SubscriptionStatus;
  plan_type?: string;
  current_period_end?: string;
  trial_end?: string;
};

export function SubscriptionManager() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      
      // Get subscription data
      const { data, error } = await supabase.functions.invoke('get-subscription', {
        body: {}
      });

      if (error) {
        console.error("Error fetching subscription:", error);
        toast.error("Não foi possível obter os dados da assinatura");
        setSubscription({ status: 'none' });
        return;
      }

      if (!data || !data.subscription) {
        setSubscription({ status: 'none' });
        return;
      }

      setSubscription(data.subscription);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ocorreu um erro ao carregar sua assinatura");
      setSubscription({ status: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCancelLoading(true);

      // Call the cancel-subscription function
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: {}
      });

      if (error) {
        console.error("Error canceling subscription:", error);
        toast.error("Não foi possível cancelar a assinatura");
        return;
      }

      toast.success("Assinatura cancelada com sucesso");
      fetchSubscription(); // Refresh subscription data
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ocorreu um erro ao cancelar sua assinatura");
    } finally {
      setCancelLoading(false);
    }
  };

  const renderSubscriptionStatus = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
          <p className="text-gray-500">Carregando informações da assinatura...</p>
        </div>
      );
    }

    if (!subscription || subscription.status === 'none') {
      return (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Sem assinatura ativa</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Você não possui uma assinatura ativa no momento.
          </p>
          <Button onClick={() => navigate('/')}>Ver planos disponíveis</Button>
        </div>
      );
    }

    const isActive = subscription.status === 'active' || subscription.status === 'trialing';
    const isCanceled = subscription.status === 'canceled';
    
    return (
      <div className="text-center py-6">
        {isActive ? (
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
        ) : (
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        )}
        
        <h3 className="text-xl font-semibold mb-2">
          {isActive 
            ? subscription.status === 'trialing' 
              ? 'Em período de teste' 
              : 'Assinatura ativa'
            : isCanceled 
              ? 'Assinatura cancelada' 
              : 'Assinatura com problema'}
        </h3>
        
        <div className="space-y-4 mb-6">
          {subscription.plan_type && (
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">Plano:</span> {subscription.plan_type === 'yearly' ? 'Anual' : 'Mensal'}
            </p>
          )}
          
          {subscription.status === 'trialing' && subscription.trial_end && (
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">Período de teste termina em:</span> {new Date(subscription.trial_end).toLocaleDateString('pt-BR')}
            </p>
          )}
          
          {subscription.current_period_end && (
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">Próxima cobrança:</span> {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
            </p>
          )}
          
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">Status:</span> {subscription.status}
          </p>
        </div>
        
        {isActive && (
          <Button 
            variant="destructive" 
            onClick={handleCancelSubscription}
            disabled={cancelLoading}
          >
            {cancelLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancelar assinatura
          </Button>
        )}
        
        {!isActive && (
          <Button onClick={() => navigate('/')}>Ver planos disponíveis</Button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Assinatura</CardTitle>
          <CardDescription>Visualize e gerencie sua assinatura atual</CardDescription>
        </CardHeader>
        <CardContent>
          {renderSubscriptionStatus()}
        </CardContent>
      </Card>
    </div>
  );
}
