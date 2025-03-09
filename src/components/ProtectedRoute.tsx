
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
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

  useEffect(() => {
    // Get initial session
    const checkSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          toast.error("Erro ao verificar autenticação");
          setLoading(false);
          return;
        }
        
        setSession(currentSession);
        
        // Check subscription status if user is authenticated and subscription is required
        if (currentSession && requireSubscription) {
          await checkSubscription(currentSession.user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in session check:", err);
        setLoading(false);
      }
    };

    checkSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      console.log("Auth state changed:", _event, currentSession ? "session exists" : "no session");
      setSession(currentSession);
      
      if (!currentSession) {
        console.log("No session found, redirecting to login");
        setLoading(false);
        setHasSubscription(false);
      } else if (requireSubscription) {
        // Check subscription status whenever auth state changes if subscription is required
        await checkSubscription(currentSession.user.id);
      } else {
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, requireSubscription]);

  const checkSubscription = async (userId: string) => {
    try {
      // Check if user has an active subscription
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        console.error("Error checking subscription:", error);
        setHasSubscription(false);
      } else {
        setHasSubscription(!!data);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error in subscription check:", err);
      setHasSubscription(false);
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if no session
  if (!session) {
    console.log("No session in protected route, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // If subscription is required but user doesn't have one, redirect to subscription page
  if (requireSubscription && hasSubscription === false) {
    console.log("No active subscription, redirecting to subscription page");
    return <Navigate to="/subscription" replace />;
  }

  // Render protected content
  return <>{children}</>;
}
