
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

  // Função para renovar a sessão automaticamente
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error("Erro ao renovar sessão:", error);
        // Se não conseguir renovar, tentamos pegar a sessão atual
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
      } else {
        setSession(data.session);
      }
    } catch (err) {
      console.error("Erro ao renovar sessão:", err);
    }
  };

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

    // Configurar refresh automático da sessão a cada 10 minutos
    const refreshInterval = setInterval(refreshSession, 10 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [navigate, requireSubscription, location]);

  // Configurar detecção de atividade do usuário
  useEffect(() => {
    const handleUserActivity = () => {
      // Renovar a sessão em caso de atividade do usuário
      refreshSession();
    };

    // Adicionar listeners para eventos de atividade
    window.addEventListener("click", handleUserActivity);
    window.addEventListener("keypress", handleUserActivity);
    window.addEventListener("scroll", handleUserActivity);
    window.addEventListener("mousemove", handleUserActivity);

    return () => {
      // Remover listeners ao desmontar o componente
      window.removeEventListener("click", handleUserActivity);
      window.removeEventListener("keypress", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
      window.removeEventListener("mousemove", handleUserActivity);
    };
  }, []);

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
