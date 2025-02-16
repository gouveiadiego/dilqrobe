
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
    // Retrieve stored session data
    const accessToken = localStorage.getItem('supabase.auth.token');
    const refreshToken = localStorage.getItem('supabase.auth.refreshToken');

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);

      if (currentSession) {
        // Update stored tokens when session changes
        localStorage.setItem('supabase.auth.token', currentSession.access_token);
        localStorage.setItem('supabase.auth.refreshToken', currentSession.refresh_token);
      } else {
        // Clear stored tokens if session is null
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.refreshToken');
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoading(false);

      if (currentSession) {
        localStorage.setItem('supabase.auth.token', currentSession.access_token);
        localStorage.setItem('supabase.auth.refreshToken', currentSession.refresh_token);
      }
    });

    // Try to recover session if we have stored tokens
    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).then(({ data: { session: recoveredSession } }) => {
        if (recoveredSession) {
          setSession(recoveredSession);
        }
      });
    }

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Show loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if no session
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content
  return <>{children}</>;
}
