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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshSession = async (retryCount = 0) => {
    try {
      console.log("Attempting to refresh session...");
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Error refreshing session:", error);
        
        if (isOnline && retryCount < 3 && error.message.includes('network')) {
          console.log(`Retrying session refresh (attempt ${retryCount + 1}/3)...`);
          setTimeout(() => refreshSession(retryCount + 1), 1000);
          return false;
        }
        
        if (error.message.includes('JWT')) {
          console.log("JWT expired, redirecting to login");
          toast.error("Sua sessão expirou. Por favor, faça login novamente.");
          navigate('/login', { replace: true });
          return false;
        }
        
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

  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      try {
        setLoading(true);
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

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;
    let sessionRefreshInterval: number | null = null;
    let activityTimeout: number | null = null;
    
    try {
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
      
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get("payment") === "success") {
        toast.success("Pagamento recebido! Processando assinatura...");
        
        if (isMounted) setLoading(true);
        const timeoutId = setTimeout(async () => {
          try {
            if (!isMounted) return;
            
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
              setHasSubscription(true);
              await checkSubscription(data.user.id, true);
              navigate("/dashboard", { replace: true });
            }
          } catch (error) {
            console.error("Error processing payment success:", error);
            if (isMounted) {
              setLoading(false);
              setHasSubscription(false);
            }
            navigate("/dashboard", { replace: true });
          }
        }, 5000);
        
        return () => {
          clearTimeout(timeoutId);
        };
      }

      sessionRefreshInterval = window.setInterval(async () => {
        if (!isMounted) return;
        await refreshSession();
      }, 2 * 60 * 1000);

      const resetActivityTimeout = () => {
        if (activityTimeout) clearTimeout(activityTimeout);
        
        activityTimeout = window.setTimeout(async () => {
          console.log("User inactive, refreshing session...");
          if (session) await refreshSession();
        }, 4 * 60 * 1000);
      };

      const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
      activityEvents.forEach(event => {
        window.addEventListener(event, resetActivityTimeout);
      });

      resetActivityTimeout();

      return () => {
        isMounted = false;
        if (authSubscription && typeof authSubscription.unsubscribe === 'function') {
          authSubscription.unsubscribe();
        }
        if (sessionRefreshInterval !== null) {
          window.clearInterval(sessionRefreshInterval);
        }
        if (activityTimeout !== null) {
          window.clearTimeout(activityTimeout);
        }
        activityEvents.forEach(event => {
          window.removeEventListener(event, resetActivityTimeout);
        });
      };
    } catch (err) {
      console.error("Error setting up auth listeners:", err);
      if (isMounted) {
        setLoading(false);
        setHasSubscription(false);
      }
      return () => { isMounted = false; };
    }
  }, [navigate, requireSubscription, location, session]);

  const checkSubscription = async (userId: string, forceAccept = false) => {
    try {
      console.log(`Verificando assinatura para usuário ${userId}`);
      
      const isTestMode = false;
      
      let foundValidSubscription = false;
      
      try {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("Erro ao verificar assinatura:", error);
          foundValidSubscription = false;
        } else if (data) {
          if (forceAccept) {
            console.log("Aceitando assinatura em qualquer estado devido a forceAccept");
            foundValidSubscription = true;
          } else {
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requireSubscription && hasSubscription === false) {
    return <Navigate to="/subscription" replace />;
  }

  return <>{children}</>;
}
