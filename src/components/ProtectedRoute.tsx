
import { useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useSubscription } from "@/hooks/useSubscription";
import { usePaymentSuccessHandler } from "@/hooks/usePaymentSuccessHandler";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

export function ProtectedRoute({ children, requireSubscription = false }: ProtectedRouteProps) {
  const { session, loading: sessionLoading } = useAuthSession();
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  
  const userId = session?.user?.id;
  
  const { hasSubscription, loading: subscriptionLoading, checkSubscription } = 
    useSubscription(requireSubscription ? userId : undefined);
  
  const handlePaymentSuccess = useCallback((userId: string) => {
    setIsCheckingSubscription(true);
    // Force accept the subscription since the payment just succeeded
    checkSubscription(userId, true);
    setIsCheckingSubscription(false);
  }, [checkSubscription]);
  
  usePaymentSuccessHandler(handlePaymentSuccess);

  const loading = sessionLoading || (requireSubscription && (subscriptionLoading || isCheckingSubscription));

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
