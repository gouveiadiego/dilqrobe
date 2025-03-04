
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
      console.log("Checking subscription for protected route, user:", userId);
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'trialing'])
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error checking subscription in protected route:", error);
        return false;
      }
      
      console.log("Subscription check in protected route result:", data);
      
      if (!data) {
        console.log("No valid subscription found, redirecting to login");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in checkSubscription:", error);
      return false;
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: currentSession }, error }) => {
      if (error) {
        console.error("Error getting session:", error);
        toast.error("Erro ao verificar autenticação");
        navigate("/login");
        return;
      }
      
      setSession(currentSession);
      
      if (currentSession) {
        const hasSubscription = await checkSubscription(currentSession.user.id);
        setHasValidSubscription(hasSubscription);
        
        if (!hasSubscription) {
          navigate("/login");
        }
      }
      
      setLoading(false);
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      console.log("Auth state changed:", _event, currentSession ? "session exists" : "no session");
      setSession(currentSession);
      
      if (currentSession) {
        const hasSubscription = await checkSubscription(currentSession.user.id);
        setHasValidSubscription(hasSubscription);
        
        if (!hasSubscription) {
          navigate("/login");
        }
      } else {
        console.log("No session found, redirecting to login");
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        navigate("/login");
      }
      
      setLoading(false);
    });

    // Cleanup subscription
    return () => {
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
  if (!session || !hasValidSubscription) {
    console.log("No session or valid subscription in protected route, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return <>{children}</>;
}
