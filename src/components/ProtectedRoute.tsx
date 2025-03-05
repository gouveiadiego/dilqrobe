
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
  const [subscriptionCheckAttempts, setSubscriptionCheckAttempts] = useState(0);
  const [lastPaymentCheck, setLastPaymentCheck] = useState<number>(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for payment status parameters and force reload subscription check
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const success = queryParams.get('success');
    const subscription = queryParams.get('subscription');
    const timestamp = queryParams.get('timestamp');
    
    // Clean URL without reloading page
    if (success || subscription || timestamp) {
      const cleanedUrl = location.pathname;
      window.history.replaceState({}, document.title, cleanedUrl);
    }
    
    if (success === 'true' || subscription === 'active') {
      console.log("Detected successful payment return, forcing subscription check");
      
      if (session && session.user) {
        // Force subscription check with a slight delay to allow webhook processing
        toast.success("Verificando assinatura... Por favor, aguarde.");
        
        // Set timestamp of this check to prevent duplicate checks
        setLastPaymentCheck(Date.now());
        
        // Reset attempts counter for new payment flow
        setSubscriptionCheckAttempts(0);
        
        // Start checking immediately for the new subscription
        checkSubscription(session.user.id, true);
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
      console.log("Checking subscription for user:", userId, 
        forceRefresh ? "(forced refresh)" : "", 
        "Attempt:", subscriptionCheckAttempts + 1);
      
      // If this is not a forced check and we just did a payment check in the last 5 seconds, skip
      if (!forceRefresh && (Date.now() - lastPaymentCheck < 5000)) {
        console.log("Skipping duplicate check, recently checked after payment");
        return;
      }
      
      // First try to get an active subscription
      let { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["active", "trialing"])
        .maybeSingle();

      // If no active subscription found, check for pending subscription
      if ((!data || error) && (!forceRefresh || subscriptionCheckAttempts < 1)) {
        console.log("No active subscription found, checking for pending subscription");
        
        const { data: pendingData, error: pendingError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "pending")
          .maybeSingle();
          
        if (pendingError) {
          console.error("Error checking pending subscription:", pendingError);
        } else if (pendingData) {
          console.log("Pending subscription found, will retry check soon");
          data = pendingData;
        }
      }

      if (error) {
        console.error("Error checking subscription:", error);
        toast.error("Erro ao verificar assinatura");
        setHasActiveSubscription(false);
      } else {
        console.log("Subscription data:", data);
        
        // If we have a pending subscription, retry check after a delay
        if (data && data.status === "pending") {
          console.log("Pending subscription found, will retry check in a few seconds");
          
          // If there's a pending subscription, check again soon
          if (subscriptionCheckAttempts < 12) { // Limit to 12 attempts (about 1 minute)
            setSubscriptionCheckAttempts(prev => prev + 1);
            setTimeout(() => checkSubscription(userId, true), 5000);
            
            // Don't update hasActiveSubscription state yet
            return;
          } else {
            // After many attempts, suggest manual refresh
            toast.info("Sua assinatura está sendo processada. Tente recarregar a página em alguns instantes.");
          }
        }
        
        // A subscription is active if:
        // 1. It exists AND
        // 2. Has status "active" or "trialing"
        const isActive = !!data && (data.status === "active" || data.status === "trialing");
        
        // If the user just successfully paid and we don't find the subscription yet,
        // try again
        if (forceRefresh && !isActive && subscriptionCheckAttempts < 12) {
          console.log(`Subscription not found yet after payment. Retrying in 5s (Attempt ${subscriptionCheckAttempts + 1}/12)`);
          
          // Increment the attempts counter
          setSubscriptionCheckAttempts(prev => prev + 1);
          
          // Check again after 5 seconds
          setTimeout(() => checkSubscription(userId, true), 5000);
          
          // Don't update hasActiveSubscription state yet
          return;
        } else if (forceRefresh && !isActive && subscriptionCheckAttempts >= 12) {
          // After 12 attempts still not found, show a more friendly message
          toast.info("Sua assinatura está sendo processada. Você pode precisar recarregar a página para acessar o conteúdo.");
          
          // Try one last time with a direct database call
          try {
            const { data: dataFinal, error: errorFinal } = await supabase
              .from("subscriptions")
              .select("*")
              .eq("user_id", userId)
              .in("status", ["active", "trialing"])
              .maybeSingle();
              
            if (!errorFinal && dataFinal) {
              setHasActiveSubscription(true);
              toast.success("Assinatura ativada com sucesso!");
              return;
            }
          } catch (err) {
            console.error("Final subscription check failed:", err);
          }
        }
        
        // Update subscription state
        setHasActiveSubscription(isActive);
        
        // If we found the subscription after attempts, show success message
        if (isActive && subscriptionCheckAttempts > 0) {
          toast.success("Assinatura ativada com sucesso!");
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
