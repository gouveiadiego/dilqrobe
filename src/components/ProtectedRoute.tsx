
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

  // Function to refresh the session
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Error refreshing session:", error);
        return;
      }
      
      if (data.session) {
        setSession(data.session);
      }
    } catch (err) {
      console.error("Error in refreshSession:", err);
    }
  };

  // Set up user activity listeners
  useEffect(() => {
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    let inactivityTimer: number;

    const handleUserActivity = () => {
      clearTimeout(inactivityTimer);
      // Refresh the session after 5 minutes of inactivity when user becomes active again
      inactivityTimer = window.setTimeout(() => {
        refreshSession();
      }, 5 * 60 * 1000);
    };

    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    // Start initial timer
    handleUserActivity();

    // Set up periodic refresh every 10 minutes regardless of activity
    const periodicRefresh = setInterval(refreshSession, 10 * 60 * 1000);

    return () => {
      // Clean up event listeners
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearTimeout(inactivityTimer);
      clearInterval(periodicRefresh);
    };
  }, []);

  useEffect(() => {
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
        
        // Verificar status de assinatura
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

    // Configurar listener de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      
      if (!currentSession) {
        setLoading(false);
        setHasSubscription(false);
      } else if (requireSubscription) {
        await checkSubscription(currentSession.user.id);
      } else {
        setLoading(false);
      }
    });

    // Tratamento para redirecionamento após pagamento
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("payment") === "success") {
      toast.success("Pagamento recebido! Processando assinatura...");
      
      // Permitir tempo para o webhook processar
      setLoading(true);
      setTimeout(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await checkSubscription(user.id, true);
        }
        navigate("/dashboard", { replace: true });
      }, 8000);  // Aumentado para 8 segundos
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, requireSubscription, location]);

  const checkSubscription = async (userId: string, forceAccept = false) => {
    try {
      console.log(`Verificando assinatura para usuário ${userId}`);
      
      // Verificar assinatura ativa
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Erro ao verificar assinatura:", error);
        setHasSubscription(false);
        setLoading(false);
        return;
      }
      
      console.log("Dados da assinatura:", data);
      
      if (data) {
        // Se forceAccept for true, aceitar qualquer status
        if (forceAccept) {
          console.log("Aceitando assinatura em qualquer estado devido a forceAccept");
          setHasSubscription(true);
          setLoading(false);
          return;
        }
        
        // Caso contrário, verificar status
        const isActive = data.status === 'active' || data.status === 'trialing';
        
        setHasSubscription(isActive);
        
        // Caso ainda seja 'incomplete', verificar novamente em 5 segundos
        if (data.status === 'incomplete') {
          console.log("Status da assinatura é 'incomplete', verificando novamente em 5 segundos");
          setTimeout(() => checkSubscription(userId), 5000);
        }
      } else {
        setHasSubscription(false);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Erro na verificação de assinatura:", err);
      setHasSubscription(false);
      setLoading(false);
    }
  };

  // Mostrar carregamento
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirecionar para login se não houver sessão
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Redirecionar para página de assinatura se necessário
  if (requireSubscription && hasSubscription === false) {
    return <Navigate to="/subscription" replace />;
  }

  // Renderizar conteúdo protegido
  return <>{children}</>;
}
