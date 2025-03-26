
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserSubscription } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, Shield, CreditCard } from "lucide-react";
import { CheckoutButton } from "@/components/stripe/CheckoutButton";
import { PortalButton } from "@/components/stripe/PortalButton";
import { PaymentHistory } from "@/components/stripe/PaymentHistory";

interface PriceTier {
  id: string;
  name: string;
  price: string;
  priceId: string;
}

const priceTiers: PriceTier[] = [
  {
    id: "pro",
    name: "Pro",
    price: "R$ 19,90/mês",
    priceId: "price_1R0nc2RooQphZ1dFnk4ZneeE",
  },
];

export default function Subscription() {
  const navigate = useNavigate();
  const location = useLocation();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First check URL params for payment status
        const urlParams = new URLSearchParams(location.search);
        const paymentStatus = urlParams.get("payment");
        
        if (paymentStatus === "success") {
          toast.success("Assinatura realizada com sucesso!");
          console.log("Payment successful, redirecting to payment success page");
          navigate("/payment/success", { replace: true });
          return;
        } else if (paymentStatus === "canceled") {
          toast.error("Pagamento cancelado");
          console.log("Payment canceled, redirecting to payment canceled page");
          navigate("/payment/canceled", { replace: true });
          return;
        }
        
        // Then check user auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }
        
        setUser(user);
        console.log("User authenticated:", user.id);
        
        // Get subscription data
        const subscriptionData = await getUserSubscription();
        console.log("Subscription data:", subscriptionData);
        setSubscription(subscriptionData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Erro ao carregar os dados da assinatura");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, location]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSubscribed = subscription?.status === "active";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-indigo-950 text-white">
      <div className="container mx-auto px-4 py-10 md:py-16 flex flex-col items-center justify-center">
        {isSubscribed && (
          <div className="max-w-3xl w-full mb-8 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-amber-500" />
              <div>
                <h3 className="text-lg font-medium">Você tem uma assinatura ativa!</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sua assinatura renova em{" "}
                  {subscription?.current_period_end
                    ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR")
                    : "data não disponível"}
                </p>
                <div className="mt-4">
                  <PortalButton customerId={user?.id}>
                    Gerenciar Assinatura
                  </PortalButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isSubscribed && (
          <div className="max-w-3xl w-full mx-auto mb-16 rounded-3xl overflow-hidden border border-indigo-500/30 backdrop-blur-md bg-indigo-950/50 shadow-xl">
            <div className="p-8 md:p-12 flex flex-col items-center">
              <div className="px-4 py-1 mb-6 bg-indigo-500/20 backdrop-blur-sm rounded-full border border-indigo-500/30 text-indigo-300">
                <span className="text-sm font-medium">Oferta Especial</span>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-bold mb-4 text-center">
                Comece sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Transformação</span> Hoje
              </h1>
              
              <div className="my-8 relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl blur-xl opacity-30 animate-pulse"></div>
                <div className="relative py-5 px-8 rounded-xl bg-gradient-to-r from-indigo-600/40 to-cyan-600/40 border border-white/20 backdrop-blur-md shadow-lg">
                  <p className="text-4xl md:text-6xl font-bold text-white">
                    R$<span className="text-indigo-300">19</span>,90<span className="text-xl text-gray-300">/mês</span>
                  </p>
                </div>
              </div>
              
              <p className="text-lg text-center text-gray-300 mb-10 max-w-2xl">
                Por um valor mínimo, tenha acesso a todas as funcionalidades premium e transforme sua vida pessoal e profissional com nosso sistema completo.
              </p>
              
              {!isSubscribed && (
                <CheckoutButton
                  priceId={priceTiers[0].priceId}
                  customerId={user?.id}
                  className="py-4 px-8 text-lg font-medium bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 rounded-full transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center gap-2"
                >
                  {checkoutLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : null}
                  Assinar por apenas R$19,90/mês
                </CheckoutButton>
              )}
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 w-full border-t border-indigo-500/20 pt-8">
                {[
                  { icon: <Shield className="h-6 w-6" />, text: "Cancele a qualquer momento" },
                  { icon: <CheckCircle className="h-6 w-6" />, text: "Suporte prioritário" },
                  { icon: <Shield className="h-6 w-6" />, text: "Acesso completo" },
                  { icon: <CreditCard className="h-6 w-6" />, text: "Pagamento seguro" }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center p-4">
                    <div className="bg-gradient-to-br from-indigo-500/30 to-cyan-500/30 p-3 rounded-full mb-3">
                      {item.icon}
                    </div>
                    <span className="text-sm text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {user && isSubscribed && (
          <div className="w-full max-w-3xl mt-8">
            <PaymentHistory />
          </div>
        )}
      </div>
    </div>
  );
}
