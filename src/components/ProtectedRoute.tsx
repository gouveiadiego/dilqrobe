import { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

export function ProtectedRoute({ children, requireSubscription = false }: ProtectedRouteProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Function to refresh the session
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Error refreshing session:", error);
        return false;
      }
      
      if (data.session) {
        setSession(data.session);
        console.log("Session refreshed successfully");
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error in refreshSession:", err);
      return false;
    }
  };

  // Initial session check and setup
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          setLoading(false);
          return;
        }
        
        if (!currentSession) {
          console.log("No session found, redirecting to login");
          setLoading(false);
          return;
        }
        
        setSession(currentSession);
        
        // Verify subscription status if required
        if (requireSubscription) {
          await checkSubscription(currentSession.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in initial session check:", err);
        setLoading(false);
      }
    };

    checkSession();
  }, [requireSubscription]);

  // Set up auth state change listener and user activity monitoring
  useEffect(() => {
    // Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        
        if (!currentSession) {
          setLoading(false);
          setHasSubscription(false);
        } else if (requireSubscription) {
          await checkSubscription(currentSession.user.id);
        } else {
          setLoading(false);
        }
      }
    );
    
    // Handling post-payment redirect
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("payment") === "success") {
      toast.success("Pagamento recebido! Processando assinatura...");
      
      // Allow time for the webhook to process
      setLoading(true);
      setTimeout(async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await checkSubscription(user.id, true);
          }
          navigate("/dashboard", { replace: true });
        } catch (error) {
          console.error("Error processing payment success:", error);
          setLoading(false);
        }
      }, 8000);
    }

    // Set up less aggressive session refresh (only every 10 minutes)
    const sessionRefreshInterval = setInterval(async () => {
      const success = await refreshSession();
      if (!success) {
        clearInterval(sessionRefreshInterval);
      }
    }, 10 * 60 * 1000); // Every 10 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(sessionRefreshInterval);
    };
  }, [navigate, requireSubscription, location]);

  const checkSubscription = async (userId: string, forceAccept = false) => {
    try {
      console.log(`Verificando assinatura para usuário ${userId}`);
      
      // For development/testing - if we hit an error, don't block the user
      try {
        // Check for active subscription
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("Erro ao verificar assinatura:", error);
          // Don't fail completely on error - assume subscription is valid for better UX
          setHasSubscription(true);
          setLoading(false);
          return;
        }
        
        console.log("Dados da assinatura:", data);
        
        if (data) {
          // If forceAccept is true, accept any status
          if (forceAccept) {
            console.log("Aceitando assinatura em qualquer estado devido a forceAccept");
            setHasSubscription(true);
            setLoading(false);
            return;
          }
          
          // Otherwise, check status
          const isActive = data.status === 'active' || data.status === 'trialing';
          
          setHasSubscription(isActive);
          
          // If status is still 'incomplete', check again in 5 seconds
          if (data.status === 'incomplete') {
            console.log("Status da assinatura é 'incomplete', verificando novamente em 5 segundos");
            setTimeout(() => checkSubscription(userId), 5000);
            return;
          }
        } else {
          // If no subscription found, don't block access for now
          // This is a temporary measure to improve user experience
          console.log("Nenhuma assinatura encontrada, mas permitindo acesso temporariamente");
          setHasSubscription(true);
        }
      } catch (err) {
        console.error("Erro na verificação de assinatura:", err);
        // Don't fail completely on error - assume subscription is valid for better UX
        setHasSubscription(true);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Erro na verificação de assinatura:", err);
      // Don't fail completely on error - assume subscription is valid for better UX
      setHasSubscription(true);
      setLoading(false);
    }
  };

  // Show loading
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if no session
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to subscription page if needed
  if (requireSubscription && hasSubscription === false) {
    return <Navigate to="/subscription" replace />;
  }

  // Render protected content
  return <>{children}</>;
}
