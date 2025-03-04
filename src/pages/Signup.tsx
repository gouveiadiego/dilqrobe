import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Key, User, Phone, CreditCard, Sparkles, Zap, Shield, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AuthFormData } from "@/hooks/useAuth";

export const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = registration form, 2 = payment options
  
  // Form data for registration
  const [formData, setFormData] = useState<AuthFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: ""
  });
  
  const { 
    loading, 
    errorMessage, 
    setErrorMessage, 
    handleSignUp, 
    handlePasswordReset 
  } = useAuth();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await handleSignUp(formData);
    if (success) {
      // Move to payment step
      setStep(2);
    }
  };

  const handleStartTrial = async () => {
    // Use setErrorMessage from useAuth hook instead of directly setting an error
    setErrorMessage("");
    
    try {
      // Inform the user that we're processing the request
      toast.info("Preparando checkout...");
      
      console.log("Starting checkout process for:", formData.email);
      
      // Create a Stripe checkout session
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          email: formData.email,
          priceId: "prod_RsUFxPZfy7VBFx", // Using your Stripe product ID
          successUrl: `${window.location.origin}/login?signup=success`,
          cancelUrl: `${window.location.origin}/signup?canceled=true`,
        },
      });
      
      if (error) {
        console.error("Error invoking function:", error);
        toast.error(`Erro ao iniciar a assinatura: ${error.message || 'Por favor, tente novamente'}`);
        setErrorMessage(`Erro: ${error.message}`);
        return;
      }
      
      console.log("Response from create-checkout function:", data);
      
      // If there's an error property in the response data, show it
      if (data && data.error) {
        console.error("Checkout error:", data.error);
        toast.error(data.error);
        setErrorMessage(data.error);
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
      }
    } catch (error: any) {
      console.error("Error in checkout process:", error);
      toast.error(`Ocorreu um erro ao processar sua solicitação: ${error.message || ''}`);
      setErrorMessage(`Erro: ${error.message || 'Ocorreu um erro desconhecido'}`);
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
                {step === 1 ? "Crie sua conta" : "Assinatura Premium"}
              </h2>
            </div>
            <p className="text-gray-300">
              {step === 1 
                ? "Cadastre-se para acessar todos os recursos" 
                : "Acesse todo o conteúdo por R$ 19,00 por mês."}
            </p>
            
            {step === 2 && (
              <div className="mt-2 bg-green-900/20 p-2 rounded-lg border border-green-700/30 animate-pulse">
                <p className="text-sm font-medium text-green-400">
                  Comece com 3 dias de teste grátis!
                </p>
              </div>
            )}
          </div>
          
          {errorMessage && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-200 p-4 rounded-xl text-sm backdrop-blur-md">
              {errorMessage}
            </div>
          )}
          
          {step === 1 ? (
            <form onSubmit={handleRegistration} className="space-y-5 relative z-10">
              <div className="space-y-3">
                <Label htmlFor="fullName" className="text-gray-300">Nome Completo</Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-dilq-accent/30 to-dilq-teal/30 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative bg-black/60 backdrop-blur-md rounded-lg overflow-hidden">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-dilq-accent transition-colors" />
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Seu nome completo"
                      className="bg-transparent border-0 ring-offset-0 pl-10 text-white focus:ring-1 focus:ring-dilq-accent/50"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-dilq-accent/30 to-dilq-teal/30 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative bg-black/60 backdrop-blur-md rounded-lg overflow-hidden">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-dilq-accent transition-colors" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="bg-transparent border-0 ring-offset-0 pl-10 text-white focus:ring-1 focus:ring-dilq-accent/50"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-gray-300">Telefone (opcional)</Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-dilq-accent/30 to-dilq-teal/30 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative bg-black/60 backdrop-blur-md rounded-lg overflow-hidden">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-dilq-accent transition-colors" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      className="bg-transparent border-0 ring-offset-0 pl-10 text-white focus:ring-1 focus:ring-dilq-accent/50"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="password" className="text-gray-300">Senha</Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-dilq-accent/30 to-dilq-teal/30 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative bg-black/60 backdrop-blur-md rounded-lg overflow-hidden">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-dilq-accent transition-colors" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Senha"
                      className="bg-transparent border-0 ring-offset-0 pl-10 text-white focus:ring-1 focus:ring-dilq-accent/50"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-gray-300">Confirmar Senha</Label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-dilq-accent/30 to-dilq-teal/30 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative bg-black/60 backdrop-blur-md rounded-lg overflow-hidden">
                    <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-dilq-accent transition-colors" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirme sua senha"
                      className="bg-transparent border-0 ring-offset-0 pl-10 text-white focus:ring-1 focus:ring-dilq-accent/50"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-dilq-accent to-dilq-teal hover:opacity-90 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                disabled={loading}
              >
                {loading ? 
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                    <span>Processando...</span>
                  </div> : 
                  "Continuar"
                }
              </Button>
              
              <div className="flex justify-between text-sm text-gray-400 pt-2">
                <button 
                  type="button"
                  onClick={() => handlePasswordReset()}
                  className="hover:text-dilq-accent transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
            </form>
          ) : (
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
                <div className="bg-green-900/20 p-2 rounded-lg border border-green-700/30 text-center my-3">
                  <p className="text-sm font-medium text-green-400">
                    3 dias de teste grátis incluídos!
                  </p>
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
              
              <button 
                onClick={() => setStep(1)}
                className="w-full flex items-center justify-center text-sm text-gray-400 hover:text-white transition-colors gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar para o formulário</span>
              </button>
            </div>
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
