
import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import CompanyDetails from "./pages/CompanyDetails";
import ClientPortal from "./pages/ClientPortal";
import LandingPage from "./pages/LandingPage";
import Subscription from "./pages/Subscription";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Add title for the application
document.title = "DilQ Orbe - Sistema para gerenciamento eficiente com produtividade e propósito";

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/subscription" element={<Subscription />} />
        
        {/* Use a nested route for dashboard to handle refreshes better */}
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } 
        />
        
        {/* Modified ClientPortal route - no longer wrapped in ProtectedRoute */}
        <Route path="/client-portal" element={<ClientPortal />} />
        
        <Route
          path="/company/:companyId"
          element={
            <ProtectedRoute>
              <CompanyDetails />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster 
        position="top-right" 
        theme="light"
        className="bg-white text-black border-gray-200"
        richColors
      />
    </>
  );
}

export default App;
