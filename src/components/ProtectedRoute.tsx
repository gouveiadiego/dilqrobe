
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

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
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (error) {
        console.error("Error getting session:", error);
        toast.error("Erro ao verificar autenticação");
        navigate("/login");
        return;
      }
      setSession(currentSession);
      
      // Check subscription status if user is authenticated
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
        setLoading(false);
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        navigate("/login");
      } else {
        // Check subscription status whenever auth state changes
        checkSubscription(currentSession.user.id);
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

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
      }

      setHasSubscription(!!data);
      setLoading(false);
    } catch (err) {
      console.error("Error in subscription check:", err);
      setHasSubscription(false);
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
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
