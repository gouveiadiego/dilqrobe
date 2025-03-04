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
    
    // Se o usuário vier de um checkout cancelado
    if (searchParams.get('canceled') === 'true') {
      toast.info("Checkout cancelado. Você pode tentar novamente quando quiser.");
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
        setIsLoading(false);
        return;
      }

      // Check subscription status
      if (data?.session) {
        try {
          console.log("Checking subscription for user:", data.session.user.id);
          
          const { data: subscriptionData, error: subscriptionError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', data.session.user.id)
            .in('status', ['active', 'trialing'])
            .maybeSingle();
            
          if (subscriptionError && subscriptionError.code !== 'PGRST116') {
            console.error("Error checking subscription:", subscriptionError);
            toast.error("Erro ao verificar assinatura. Tente novamente.");
            setIsLoading(false);
            return;
          }
          
          console.log("Subscription check result:", subscriptionData);
          
          if (!subscriptionData) {
            // Show payment option if no active subscription
            setShowPaymentOption(true);
            setIsLoading(false);
            return;
          }
          
          console.log("Valid subscription found, status:", subscriptionData.status);
          
          // Has valid subscription, proceed to dashboard
          navigate("/dashboard", { replace: true });
        } catch (error) {
          console.error("Error checking subscription status:", error);
          toast.error("Erro ao verificar status da assinatura. Tente novamente.");
          setIsLoading(false);
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message);
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
        setIsLoading(false);
        return;
      }
      
      // Redirect to Stripe checkout page
      if (data && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error("Erro ao iniciar a assinatura: URL de checkout não disponível");
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Error in checkout process:", error);
      toast.error("Ocorreu um erro ao processar sua solicitação");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Background elements for futuristic look */}
        <div className="absolute inset-0 bg-white dark:bg-gray-900 opacity-90 z-0"></div>
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-100 dark:bg-purple-900/20 rounded-full filter blur-3xl opacity-50 animate-pulse-subtle"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-100 dark:bg-blue-900/20 rounded-full filter blur-3xl opacity-40 animate-float"></div>
        </div>
        
        <div className="w-full max-w-md space-y-8 z-10 relative">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-dilq-accent to-dilq-teal">
              {showPaymentOption ? "Assinatura Necessária" : "Bem-vindo de volta"}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {showPaymentOption 
                ? "Você precisa de uma assinatura para continuar" 
                : "Entre com suas credenciais para continuar"}
            </p>
          </div>
          
          {showPaymentOption ? (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 text-dilq-accent mr-2" />
                  <h3 className="font-medium">Assine agora</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                  Acesse todo o conteúdo por R$ 19,00 por mês.
                </p>
                <div className="mt-2 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-100 dark:border-green-800/30">
                  <p className="text-sm font-medium text-green-800 dark:text-green-400">
                    Comece com 3 dias de teste grátis!
                  </p>
                </div>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mt-3">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-1">✓</span> Acesso total ao conteúdo
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-1">✓</span> Sem compromisso - cancele quando quiser
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-1">✓</span> 3 dias de teste grátis
                  </li>
                </ul>
              </div>
              
              <Button
                onClick={handleStartTrial}
                className="w-full bg-gradient-to-r from-dilq-accent to-dilq-teal hover:from-dilq-accent/90 hover:to-dilq-teal/90 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-dilq-accent/20 disabled:opacity-70"
                disabled={isLoading}
              >
                {isLoading ? "Processando..." : "Iniciar teste grátis"}
              </Button>
              
              <button 
                onClick={() => setShowPaymentOption(false)}
                className="w-full text-sm text-gray-600 hover:text-dilq-accent dark:text-gray-400 dark:hover:text-dilq-accent transition-colors"
              >
                Voltar para o login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-dilq-accent transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10 h-11 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-dilq-accent focus:border-transparent shadow-sm transition-all"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Senha</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-dilq-accent transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-11 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-dilq-accent focus:border-transparent shadow-sm transition-all"
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
                className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg h-12 disabled:opacity-70"
                disabled={isLoading}
              >
                {isLoading ? "Carregando..." : "Entrar"}
              </Button>
            </form>
          )}

          <div className="text-center pt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Não tem uma conta?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="font-medium bg-gradient-to-r from-dilq-pink to-dilq-accent bg-clip-text text-transparent hover:from-dilq-accent hover:to-dilq-pink transition-all duration-300 transform hover:scale-105 inline-block"
              >
                Registre-se
              </button>
            </p>
          </div>
        </div>
      </div>
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-dilq-purple to-dilq-blue p-12 items-center justify-center relative">
        {/* Animated elements for futuristic look */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-dilq-accent/10 rounded-full filter blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-dilq-teal/10 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="max-w-lg space-y-8 relative z-10 backdrop-blur-sm glass-effect p-8 rounded-2xl">
          <div className="aspect-square w-64 mx-auto relative overflow-hidden rounded-xl border border-white/20 shadow-lg transform hover:scale-[1.01] transition-all duration-500">
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
