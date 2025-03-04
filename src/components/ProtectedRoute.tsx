
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasValidSubscription, setHasValidSubscription] = useState(false);
  const navigate = useNavigate();

  // Check if user has a valid subscription
  const checkSubscription = async (userId: string) => {
    try {
      console.log("Checking subscription for user:", userId);
      
      // Fetch the subscription directly with detailed logging
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing', 'paused'])
        .maybeSingle();
      
      if (error) {
        console.error("Subscription check error:", error.message, "Code:", error.code);
        return false;
      }
      
      console.log("Subscription check result:", data);
      
      if (!data) {
        console.log("No active subscription found. Redirecting to login");
        return false;
      }
      
      console.log("Valid subscription found with status:", data.status);
      return true;
    } catch (error) {
      console.error("Error in checkSubscription:", error);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth and checking session...");
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          toast.error("Erro ao verificar autenticação");
          navigate("/login");
          return;
        }
        
        if (mounted) {
          if (currentSession) {
            console.log("Session found for user:", currentSession.user.id);
            setSession(currentSession);
            
            const hasSubscription = await checkSubscription(currentSession.user.id);
            
            if (mounted) {
              setHasValidSubscription(hasSubscription);
              
              if (!hasSubscription) {
                console.log("No valid subscription found, redirecting to login");
                toast.error("Assinatura não encontrada ou inválida. Por favor, verifique seu pagamento.");
                navigate("/login");
              } else {
                console.log("Valid subscription confirmed, proceeding to protected content");
                toast.success("Bem-vindo de volta!");
              }
            }
          } else {
            console.log("No session found, user not logged in");
          }
          
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in initializeAuth:", err);
        if (mounted) {
          setLoading(false);
          navigate("/login");
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      console.log("Auth state changed:", _event, currentSession ? "session exists" : "no session");
      
      if (!mounted) return;
      
      setSession(currentSession);
      
      if (currentSession) {
        console.log("Auth state change - checking subscription for user:", currentSession.user.id);
        const hasSubscription = await checkSubscription(currentSession.user.id);
        
        if (mounted) {
          setHasValidSubscription(hasSubscription);
          
          if (!hasSubscription) {
            console.log("No valid subscription found after auth change");
            toast.error("Assinatura não encontrada ou inválida. Por favor, verifique seu pagamento.");
            navigate("/login");
          } else {
            console.log("Valid subscription confirmed after auth change");
          }
        }
      } else {
        console.log("No session found after auth change, redirecting to login");
        navigate("/login");
      }
      
      setLoading(false);
    });

    // Cleanup subscription and mounted flag
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#080a12]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-dilq-accent mx-auto" />
          <p className="mt-4 text-lg text-gray-300">Carregando...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if no session or no valid subscription
  if (!session) {
    console.log("No session in protected route, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  if (!hasValidSubscription) {
    console.log("No valid subscription in protected route, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return <>{children}</>;
}
