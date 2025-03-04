
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CreditCard, Sparkles, Zap, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Signup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [showPaymentOption, setShowPaymentOption] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleStartTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Por favor, insira um email válido");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      // Inform the user that we're processing the request
      toast.info("Preparando checkout...");
      
      console.log("Starting checkout process for:", email);
      
      // Create a Stripe checkout session
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          email: email,
          priceId: "prod_RsUFxPZfy7VBFx", // Using your Stripe product ID
          successUrl: `${window.location.origin}/login?signup=success`,
          cancelUrl: `${window.location.origin}/signup?canceled=true`,
        },
      });
      
      if (error) {
        console.error("Error invoking function:", error);
        toast.error(`Erro ao iniciar a assinatura: ${error.message || 'Por favor, tente novamente'}`);
        setErrorMessage(`Erro: ${error.message}`);
        setIsLoading(false);
        return;
      }
      
      console.log("Response from create-checkout function:", data);
      
      // If there's an error property in the response data, show it
      if (data && data.error) {
        console.error("Checkout error:", data.error);
        toast.error(data.error);
        setErrorMessage(data.error);
        setIsLoading(false);
        return;
      }
      
      // If this is a mock response in development, show payment option directly
      if (data.isMock) {
        console.log("Mock checkout detected, showing payment option");
        setShowPaymentOption(true);
        setIsLoading(false);
        toast.info("Modo de desenvolvimento: simulando checkout");
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
      }
    } catch (error: any) {
      console.error("Error in checkout process:", error);
      toast.error(`Ocorreu um erro ao processar sua solicitação: ${error.message || ''}`);
      setErrorMessage(`Erro: ${error.message || 'Ocorreu um erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen">
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#080a12] bg-gradient-to-br from-[#0c1420]/80 to-[#1a1b25]/80 p-8">
        <div className="w-full max-w-md space-y-8 relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-dilq-accent/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-dilq-teal/10 rounded-full blur-3xl"></div>
          
          <div className="text-center space-y-4 relative">
            <div className="inline-flex items-center justify-center mb-2">
              <Sparkles className="h-6 w-6 text-dilq-accent mr-2 animate-pulse-subtle" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-dilq-accent via-purple-400 to-dilq-teal bg-clip-text text-transparent">
                {showPaymentOption ? "Assinatura Premium" : "Assine agora"}
              </h2>
            </div>
            <p className="text-gray-300">
              {showPaymentOption 
                ? "Eleve sua experiência com acesso completo" 
                : "Acesse todo o conteúdo por R$ 19,00 por mês."}
            </p>
            {!showPaymentOption && (
              <div className="mt-6 space-y-4">
                <div className="bg-gradient-to-r p-[1px] from-dilq-accent/30 to-dilq-teal/30 rounded-xl">
                  <div className="bg-black/50 backdrop-blur-md p-5 rounded-xl text-left space-y-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-dilq-accent to-dilq-teal flex items-center justify-center">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-white">Acesso total ao conteúdo</h3>
                        <p className="text-sm text-gray-300">Cursos, tutoriais e recursos exclusivos</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-dilq-teal to-dilq-accent flex items-center justify-center">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-white">Sem compromisso</h3>
                        <p className="text-sm text-gray-300">Cancele quando quiser, sem burocracia</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {errorMessage && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-200 p-4 rounded-xl text-sm backdrop-blur-md">
              {errorMessage}
            </div>
          )}
          
          {showPaymentOption ? (
            <div className="space-y-6">
              <div className="neo-blur p-6 rounded-xl space-y-4">
                <div className="flex items-center">
                  <CreditCard className="h-6 w-6 text-dilq-accent mr-2" />
                  <h3 className="text-xl font-medium text-white">Plano Premium</h3>
                </div>
                <div className="flex items-baseline justify-center my-4">
                  <span className="text-3xl font-bold text-white">R$ 19,00</span>
                  <span className="text-gray-400 ml-1">/mês</span>
                </div>
                <ul className="space-y-3">
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
              </div>
              
              <Button
                onClick={handleStartTrial}
                className="w-full h-12 bg-gradient-to-r from-dilq-accent to-dilq-teal hover:opacity-90 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                disabled={isLoading}
              >
                {isLoading ? 
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                    <span>Processando...</span>
                  </div> : 
                  "Assinar agora"
                }
              </Button>
              
              <button 
                onClick={() => setShowPaymentOption(false)}
                className="w-full text-sm text-gray-400 hover:text-white transition-colors"
              >
                Voltar para o formulário
              </button>
            </div>
          ) : (
            <form onSubmit={handleStartTrial} className="space-y-6 relative z-10">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-dilq-accent to-dilq-teal rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative bg-black/60 backdrop-blur-md rounded-lg overflow-hidden">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-dilq-accent transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="bg-transparent border-0 ring-offset-0 pl-10 text-white focus:ring-1 focus:ring-dilq-accent/50"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-dilq-accent to-dilq-teal hover:opacity-90 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                disabled={isLoading}
              >
                {isLoading ? 
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                    <span>Processando...</span>
                  </div> : 
                  "Assinar agora"
                }
              </Button>
            </form>
          )}
          
          <div className="text-center pt-4">
            <p className="text-sm text-gray-400">
              Já tem uma conta?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-dilq-accent hover:underline transition-colors"
              >
                Faça login
              </button>
            </p>
          </div>
        </div>
      </div>
      <div className="hidden lg:flex w-1/2 bg-[#465E73] p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1F2C] via-[#2C3D4F] to-[#465E73] opacity-90"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/lovable-uploads/51280539-8d8b-4153-9b22-b0eca70f327c.png')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        
        <div className="absolute top-10 right-10 w-20 h-20 bg-dilq-accent/20 rounded-full blur-3xl animate-pulse-subtle"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-dilq-teal/20 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: "1s" }}></div>
        
        <div className="max-w-lg space-y-8 relative z-10">
          <div className="aspect-square w-64 mx-auto relative overflow-hidden">
            <img
              src="/lovable-uploads/edd4e2f7-ee31-4d6c-8b97-6b0b3771a57e.png"
              alt="DILQ ORBE"
              className="w-full h-full object-contain animate-float"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#465E73] to-transparent opacity-30"></div>
          </div>
          <div className="space-y-6 text-center max-w-md mx-auto backdrop-blur-sm bg-black/10 p-8 rounded-xl border border-white/10">
            <h1 className="text-3xl font-bold text-white leading-tight">
              O Grande Alinhamento:
              <span className="bg-gradient-to-r from-dilq-accent to-dilq-teal bg-clip-text text-transparent"> Sincronize Sua Mente, Corpo e Propósito</span>
            </h1>
            <p className="text-base text-gray-100 leading-relaxed">
              Esta é a reinicialização que vai redesenhar sua vida: assuma o
              controle das suas tarefas, finanças, corpo, hábitos e conexão com o
              essencial. Transforme sua existência em um estado de alta
              performance e significado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
