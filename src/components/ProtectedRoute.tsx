
import { useEffect, useState, useCallback, useRef } from "react";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Usar ref para controlar o intervalo de renovação
  const refreshIntervalRef = useRef<number | null>(null);
  const lastTokenRefreshRef = useRef<number>(Date.now());
  const isSessionCheckedRef = useRef<boolean>(false);

  // Renovação de sessão aprimorada
  const refreshSession = useCallback(async () => {
    if (isRefreshing) return false;
    
    try {
      setIsRefreshing(true);
      console.log("Tentando renovar sessão...");
      
      // Verificar se a última renovação foi há menos de 30 segundos
      const now = Date.now();
      if (now - lastTokenRefreshRef.current < 30000) {
        console.log("Ignorando renovação de token (última renovação muito recente)");
        return false;
      }
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Erro ao renovar sessão:", error);
        
        // Verificar se foi um erro de rede e tentar novamente mais tarde
        if (error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
          console.log("Erro de rede detectado, nova tentativa será feita quando a conexão for restaurada");
          return false;
        }
        
        return false;
      }
      
      if (data?.session) {
        lastTokenRefreshRef.current = Date.now();
        setSession(data.session);
        console.log("Sessão renovada com sucesso");
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("Erro em refreshSession:", err);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  // Configurar renovação periódica de sessão
  useEffect(() => {
    let isMounted = true;
    
    // Configurar um intervalo para renovação a cada 10 minutos
    if (session && !refreshIntervalRef.current) {
      refreshIntervalRef.current = window.setInterval(async () => {
        if (isMounted) {
          console.log("Executando renovação programada de sessão...");
          await refreshSession();
        }
      }, 10 * 60 * 1000); // 10 minutos em milissegundos
    }
    
    return () => {
      isMounted = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [session, refreshSession]);

  // Verificação inicial de sessão
  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      if (isSessionCheckedRef.current) return;
      
      try {
        console.log("Verificação inicial de sessão...");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erro ao obter sessão:", error);
          if (isMounted) setLoading(false);
          return;
        }
        
        if (!data?.session) {
          console.log("Nenhuma sessão encontrada, redirecionando para login");
          if (isMounted) setLoading(false);
          return;
        }
        
        isSessionCheckedRef.current = true;
        if (isMounted) setSession(data.session);
        
        if (requireSubscription && isMounted) {
          await checkSubscription(data.session.user.id);
        } else if (isMounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Erro na verificação inicial de sessão:", err);
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

  // Monitor de alterações de estado de autenticação
  useEffect(() => {
    let isMounted = true;
    
    try {
      console.log("Configurando listener de alterações de estado de autenticação...");
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, currentSession) => {
          console.log("Estado de autenticação alterado:", _event);
          if (!isMounted) return;
          
          if (currentSession) {
            setSession(currentSession);
            
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
            console.error("Erro ao processar sucesso de pagamento:", error);
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
      console.error("Erro ao configurar listeners de autenticação:", err);
      if (isMounted) {
        setLoading(false);
        setHasSubscription(false);
      }
    }
  }, [navigate, requireSubscription, location]);

  // Função de verificação de assinatura aprimorada com retentativas
  const checkSubscription = async (userId: string, forceAccept = false) => {
    const maxRetries = 3;
    let retryCount = 0;
    let success = false;
    
    while (retryCount < maxRetries && !success) {
      try {
        console.log(`Verificando assinatura para usuário ${userId} (tentativa ${retryCount + 1}/${maxRetries})`);
        
        let foundValidSubscription = false;
        
        try {
          const { data, error } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle();

          if (error) {
            // Tentar renovar sessão se houver erros de autenticação
            if (error.message?.includes("JWT")) {
              console.log("Problema de JWT detectado durante verificação de assinatura, tentando renovação...");
              const refreshed = await refreshSession();
              if (refreshed) {
                // Continuar para a próxima tentativa após renovação bem-sucedida
                retryCount++;
                continue;
              }
            }
            
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
            
            // Assinatura verificada com sucesso
            success = true;
          } else {
            console.log("Nenhuma assinatura encontrada para o usuário");
            foundValidSubscription = false;
            success = true; // Consideramos validado mesmo sem assinatura
          }
        } catch (err) {
          console.error("Erro na verificação de assinatura:", err);
          foundValidSubscription = false;
        }
        
        console.log(`Resultado da verificação de assinatura: ${foundValidSubscription}`);
        setHasSubscription(foundValidSubscription);
        setLoading(false);
        
        // Se tivemos sucesso, não precisamos mais tentar
        if (success) break;
        
        // Incrementar contador de tentativas
        retryCount++;
        
        // Esperar um pouco antes da próxima tentativa
        if (retryCount < maxRetries && !success) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      } catch (err) {
        console.error("Erro na verificação de assinatura:", err);
        setHasSubscription(false);
        setLoading(false);
        
        // Incrementar contador de tentativas
        retryCount++;
        
        // Esperar um pouco antes da próxima tentativa
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
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
      {children}
    </>
  );
}
