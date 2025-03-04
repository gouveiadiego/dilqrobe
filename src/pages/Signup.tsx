
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Signup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [showPaymentOption, setShowPaymentOption] = useState(false);

  const handleStartTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Por favor, insira um email válido");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Inform the user that we're processing the request
      toast.info("Preparando checkout...");
      
      console.log("Starting checkout process for:", email);
      
      // Create a Stripe checkout session
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          email: email,
          priceId: "price_1PgJ5fJOumyCRZftPE91gDUU", // Use a proper Stripe price ID
          successUrl: `${window.location.origin}/login?signup=success`,
          cancelUrl: `${window.location.origin}/signup?canceled=true`,
        },
      });
      
      if (error) {
        console.error("Error creating checkout:", error);
        toast.error("Erro ao iniciar a assinatura. Por favor, tente novamente.");
        return;
      }
      
      console.log("Response from create-checkout function:", data);
      
      // If this is a mock response in development, show payment option directly
      if (data.isMock) {
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
      }
    } catch (error: any) {
      console.error("Error in checkout process:", error);
      toast.error("Ocorreu um erro ao processar sua solicitação");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen">
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              {showPaymentOption ? "Assinatura Necessária" : "Assine agora"}
            </h2>
            <p className="text-gray-600">
              {showPaymentOption 
                ? "Você precisa de uma assinatura para continuar" 
                : "Acesse todo o conteúdo por R$ 9,90 por mês."}
            </p>
            {!showPaymentOption && (
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                <p>✓ Acesso total ao conteúdo</p>
                <p>✓ Sem compromisso - cancele quando quiser</p>
              </div>
            )}
          </div>
          
          {showPaymentOption ? (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-md space-y-3">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-gray-500 mr-2" />
                  <h3 className="font-medium">Assine agora</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Acesse todo o conteúdo por R$ 9,90 por mês.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-1">✓</span> Acesso total ao conteúdo
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-1">✓</span> Sem compromisso - cancele quando quiser
                  </li>
                </ul>
              </div>
              
              <Button
                onClick={handleStartTrial}
                className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                disabled={isLoading}
              >
                {isLoading ? "Processando..." : "Assinar agora"}
              </Button>
              
              <button 
                onClick={() => setShowPaymentOption(false)}
                className="w-full text-sm text-gray-600 hover:text-gray-800"
              >
                Voltar para o formulário
              </button>
            </div>
          ) : (
            <form onSubmit={handleStartTrial} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                disabled={isLoading}
              >
                {isLoading ? "Processando..." : "Assinar agora"}
              </Button>
            </form>
          )}
          
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              Já tem uma conta?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:underline"
              >
                Faça login
              </button>
            </p>
          </div>
        </div>
      </div>
      <div className="hidden lg:flex w-1/2 bg-[#465E73] p-12 items-center justify-center">
        <div className="max-w-lg space-y-8">
          <div className="aspect-square w-64 mx-auto relative overflow-hidden">
            <img
              src="/lovable-uploads/edd4e2f7-ee31-4d6c-8b97-6b0b3771a57e.png"
              alt="DILQ ORBE"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-4 text-center max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-white leading-tight">
              O Grande Alinhamento: Sincronize Sua Mente, Corpo e Propósito
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
