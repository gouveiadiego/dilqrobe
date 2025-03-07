
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigate, useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PricingPlans } from "@/components/PricingPlans";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if there's a subscription success or cancelled parameter in the URL
  const searchParams = new URLSearchParams(location.search);
  const subscriptionSuccess = searchParams.get('success') === 'true';
  const subscriptionCancelled = searchParams.get('cancelled') === 'true';

  useEffect(() => {
    if (subscriptionSuccess) {
      toast.success("Assinatura realizada com sucesso! Redirecionando para o dashboard...");
      
      // Delay to ensure subscription data is processed
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    } else if (subscriptionCancelled) {
      toast.error("Assinatura cancelada. Você pode tentar novamente quando quiser.");
    }
  }, [subscriptionSuccess, subscriptionCancelled, navigate]);

  useEffect(() => {
    const checkSession = async () => {
      setLoadingSession(true);
      const { data } = await supabase.auth.getSession();
      console.log("Auth page - current session:", data.session ? "exists" : "none");
      setUserSession(data.session);
      setLoadingSession(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session ? "session exists" : "no session");
        setUserSession(session);
        
        // Se o usuário acabou de fazer login e não está no fluxo de inscrição, redirecione para o dashboard
        if (event === 'SIGNED_IN' && !signupSuccess) {
          navigate("/dashboard");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, signupSuccess]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast.success("Login realizado com sucesso");
      
      // Verificar se o usuário tem uma assinatura ativa
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id as string)
        .in("status", ["active", "trialing"])
        .maybeSingle();
        
      if (subscriptionError) {
        console.error("Error checking subscription after login:", subscriptionError);
      }
      
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error signing in:", error);
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Email ou senha incorretos");
      } else {
        toast.error(error.message || "Erro ao fazer login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Formatar CPF enquanto digita
  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formattedValue = digits;
    
    if (digits.length > 3) {
      formattedValue = `${digits.substring(0, 3)}.${digits.substring(3)}`;
    }
    if (digits.length > 6) {
      formattedValue = `${formattedValue.substring(0, 7)}.${digits.substring(6)}`;
    }
    if (digits.length > 9) {
      formattedValue = `${formattedValue.substring(0, 11)}-${digits.substring(9, 11)}`;
    }
    
    return formattedValue.substring(0, 14);
  };

  // Formatar telefone enquanto digita
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formattedValue = digits;
    
    if (digits.length > 0) {
      formattedValue = `(${digits.substring(0, 2)}`;
    }
    if (digits.length > 2) {
      formattedValue = `${formattedValue}) ${digits.substring(2)}`;
    }
    if (digits.length > 7) {
      formattedValue = `${formattedValue.substring(0, 10)}-${digits.substring(7)}`;
    }
    
    return formattedValue.substring(0, 15);
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCPF(e.target.value);
    setCpf(formattedValue);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhone(e.target.value);
    setPhone(formattedValue);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName || !cpf) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    // Validar formato de CPF básico (apenas verificação de formato, não de validade)
    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      toast.error("CPF inválido");
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            cpf: cpf,
            phone: phone || null
          }
        }
      });
      
      if (error) throw error;
      
      toast.success("Conta criada com sucesso! Por favor, verifique seu email para confirmar seu cadastro.");
      // Não redirecionar para planos imediatamente, apenas após a confirmação do email
      // setSignupSuccess(true);
    } catch (error: any) {
      console.error("Error signing up:", error);
      if (error.message.includes("User already registered")) {
        toast.error("Este email já está registrado. Por favor, faça login.");
        setIsSignUp(false);
      } else {
        toast.error(error.message || "Erro ao criar conta");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingSession) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }

  // If user is coming back from a successful payment with subscription=active param,
  // redirect to dashboard after a short delay to allow subscription to synchronize
  if (subscriptionSuccess && userSession) {
    return <div className="flex flex-col justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dilq-accent mb-4"></div>
      <p className="text-lg">Processando sua assinatura, aguarde um momento...</p>
    </div>;
  }

  if (userSession && !signupSuccess) {
    return <Navigate to="/dashboard" replace />;
  }

  // If signup was successful, show pricing plans
  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Selecione um Plano</h1>
            <p className="text-muted-foreground mb-6">
              Para continuar utilizando nossa plataforma, escolha um dos planos abaixo.
            </p>
          </div>
          <PricingPlans />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container grid items-center gap-6 md:grid-cols-2 lg:gap-10">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            {isSignUp ? "Crie sua conta" : "Bem-vindo de volta"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            {isSignUp 
              ? "Registre-se para começar a gerenciar suas finanças de forma eficiente." 
              : "Faça login para continuar gerenciando suas finanças de forma eficiente."}
          </p>
        </div>
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold">
              {isSignUp ? "Criar Conta" : "Acessar Conta"}
            </h2>
          </div>
          <div className="space-y-4">
            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome Completo <span className="text-red-500">*</span></Label>
                    <Input
                      id="fullName"
                      placeholder="José da Silva"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF <span className="text-red-500">*</span></Label>
                    <Input
                      id="cpf"
                      placeholder="123.456.789-00"
                      value={cpf}
                      onChange={handleCPFChange}
                      maxLength={14}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="(11) 98765-4321"
                      value={phone}
                      onChange={handlePhoneChange}
                      maxLength={15}
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha <span className="text-red-500">*</span></Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Processando..." : isSignUp ? "Criar Conta" : "Entrar"}
              </Button>
            </form>
            <div className="text-center text-sm">
              {isSignUp ? (
                <p>
                  Já tem uma conta?{" "}
                  <button
                    className="underline"
                    onClick={() => setIsSignUp(false)}
                  >
                    Faça login
                  </button>
                </p>
              ) : (
                <p>
                  Não tem uma conta?{" "}
                  <button
                    className="underline"
                    onClick={() => setIsSignUp(true)}
                  >
                    Registre-se
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      {!isSignUp && (
        <div className="mt-16 border-t pt-8">
          <PricingPlans />
        </div>
      )}
    </div>
  );
}
