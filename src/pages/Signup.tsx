
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Chave pública do Stripe
const STRIPE_PUBLIC_KEY = "pk_live_51JzobYEJEe6kPCYC3QHUIrWCwki7fiIaVLB88jwvvoJq6Y1jQtzxIHL7aJuv0lsMVeuWSxWVS8AU4UDH4c8t3T9000h291QHyV";

export const Signup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleStartTrial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Por favor, insira um email válido");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Criar uma sessão de checkout do Stripe
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          email: email,
          priceId: "price_1OWFPsGkrDRkZ3iCNqpyTp4t", // Substitua pelo seu ID de preço real do Stripe
          successUrl: `${window.location.origin}/login?signup=success`,
          cancelUrl: `${window.location.origin}/signup?canceled=true`,
        },
      });
      
      if (error) {
        console.error("Erro ao criar checkout:", error);
        toast.error("Erro ao iniciar o teste gratuito");
        return;
      }
      
      // Redirecionar para a página de checkout do Stripe
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error: any) {
      console.error("Erro:", error);
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
              Experimente 3 dias grátis
            </h2>
            <p className="text-gray-600">
              Após o período de teste, será cobrado R$ 9,90 por mês.
            </p>
          </div>
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
              {isLoading ? "Processando..." : "Iniciar Teste Gratuito"}
            </Button>
          </form>
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
