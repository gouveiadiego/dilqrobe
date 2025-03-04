
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PricingPlans } from "@/components/PricingPlans";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      setLoadingSession(true);
      const { data } = await supabase.auth.getSession();
      setUserSession(data.session);
      setLoadingSession(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast.success("Conta criada com sucesso! Por favor, assine um plano para continuar.");
      setSignupSuccess(true);
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
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
                <Label htmlFor="password">Senha</Label>
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
