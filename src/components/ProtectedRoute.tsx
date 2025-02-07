
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

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
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          if (error.message.includes("Invalid Refresh Token")) {
            console.log("Invalid refresh token, signing out");
            await supabase.auth.signOut();
            setSession(null);
          } else {
            console.error("Error getting session:", error);
            setSession(null);
          }
        } else {
          setSession(session);
        }
      } catch (error) {
        console.error("Error in session check:", error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state changed:", _event);
      
      if (_event === 'TOKEN_REFRESHED') {
        console.log('Token was refreshed successfully');
      } else if (_event === 'SIGNED_OUT') {
        console.log('User signed out');
      }
      
      setSession(session);
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
