
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function usePaymentSuccessHandler(onPaymentSuccess: (userId: string) => void) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    // Handle payment_success=true parameter
    if (searchParams.get("payment_success") === "true") {
      console.log("Payment success detected in URL, navigating to dashboard");
      toast.success("Pagamento recebido! Assinatura ativada.");
      
      // Remove the payment_success parameter from the URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("payment_success");
      newUrl.searchParams.delete("session_id");
      window.history.replaceState({}, document.title, newUrl.toString());
      
      // Create a separate async function to handle the async operations
      const processPaymentSuccess = async () => {
        try {
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            onPaymentSuccess(data.user.id);
          }
        } catch (error) {
          console.error("Error processing payment success:", error);
        }
      };
      
      // Call the async function
      processPaymentSuccess();
    }
    // Handle payment=success parameter
    else if (searchParams.get("payment") === "success") {
      toast.success("Pagamento recebido! Processando assinatura...");
      
      setTimeout(async () => {
        try {
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            onPaymentSuccess(data.user.id);
            navigate("/dashboard", { replace: true });
          }
        } catch (error) {
          console.error("Error processing payment success:", error);
          navigate("/dashboard", { replace: true });
        }
      }, 2000);
    }
  }, [location, navigate, onPaymentSuccess]);
}
