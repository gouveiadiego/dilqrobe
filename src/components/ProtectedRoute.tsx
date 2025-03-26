import { useEffect, useState } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SessionTimeoutModal } from "./SessionTimeoutModal";

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
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  const INACTIVITY_TIMEOUT = 60 * 1000; // 1 minute of inactivity before session expires
  const SESSION_CHECK_INTERVAL = 10 * 1000; // 10 seconds between checks
  const SESSION_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer before expiry

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

  useEffect(() => {
    const handleUserActivity = () => {
      setLastActivity(Date.now());
      
      if (showTimeoutModal) {
        refreshSession().then(success => {
          if (success) {
            setShowTimeoutModal(false);
          }
        });
      }
    };

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
  }, [showTimeoutModal]);

  useEffect(() => {
    const intervalId = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;

      if (timeSinceLastActivity > INACTIVITY_TIMEOUT && session && !showTimeoutModal) {
        console.log("User inactive for too long, showing timeout modal");
        setShowTimeoutModal(true);
        return;
      }

      if (timeSinceLastActivity < INACTIVITY_TIMEOUT && session && !showTimeoutModal) {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          
          if (currentSession) {
            const expiresAt = currentSession.expires_at;
            if (expiresAt) {
              const expiresAtMs = expiresAt * 1000;
              const timeToExpiry = expiresAtMs - now;
              
              if (timeToExpiry < SESSION_EXPIRY_BUFFER) {
                console.log(`Session nearing expiry (${Math.round(timeToExpiry/1000)}s remaining), refreshing...`);
                await refreshSession();
              }
            }
          } else if (session) {
            console.log("Session state mismatch, attempting refresh...");
            const success = await refreshSession();
            if (!success) {
              console.log("Session refresh failed, showing timeout modal");
              setShowTimeoutModal(true);
            }
          }
        } catch (error) {
          console.error("Error checking session:", error);
        }
      }
    }, SESSION_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [lastActivity, session, showTimeoutModal]);

  const handleTimeoutModalClose = () => {
    setShowTimeoutModal(false);
  };

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
    
    try {
      console.log("Setting up auth state change listener...");
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, currentSession) => {
          console.log("Auth state changed:", _event);
          if (!isMounted) return;
          
          if (currentSession) {
            setSession(currentSession);
            setLastActivity(Date.now());
            
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
      
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get("payment") === "success") {
        toast.success("Pagamento recebido! Processando assinatura...");
        
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

  return (
    <>
      <SessionTimeoutModal 
        isOpen={showTimeoutModal} 
        onClose={handleTimeoutModalClose} 
      />
      {children}
    </>
  );
}
