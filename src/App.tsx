
import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import Login from "@/pages/Login";
import ClientPortal from "@/pages/ClientPortal";
import Dashboard from "@/pages/Dashboard";

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);
  
  return (
    <>
      <Toaster richColors />
      <Routes>
        <Route
          path="/"
          element={session ? <Dashboard /> : <Login />}
        />
        <Route path="/client-portal" element={<ClientPortal />} />
      </Routes>
    </>
  );
}

export default App;
