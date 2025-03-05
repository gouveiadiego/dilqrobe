
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { PricingPlans } from "./PricingPlans";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for payment status parameters and force reload subscription check
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const success = queryParams.get('success');
    
    if (success === 'true') {
      console.log("Detected successful payment return, forcing subscription check");
      // Clean URL without reloading page
      window.history.replaceState({}, document.title, location.pathname);
      
      if (session && session.user) {
        // Force subscription check with a slight delay to allow webhook processing
        setTimeout(() => {
          checkSubscription(session.user.id, true);
          toast.success("Assinatura realizada com sucesso! Carregando seu acesso...");
        }, 2000);
      }
    }
  }, [session, location.search]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (error) {
        console.error("Error getting session:", error);
        toast.error("Erro ao verificar autenticação");
        navigate("/login");
        return;
      }
      setSession(currentSession);
      
      // Check subscription only if we have a session
      if (currentSession) {
        checkSubscription(currentSession.user.id);
      } else {
        setLoading(false);
      }
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      console.log("Auth state changed:", _event, currentSession ? "session exists" : "no session");
      setSession(currentSession);

      if (!currentSession) {
        console.log("No session found, redirecting to login");
        setHasActiveSubscription(null);
        setLoading(false);
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        navigate("/login");
      } else if (_event === 'SIGNED_IN') {
        // Check subscription when user signs in
        checkSubscription(currentSession.user.id);
      } else if (currentSession && currentSession.user) {
        // Also check subscription for other auth events with a valid session
        checkSubscription(currentSession.user.id);
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const checkSubscription = async (userId: string, forceRefresh = false) => {
    try {
      console.log("Checking subscription for user:", userId, forceRefresh ? "(forced refresh)" : "");
      
      // Adiciona um parâmetro aleatório para evitar cache
      const cacheParam = forceRefresh ? `?cache=${Date.now()}` : '';
      
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["active", "trialing"])
        .maybeSingle();

      if (error) {
        console.error("Error checking subscription:", error);
        toast.error("Erro ao verificar assinatura");
        setHasActiveSubscription(false);
      } else {
        console.log("Subscription data:", data);
        const isActive = !!data;
        setHasActiveSubscription(isActive);
        
        // Se o usuário acabou de assinar com sucesso mas ainda não encontramos
        // a assinatura, tentar novamente após um breve atraso
        if (forceRefresh && !isActive) {
          console.log("Subscription not found yet after payment. Retrying in 3 seconds...");
          setTimeout(() => checkSubscription(userId, true), 3000);
        }
      }
    } catch (err) {
      console.error("Error in subscription check:", err);
      setHasActiveSubscription(false);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Carregando...</div>;
  }

  // Redirect to login if no session
  if (!session) {
    console.log("No session in protected route, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Show subscription required screen if no active subscription
  if (hasActiveSubscription === false) {
    console.log("No active subscription, showing pricing plans");
    return (
      <div className="flex flex-col items-center p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Assinatura Necessária</h1>
          <p className="text-muted-foreground mb-6">
            Para acessar o aplicativo, você precisa assinar um de nossos planos.
          </p>
        </div>
        <PricingPlans />
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
}
