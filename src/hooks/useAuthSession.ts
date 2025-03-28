
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshSession = async (retryCount = 0) => {
    try {
      console.log("Attempting to refresh session...");
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Error refreshing session:", error);
        
        if (isOnline && retryCount < 3 && error.message.includes('network')) {
          console.log(`Retrying session refresh (attempt ${retryCount + 1}/3)...`);
          setTimeout(() => refreshSession(retryCount + 1), 1000);
          return false;
        }
        
        if (error.message.includes('JWT')) {
          console.log("JWT expired, redirecting to login");
          toast.error("Sua sessão expirou. Por favor, faça login novamente.");
          navigate('/login', { replace: true });
          return false;
        }
        
        return false;
      }
      
      if (data?.session) {
        setSession(data.session);
        console.log("Session refreshed successfully");
        return true;
      }
      
      return false;
    } catch (err) {
      console.error("Error in refreshSession:", err);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const checkSession = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          if (isMounted) setLoading(false);
          return;
        }
        
        if (!data?.session) {
          console.log("No session found, redirecting to login");
          if (isMounted) setLoading(false);
          return;
        }
        
        if (isMounted) {
          setSession(data.session);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in initial session check:", err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSession();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;
    let sessionRefreshInterval: number | null = null;
    let activityTimeout: number | null = null;
    
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, currentSession) => {
          if (!isMounted) return;
          
          if (currentSession) {
            setSession(currentSession);
            setLoading(false);
          } else {
            setSession(null);
            setLoading(false);
          }
        }
      );
      
      authSubscription = subscription;

      // Set up session refresh interval
      sessionRefreshInterval = window.setInterval(() => {
        if (!isMounted) return;
        // Use a function that calls the async function
        const doRefresh = async () => {
          await refreshSession();
        };
        doRefresh();
      }, 2 * 60 * 1000);

      // Monitor user activity to refresh session
      const resetActivityTimeout = () => {
        if (activityTimeout) clearTimeout(activityTimeout);
        
        activityTimeout = window.setTimeout(() => {
          console.log("User inactive, refreshing session...");
          if (session) {
            // Use a function that calls the async function
            const doRefresh = async () => {
              await refreshSession();
            };
            doRefresh();
          }
        }, 4 * 60 * 1000);
      };

      const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
      activityEvents.forEach(event => {
        window.addEventListener(event, resetActivityTimeout);
      });

      resetActivityTimeout();

      return () => {
        isMounted = false;
        if (authSubscription && typeof authSubscription.unsubscribe === 'function') {
          authSubscription.unsubscribe();
        }
        if (sessionRefreshInterval !== null) {
          window.clearInterval(sessionRefreshInterval);
        }
        if (activityTimeout !== null) {
          window.clearTimeout(activityTimeout);
        }
        activityEvents.forEach(event => {
          window.removeEventListener(event, resetActivityTimeout);
        });
      };
    } catch (err) {
      console.error("Error setting up auth listeners:", err);
      if (isMounted) {
        setLoading(false);
      }
      return () => { isMounted = false; };
    }
  }, [session, navigate]);

  return { session, loading, refreshSession };
}
