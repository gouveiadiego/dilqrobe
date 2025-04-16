
import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import Login from "@/pages/Login";
import ClientPortal from "@/pages/ClientPortal";

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
    <Router>
      <Toaster richColors />
      <Routes>
        <Route
          path="/"
          element={session ? <div>Dashboard will go here</div> : <Login />}
        />
        <Route path="/client-portal" element={<ClientPortal />} />
      </Routes>
    </Router>
  );
}

export default App;
