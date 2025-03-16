
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PortalButton } from "@/components/stripe/PortalButton";
import { CalendarDays, CreditCard, RefreshCw, Shield } from "lucide-react";
import { getUserSubscription } from "@/integrations/supabase/client";

export function SubscriptionTab() {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        
        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (!user) {
          return;
        }

        // Get subscription data
        const subscriptionData = await getUserSubscription();
        
        setSubscription(subscriptionData);
      } catch (error) {
        console.error('Error fetching subscription:', error);
        toast.error('Erro ao carregar dados da assinatura');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const refreshSubscription = async () => {
    try {
      setLoading(true);
      const subscriptionData = await getUserSubscription();
      setSubscription(subscriptionData);
      toast.success('Dados da assinatura atualizados');
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      toast.error('Erro ao atualizar dados da assinatura');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPlanName = (planType: string) => {
    switch (planType) {
      case 'pro':
        return 'Pro';
      case 'basic':
        return 'Básico';
      default:
        return planType;
    }
  };

  const getStatusBadge = (status: string) => {
    let bgColor = '';
    let textColor = '';
    let label = '';

    switch (status) {
      case 'active':
        bgColor = 'bg-green-100 dark:bg-green-900/20';
        textColor = 'text-green-700 dark:text-green-400';
        label = 'Ativa';
        break;
      case 'trialing':
        bgColor = 'bg-blue-100 dark:bg-blue-900/20';
        textColor = 'text-blue-700 dark:text-blue-400';
        label = 'Em período de teste';
        break;
      case 'canceled':
        bgColor = 'bg-gray-100 dark:bg-gray-700/40';
        textColor = 'text-gray-700 dark:text-gray-400';
        label = 'Cancelada';
        break;
      case 'past_due':
        bgColor = 'bg-amber-100 dark:bg-amber-900/20';
        textColor = 'text-amber-700 dark:text-amber-400';
        label = 'Pagamento atrasado';
        break;
      default:
        bgColor = 'bg-gray-100 dark:bg-gray-700/40';
        textColor = 'text-gray-700 dark:text-gray-400';
        label = status || 'Desconhecido';
    }

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${bgColor} ${textColor}`}>
        {label}
      </span>
    );
  };

  return (
    <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-dilq-accent/5 to-dilq-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-2 text-xl font-medium text-dilq-blue">
          <Shield className="h-5 w-5 text-dilq-purple" />
          Gerenciamento de Assinatura
        </CardTitle>
        <CardDescription>
          Visualize e gerencie detalhes da sua assinatura
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6 relative z-10">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-dilq-blue" />
          </div>
        ) : !subscription ? (
          <div className="text-center p-6 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/30">
            <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Sem assinatura ativa</h3>
            <p className="text-muted-foreground mb-4">Você não possui nenhuma assinatura ativa no momento.</p>
            <Button variant="outline" onClick={() => window.location.href = '/subscription'}>
              Ver planos disponíveis
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-2">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  Plano {getPlanName(subscription.plan_type)}
                  {getStatusBadge(subscription.status)}
                </h3>
                <p className="text-muted-foreground mt-1">ID: {subscription.stripe_subscription_id}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshSubscription}
                className="h-9"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white/60 dark:bg-gray-800/30">
                <div className="flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-dilq-blue mt-0.5" />
                  <div>
                    <h4 className="font-medium">Período atual</h4>
                    <div className="mt-1 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Início:</span>
                        <span>{formatDate(subscription.current_period_start)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fim:</span>
                        <span>{formatDate(subscription.current_period_end)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white/60 dark:bg-gray-800/30">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-dilq-purple mt-0.5" />
                  <div>
                    <h4 className="font-medium">Informações de pagamento</h4>
                    <div className="mt-1 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Renovação automática:</span>
                        <span>{subscription.cancel_at_period_end ? 'Não' : 'Sim'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cliente Stripe:</span>
                        <span className="truncate max-w-[150px]">{subscription.stripe_customer_id || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium mb-2">Ações</h4>
              <div className="flex flex-wrap gap-3">
                <PortalButton 
                  customerId={user?.id}
                  className="bg-gradient-to-r from-dilq-blue to-dilq-purple hover:from-dilq-blue/90 hover:to-dilq-purple/90 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  Gerenciar assinatura
                </PortalButton>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/subscription'}
                >
                  Ver planos disponíveis
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                Gerencie seus métodos de pagamento, veja faturas e atualize ou cancele sua assinatura no portal de clientes do Stripe.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
