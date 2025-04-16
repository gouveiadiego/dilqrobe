import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Account from "@/pages/Account";
import Tasks from "@/pages/Tasks";
import Budgets from "@/pages/Budgets";
import RunningChallenges from "@/pages/RunningChallenges";
import Finance from "@/pages/Finance";
import Journal from "@/pages/Journal";
import Habits from "@/pages/Habits";
import Clients from "@/pages/Clients";
import ClientMeetings from "@/pages/ClientMeetings";
import Services from "@/pages/Services";
import CompanyDetails from "@/pages/CompanyDetails";
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
          element={session ? <Dashboard session={session} /> : <Auth />}
        />
        <Route path="/account" element={<Account />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/budgets" element={<Budgets />} />
        <Route path="/running-challenges" element={<RunningChallenges />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/client-meetings" element={<ClientMeetings />} />
        <Route path="/services" element={<Services />} />
        <Route path="/company/:companyId" element={<CompanyDetails />} />
        <Route path="/client-portal" element={<ClientPortal />} />
      </Routes>
    </Router>
  );
}

export default App;
