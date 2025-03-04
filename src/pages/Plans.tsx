
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CreditCard, Sparkles, Shield, Zap, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Plans = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { errorMessage, setErrorMessage } = useAuth();

  const handleStartTrial = async () => {
    setLoading(true);
    setErrorMessage("");
    
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Faça login para continuar");
        navigate("/login");
        return;
      }
      
      // Inform the user that we're processing the request
      toast.info("Preparando checkout...");
      
      console.log("Starting checkout process for:", session.user.email);
      
      // Create a Stripe checkout session
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          email: session.user.email,
          priceId: "prod_RsUFxPZfy7VBFx", // Using your Stripe product ID
          successUrl: `${window.location.origin}/login?signup=success`,
          cancelUrl: `${window.location.origin}/plans?canceled=true`,
        },
      });
      
      if (error) {
        console.error("Error invoking function:", error);
        toast.error(`Erro ao iniciar a assinatura: ${error.message || 'Por favor, tente novamente'}`);
        setErrorMessage(`Erro: ${error.message}`);
        setLoading(false);
        return;
      }
      
      console.log("Response from create-checkout function:", data);
      
      // If there's an error property in the response data, show it
      if (data && data.error) {
        console.error("Checkout error:", data.error);
        toast.error(data.error);
        setErrorMessage(data.error);
        setLoading(false);
        return;
      }
      
      // If this is a mock response in development, show success message
      if (data.isMock) {
        console.log("Mock checkout detected, showing success");
        toast.info("Modo de desenvolvimento: simulando checkout");
        navigate("/login?signup=success");
        return;
      }
      
      // Redirect to Stripe checkout page
      if (data && data.checkoutUrl) {
        console.log("Redirecting to:", data.checkoutUrl);
        window.location.href = data.checkoutUrl;
      } else {
        console.error("Checkout URL not received:", data);
        toast.error("Erro ao iniciar a assinatura: URL de checkout não disponível");
        setErrorMessage("URL de checkout não disponível");
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Error in checkout process:", error);
      toast.error(`Ocorreu um erro ao processar sua solicitação: ${error.message || ''}`);
      setErrorMessage(`Erro: ${error.message || 'Ocorreu um erro desconhecido'}`);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-full flex flex-col items-center justify-center bg-[#080a12] bg-gradient-to-br from-[#0c1420]/80 to-[#1a1b25]/80 p-8">
        <div className="w-full max-w-4xl space-y-8 relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-dilq-accent/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-dilq-teal/10 rounded-full blur-3xl"></div>
          
          <div className="text-center space-y-4 relative mb-12">
            <div className="inline-flex items-center justify-center mb-2">
              <Sparkles className="h-6 w-6 text-dilq-accent mr-2 animate-pulse-subtle" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-dilq-accent via-purple-400 to-dilq-teal bg-clip-text text-transparent">
                Escolha Seu Plano
              </h2>
            </div>
            <p className="text-gray-300 max-w-lg mx-auto">
              Acesse todos os recursos premium da plataforma e transforme sua produtividade
            </p>
          </div>
          
          {errorMessage && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-200 p-4 rounded-xl text-sm backdrop-blur-md max-w-md mx-auto mb-8">
              {errorMessage}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="relative p-1 rounded-xl bg-gradient-to-r from-dilq-accent/50 via-purple-500/30 to-dilq-teal/50">
              <div className="neo-blur p-8 rounded-xl space-y-6 h-full flex flex-col bg-black/60 backdrop-blur-xl">
                <div className="flex items-center">
                  <Zap className="h-6 w-6 text-dilq-accent mr-2" />
                  <h3 className="text-xl font-medium text-white">Plano Gratuito</h3>
                </div>
                <div className="flex items-baseline justify-center my-4">
                  <span className="text-3xl font-bold text-white">R$ 0</span>
                  <span className="text-gray-400 ml-1">/mês</span>
                </div>
                <ul className="space-y-3 flex-grow">
                  <li className="flex items-center text-gray-300">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-dilq-accent/20 text-dilq-accent mr-2">✓</span> 
                    <span>Acesso limitado à plataforma</span>
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-dilq-accent/20 text-dilq-accent mr-2">✓</span> 
                    <span>Funções básicas de organização</span>
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-dilq-accent/20 text-dilq-accent mr-2">✓</span> 
                    <span>Suporte por email</span>
                  </li>
                </ul>
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  className="w-full h-12 border-dilq-accent/30 text-dilq-accent hover:bg-dilq-accent/10 font-medium rounded-xl"
                >
                  Continuar com Plano Gratuito
                </Button>
              </div>
            </div>
            
            <div className="relative p-1 rounded-xl bg-gradient-to-r from-dilq-accent via-purple-500/70 to-dilq-teal overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-br from-dilq-accent to-dilq-teal px-4 py-1 text-white text-xs font-bold uppercase transform translate-x-2 -translate-y-0 rotate-45 origin-bottom-left">
                Recomendado
              </div>
              <div className="neo-blur p-8 rounded-xl space-y-6 h-full flex flex-col bg-black/60 backdrop-blur-xl">
                <div className="flex items-center">
                  <CreditCard className="h-6 w-6 text-dilq-accent mr-2" />
                  <h3 className="text-xl font-medium text-white">Plano Premium</h3>
                </div>
                <div className="flex items-baseline justify-center my-4">
                  <span className="text-3xl font-bold text-white">R$ 19,00</span>
                  <span className="text-gray-400 ml-1">/mês</span>
                </div>
                <div className="bg-green-900/20 p-2 rounded-lg border border-green-700/30 text-center my-3">
                  <p className="text-sm font-medium text-green-400">
                    3 dias de teste grátis incluídos!
                  </p>
                </div>
                <ul className="space-y-3 flex-grow">
                  <li className="flex items-center text-gray-300">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-dilq-accent/20 text-dilq-accent mr-2">✓</span> 
                    <span>Acesso completo à plataforma</span>
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-dilq-accent/20 text-dilq-accent mr-2">✓</span> 
                    <span>Atualizações e novos conteúdos</span>
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-dilq-accent/20 text-dilq-accent mr-2">✓</span> 
                    <span>Suporte prioritário</span>
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-dilq-accent/20 text-dilq-accent mr-2">✓</span> 
                    <span>Cancele quando quiser</span>
                  </li>
                </ul>
                <Button
                  onClick={handleStartTrial}
                  className="w-full h-12 bg-gradient-to-r from-dilq-accent to-dilq-teal hover:opacity-90 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                  disabled={loading}
                >
                  {loading ? 
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                      <span>Processando...</span>
                    </div> : 
                    "Iniciar teste grátis"
                  }
                </Button>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-8">
            <button 
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center text-sm text-gray-400 hover:text-white transition-colors gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;
