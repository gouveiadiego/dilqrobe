
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
      
      if (data?.session) {
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
    let isMounted = true;
    
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          if (isMounted) setLoading(false);
          return;
        }
        
        if (!data?.session) {
          console.log("No session found, redirecting to login");
          if (isMounted) setLoading(false);
          return;
        }
        
        if (isMounted) setSession(data.session);
        
        // Verify subscription status if required
        if (requireSubscription && isMounted) {
          await checkSubscription(data.session.user.id);
        } else if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in initial session check:", err);
        if (isMounted) {
          setLoading(false);
          // Don't default to allow access on error
          setHasSubscription(false);
        }
      }
    };

    checkSession();
    
    return () => {
      isMounted = false;
    };
  }, [requireSubscription]);

  // Set up auth state change listener and user activity monitoring
  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;
    let sessionRefreshInterval: number | null = null;
    
    // Error boundary for auth state change listener
    try {
      // Auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, currentSession) => {
          if (!isMounted) return;
          
          if (currentSession) {
            setSession(currentSession);
            
            if (requireSubscription) {
              await checkSubscription(currentSession.user.id);
            } else {
              setLoading(false);
            }
          } else {
            setSession(null);
            setLoading(false);
            setHasSubscription(false);
          }
        }
      );
      
      authSubscription = subscription;
      
      // Handling post-payment redirect
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get("payment") === "success") {
        toast.success("Pagamento recebido! Processando assinatura...");
        
        // Allow time for the webhook to process
        if (isMounted) setLoading(true);
        const timeoutId = setTimeout(async () => {
          try {
            if (!isMounted) return;
            
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
              await checkSubscription(data.user.id, true);
            }
            navigate("/dashboard", { replace: true });
          } catch (error) {
            console.error("Error processing payment success:", error);
            // Don't block the user on error
            if (isMounted) {
              setLoading(false);
              // Don't default to allowing access on error
              setHasSubscription(false);
            }
            navigate("/dashboard", { replace: true });
          }
        }, 8000);
        
        return () => {
          clearTimeout(timeoutId);
        };
      }

      // Set up less aggressive session refresh (only every 10 minutes)
      sessionRefreshInterval = window.setInterval(async () => {
        if (!isMounted) return;
        const success = await refreshSession();
        if (!success && sessionRefreshInterval !== null) {
          window.clearInterval(sessionRefreshInterval);
        }
      }, 10 * 60 * 1000); // Every 10 minutes
    } catch (err) {
      console.error("Error setting up auth listeners:", err);
      if (isMounted) {
        setLoading(false);
        // Don't default to allowing access on error
        setHasSubscription(false);
      }
    }

    return () => {
      isMounted = false;
      if (authSubscription && typeof authSubscription.unsubscribe === 'function') {
        authSubscription.unsubscribe();
      }
      if (sessionRefreshInterval !== null) {
        window.clearInterval(sessionRefreshInterval);
      }
    };
  }, [navigate, requireSubscription, location]);

  const checkSubscription = async (userId: string, forceAccept = false) => {
    try {
      console.log(`Verificando assinatura para usuário ${userId}`);
      
      // Do not default to allowing access - only allow if we confirm subscription
      let foundValidSubscription = false;
      
      try {
        // Check for active subscription
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("Erro ao verificar assinatura:", error);
          // Don't default to success on error
          foundValidSubscription = false;
        } else if (data) {
          // If forceAccept is true, accept any status
          if (forceAccept) {
            console.log("Aceitando assinatura em qualquer estado devido a forceAccept");
            foundValidSubscription = true;
          } else {
            // Otherwise, check status
            const isActive = data.status === 'active' || data.status === 'trialing';
            foundValidSubscription = isActive;
            console.log(`Status da assinatura: ${data.status}, isActive: ${isActive}`);
          }
        } else {
          console.log("Nenhuma assinatura encontrada para o usuário");
          foundValidSubscription = false;
        }
      } catch (err) {
        console.error("Erro na verificação de assinatura:", err);
        // Don't default to success on error
        foundValidSubscription = false;
      }
      
      console.log(`Resultado da verificação de assinatura: ${foundValidSubscription}`);
      setHasSubscription(foundValidSubscription);
      setLoading(false);
    } catch (err) {
      console.error("Erro na verificação de assinatura:", err);
      // Don't default to success
      setHasSubscription(false);
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
