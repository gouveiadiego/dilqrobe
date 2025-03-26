
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
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to refresh the session
  const refreshSession = async () => {
    if (isRefreshing) return false;
    
    try {
      setIsRefreshing(true);
      console.log("Attempting to refresh session...");
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
    } finally {
      setIsRefreshing(false);
    }
  };

  // Monitor user activity
  useEffect(() => {
    const handleUserActivity = () => {
      setLastActivity(Date.now());
    };

    // Add event listeners for user activity
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('mousemove', handleUserActivity);

    return () => {
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('mousemove', handleUserActivity);
    };
  }, []);

  // Automatic session refresh based on activity
  useEffect(() => {
    const INACTIVITY_THRESHOLD = 30 * 1000; // 30 seconds of inactivity before we start checking session
    const SESSION_CHECK_INTERVAL = 15 * 1000; // 15 seconds between checks
    const SESSION_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer before expiry

    const intervalId = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;

      // If user has been active recently or inactive for less than threshold, ensure session is valid
      if (timeSinceLastActivity < INACTIVITY_THRESHOLD || session) {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          
          // If session exists but is close to expiry, refresh it
          if (currentSession) {
            const expiresAt = currentSession.expires_at;
            if (expiresAt) {
              const expiresAtMs = expiresAt * 1000;
              const timeToExpiry = expiresAtMs - now;
              
              // If session expires soon, refresh it
              if (timeToExpiry < SESSION_EXPIRY_BUFFER) {
                console.log(`Session nearing expiry (${Math.round(timeToExpiry/1000)}s remaining), refreshing...`);
                await refreshSession();
              }
            }
          } else if (session) {
            // If we think we have a session but supabase doesn't, refresh
            console.log("Session state mismatch, attempting refresh...");
            const success = await refreshSession();
            if (!success) {
              console.log("Session refresh failed, redirecting to login");
              toast.error("Sua sessão expirou. Por favor, faça login novamente.");
              setSession(null);
              navigate('/login', { replace: true });
            }
          }
        } catch (error) {
          console.error("Error checking session:", error);
        }
      }
    }, SESSION_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [lastActivity, session, navigate]);

  // Initial session check and setup
  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      try {
        console.log("Initial session check...");
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
          setHasSubscription(false);
        }
      }
    };

    checkSession();
    
    return () => {
      isMounted = false;
    };
  }, [requireSubscription]);

  // Set up auth state change listener
  useEffect(() => {
    let isMounted = true;
    
    // Error boundary for auth state change listener
    try {
      console.log("Setting up auth state change listener...");
      // Auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, currentSession) => {
          console.log("Auth state changed:", _event);
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
            if (isMounted) {
              setLoading(false);
              setHasSubscription(false);
            }
            navigate("/dashboard", { replace: true });
          }
        }, 8000);
        
        return () => {
          clearTimeout(timeoutId);
        };
      }

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    } catch (err) {
      console.error("Error setting up auth listeners:", err);
      if (isMounted) {
        setLoading(false);
        setHasSubscription(false);
      }
    }
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
        foundValidSubscription = false;
      }
      
      console.log(`Resultado da verificação de assinatura: ${foundValidSubscription}`);
      setHasSubscription(foundValidSubscription);
      setLoading(false);
    } catch (err) {
      console.error("Erro na verificação de assinatura:", err);
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
