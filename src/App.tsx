
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import Login from "@/pages/Login";
import ClientPortal from "@/pages/ClientPortal";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  // Simple dashboard component while we wait for the real one
  const Dashboard = () => (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Welcome to your dashboard. This is a placeholder.</p>
      <button 
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        onClick={() => supabase.auth.signOut()}
      >
        Sign Out
      </button>
    </div>
  );
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return (
    <Router>
      <Toaster richColors />
      <Routes>
        <Route
          path="/"
          element={session ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/client-portal" element={<ClientPortal />} />
      </Routes>
    </Router>
  );
}

export default App;
