import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPlanSelected, setIsPlanSelected] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const selectedPlan = params.get("plan");
    setIsPlanSelected(!!selectedPlan);
    
    // Check if user is already logged in with a valid subscription
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Login page - session found for user:", session.user.id);
          
          // Check subscription
          try {
            const { data: subscription, error: subscriptionError } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('user_id', session.user.id)
              .in('status', ['active', 'trialing', 'paused'])
              .maybeSingle();
              
            if (subscriptionError && subscriptionError.code !== 'PGRST116') {
              console.error("Error checking subscription:", subscriptionError);
            }
            
            if (subscription) {
              console.log("Active subscription found:", subscription);
              
              // If user already has a valid subscription, redirect to dashboard
              console.log("Valid subscription found, navigating to dashboard");
              toast.success("Login realizado com sucesso");
              navigate("/dashboard");
              return;
            } else {
              console.log("No valid subscription found for logged-in user");
            }
          } catch (error) {
            console.error("Error checking subscription status:", error);
          }
        } else {
          console.log("No active session found");
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
      
      setCheckingSession(false);
    };
    
    checkSession();
  }, [location.search, navigate]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Login error:", error.message);
        toast.error("Erro ao fazer login: " + error.message);
        setLoading(false);
        return;
      }
      
      if (!data.session) {
        console.error("No session returned after login");
        toast.error("Erro ao obter sessão após login");
        setLoading(false);
        return;
      }
      
      console.log("User logged in successfully:", data.session.user.id);
      
      // After successful login, check if user has a valid subscription
      try {
        console.log("Checking subscription after login");
        const { data: subscription, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', data.session.user.id)
          .in('status', ['active', 'trialing', 'paused'])
          .maybeSingle();
          
        if (subscriptionError) {
          console.error("Error checking subscription:", subscriptionError);
          toast.error("Erro ao verificar assinatura");
          setLoading(false);
          return;
        }
        
        if (subscription) {
          console.log("Valid subscription found, navigating to dashboard");
          toast.success("Login realizado com sucesso!");
          navigate("/dashboard");
        } else {
          console.log("No valid subscription found, redirect user to plans");
          // If user doesn't have a valid subscription, handle accordingly
          if (isPlanSelected) {
            // User was in the process of selecting a plan, redirect to checkout
            console.log("Plan was selected, redirecting to payment");
            // Extract plan ID from URL
            const params = new URLSearchParams(location.search);
            const planId = params.get("plan");
            navigate(`/payment?plan=${planId}`);
          } else {
            // Otherwise redirect to plans page
            console.log("No plan selected, redirecting to plans page");
            toast.error("Você não possui uma assinatura ativa. Por favor, escolha um plano.");
            navigate("/plans");
          }
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        toast.error("Erro ao verificar assinatura");
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error in handleSignIn:", error);
      toast.error("Erro desconhecido ao fazer login");
      setLoading(false);
    }
  };

  // If still checking session, show loading spinner
  if (checkingSession) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#080a12]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-dilq-accent mx-auto" />
          <p className="mt-4 text-lg text-gray-300">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#080a12] to-[#1e2433] p-4">
      <Card className="w-full max-w-md backdrop-blur-lg bg-white/10 border-gray-500/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">
            Entrar no DILQ
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSignIn}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input 
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Senha</Label>
              <Input 
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-400"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-dilq-accent hover:bg-dilq-accent/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
            <div className="text-sm text-gray-400 text-center">
              Não tem uma conta?{" "}
              <Button variant="link" className="p-0 text-dilq-accent" onClick={() => navigate("/signup")}>
                Cadastre-se
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
