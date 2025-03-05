
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export interface Plan {
  id: string;
  name: string;
  description: string;
  price_id: string;
  amount: number;
  currency: string;
  interval: string;
}

interface PricingPlanProps {
  showTitle?: boolean;
}

export function PricingPlans({ showTitle = true }: PricingPlanProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const navigate = useNavigate();

  // Fetch available plans
  useEffect(() => {
    async function fetchPlans() {
      setLoading(true);
      try {
        // Temporarily use hardcoded plans until the database is properly set up
        const hardcodedPlans: Plan[] = [
          {
            id: "1",
            name: "Plano Mensal",
            description: "Acesso a todas as funcionalidades por um mês",
            price_id: "price_1Qz51FRooQphZ1dFZhZ4AEhd",
            amount: 3900,
            currency: "BRL",
            interval: "month"
          },
          {
            id: "2",
            name: "Plano Anual",
            description: "Acesso a todas as funcionalidades por um ano com desconto",
            price_id: "price_1Qz52DRooQphZ1dF0Uy7m84K", // Corrigido o ID do plano anual
            amount: 39900,
            currency: "BRL",
            interval: "year"
          }
        ];
        
        setPlans(hardcodedPlans);
      } catch (error) {
        console.error("Error fetching plans:", error);
        toast.error("Erro ao carregar os planos disponíveis");
      } finally {
        setLoading(false);
      }
    }

    // Fetch current subscription
    async function fetchSubscription() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .in("status", ["active", "trialing"])
          .maybeSingle();
        
        if (error) throw error;
        setSubscription(data);
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    }

    fetchPlans();
    fetchSubscription();
  }, []);

  const handleCheckout = async (priceId: string, planId: string) => {
    setProcessingPlanId(planId);
    
    try {
      // First check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error("Authentication error:", sessionError);
        toast.error("Você precisa estar logado para assinar um plano");
        navigate("/login");
        setProcessingPlanId(null);
        return;
      }

      console.log("Creating checkout session for price ID:", priceId);
      console.log("User is authenticated:", !!session.user.id);
      
      // Pass user info directly in the request to avoid auth issues
      const userId = session.user.id;
      const userEmail = session.user.email;
      
      if (!userId || !userEmail) {
        toast.error("Informações de usuário incompletas. Por favor, faça login novamente.");
        navigate("/login");
        setProcessingPlanId(null);
        return;
      }
      
      // Make the request to create checkout with direct user info
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { 
          priceId,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/dashboard?cancelled=true`,
          userId,
          userEmail
        }
      });

      if (error) {
        console.error("Error invoking create-checkout function:", error);
        toast.error(`Erro ao criar sessão de pagamento: ${error.message}`);
        throw error;
      }
      
      console.log("Checkout session response:", data);
      
      if (data && data.url) {
        window.location.href = data.url;
      } else {
        console.error("No URL received in checkout response:", data);
        toast.error("Erro ao criar sessão de pagamento: URL não recebida");
        throw new Error("URL de checkout não recebida");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error(`Erro ao criar sessão de pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setProcessingPlanId(null);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'BRL',
    }).format(amount / 100);
  };

  if (loading && plans.length === 0) {
    return <div className="text-center py-8">Carregando planos...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      {showTitle && (
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold">Planos e Preços</h2>
          <p className="text-muted-foreground mt-2">
            Escolha o plano que melhor se adapta às suas necessidades
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const isSubscribed = subscription && subscription.price_id === plan.price_id;
          const isProcessing = processingPlanId === plan.id;
          
          return (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{formatPrice(plan.amount, plan.currency)}</span>
                  <span className="text-muted-foreground ml-1">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Acesso a todas as funcionalidades</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Suporte prioritário</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    <span>Período de teste de 3 dias</span>
                  </li>
                  {plan.interval === 'year' && (
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span className="font-semibold">Economia de 15%</span>
                    </li>
                  )}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={isSubscribed ? "outline" : "default"}
                  disabled={isSubscribed || isProcessing}
                  onClick={() => handleCheckout(plan.price_id, plan.id)}
                >
                  {isSubscribed ? 'Plano Atual' : isProcessing ? 'Processando...' : 'Assinar Agora'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
