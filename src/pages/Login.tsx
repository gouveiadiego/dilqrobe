
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentOption, setShowPaymentOption] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    // Verificar se o usuário veio de um signup bem-sucedido
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('signup') === 'success') {
      toast.success("Registro concluído! Você pode fazer login agora.");
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        console.error("Login error:", signInError);
        if (signInError.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos");
        } else {
          toast.error("Erro ao fazer login. Tente novamente.");
        }
        return;
      }

      // Check subscription status
      if (data?.session) {
        try {
          const { data: subscriptionData, error: subscriptionError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', data.session.user.id)
            .single();
            
          if (subscriptionError && subscriptionError.code !== 'PGRST116') {
            console.error("Error checking subscription:", subscriptionError);
          }
          
          if (!subscriptionData || 
              (subscriptionData.status !== 'active' && 
               subscriptionData.status !== 'trialing')) {
            // Show payment option if no active subscription
            setShowPaymentOption(true);
            setIsLoading(false);
            return;
          }
          
          // Has valid subscription, proceed to dashboard
          navigate("/dashboard", { replace: true });
        } catch (error) {
          console.error("Error checking subscription status:", error);
          navigate("/dashboard", { replace: true });
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTrial = async () => {
    setIsLoading(true);
    try {
      // Create a Stripe checkout session
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          email: formData.email,
          priceId: "prod_RsUFxPZfy7VBFx",
          successUrl: `${window.location.origin}/login?signup=success`,
          cancelUrl: `${window.location.origin}/login?canceled=true`,
        },
      });
      
      if (error) {
        console.error("Error creating checkout:", error);
        toast.error("Erro ao iniciar a assinatura. Por favor, tente novamente.");
        return;
      }
      
      // Redirect to Stripe checkout page
      if (data && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
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
              {showPaymentOption ? "Assinatura Necessária" : "Bem-vindo de volta"}
            </h2>
            <p className="text-gray-600">
              {showPaymentOption 
                ? "Você precisa de uma assinatura para continuar" 
                : "Entre com suas credenciais para continuar"}
            </p>
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
                Voltar para o login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                disabled={isLoading}
              >
                {isLoading ? "Carregando..." : "Entrar"}
              </Button>
            </form>
          )}

          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              Não tem uma conta?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-blue-600 hover:underline"
              >
                Registre-se
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

export default Login;
