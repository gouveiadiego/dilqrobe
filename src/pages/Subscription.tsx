
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createStripeCheckout, getUserSubscription } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Crown, Check, Loader2 } from "lucide-react";

interface PriceTier {
  id: string;
  name: string;
  price: string;
  features: string[];
  priceId: string;
}

const priceTiers: PriceTier[] = [
  {
    id: "basic",
    name: "Basic",
    price: "Grátis",
    features: [
      "Gerenciamento de tarefas básico",
      "Limitado a 5 projetos",
      "Suporte via e-mail",
    ],
    priceId: "", // Não tem priceId porque é grátis
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$ 29,90/mês",
    features: [
      "Todos os recursos do plano Basic",
      "Projetos ilimitados",
      "Acesso a todos os recursos premium",
      "Suporte prioritário",
      "Sem anúncios",
    ],
    priceId: "price_1R0TzTRooQphZ1dFuimjjS1t", // Atualizado com o novo Stripe Price ID
  },
];

export default function Subscription() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }
        
        setUser(user);
        
        // Check URL params for payment status
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get("payment");
        
        if (paymentStatus === "success") {
          toast.success("Assinatura realizada com sucesso!");
          // Redirect to dashboard after successful payment
          navigate("/dashboard");
          return;
        } else if (paymentStatus === "canceled") {
          toast.error("Pagamento cancelado");
        }
        
        // Get subscription data
        const subscriptionData = await getUserSubscription();
        setSubscription(subscriptionData);
        
        // If user has active subscription, redirect to dashboard
        if (subscriptionData?.status === "active") {
          console.log("Active subscription found, redirecting to dashboard");
          navigate("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Erro ao carregar os dados da assinatura");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleSubscribe = async (priceId: string) => {
    if (!priceId) return;
    
    try {
      setCheckoutLoading(priceId);
      const { url } = await createStripeCheckout(priceId);
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Erro ao processar assinatura");
    } finally {
      setCheckoutLoading("");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSubscribed = subscription?.status === "active";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Planos e Preços</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Escolha o plano que melhor atende às suas necessidades
        </p>
      </div>

      {isSubscribed && (
        <div className="mb-8 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-amber-500" />
            <div>
              <h3 className="text-lg font-medium">Você tem uma assinatura ativa!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sua assinatura renova em{" "}
                {subscription?.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR")
                  : "data não disponível"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {priceTiers.map((tier) => (
          <Card 
            key={tier.id} 
            className={`flex flex-col overflow-hidden ${
              tier.id === "pro" 
                ? "border-2 border-primary shadow-lg" 
                : ""
            }`}
          >
            {tier.id === "pro" && (
              <div className="bg-primary px-4 py-1 text-center text-xs font-medium text-primary-foreground">
                RECOMENDADO
              </div>
            )}
            <CardHeader>
              <CardTitle>{tier.name}</CardTitle>
              <CardDescription>
                <span className="mt-2 block text-2xl font-bold">{tier.price}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {(tier.id === "basic" || (isSubscribed && subscription?.plan_type === tier.id)) ? (
                <Button disabled variant="outline" className="w-full">
                  Plano atual
                </Button>
              ) : (
                <Button
                  onClick={() => handleSubscribe(tier.priceId)}
                  disabled={checkoutLoading === tier.priceId}
                  className="w-full"
                  variant={tier.id === "pro" ? "default" : "outline"}
                >
                  {checkoutLoading === tier.priceId ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : isSubscribed ? (
                    "Mudar plano"
                  ) : (
                    "Assinar agora"
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tem dúvidas sobre os planos? Entre em contato com nosso suporte.
        </p>
      </div>
    </div>
  );
}
