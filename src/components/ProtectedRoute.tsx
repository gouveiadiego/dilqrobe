
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession) {
          setSession(null);
          setLoading(false);
          return;
        }

        // Verify if the session is still valid
        const { error: sessionError } = await supabase.auth.refreshSession();
        
        if (sessionError) {
          console.error("Session refresh error:", sessionError);
          await supabase.auth.signOut();
          setSession(null);
          toast.error("Sessão expirada. Por favor, faça login novamente.");
          return;
        }

        setSession(currentSession);
      } catch (error) {
        console.error("Error in session check:", error);
        await supabase.auth.signOut();
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event);
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setSession(null);
        toast.info("Você foi desconectado");
      } else if (event === 'SIGNED_IN') {
        console.log('User signed in');
        setSession(currentSession);
        toast.success("Login realizado com sucesso");
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token was refreshed successfully');
        setSession(currentSession);
      } else if (event === 'USER_UPDATED') {
        console.log('User was updated');
        setSession(currentSession);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    console.log("No session found, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
