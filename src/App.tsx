import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ClientPortal from "./pages/ClientPortal";
import CompanyDetails from "./pages/CompanyDetails";
import LandingPage from "./pages/LandingPage";
import Subscription from "./pages/Subscription";

function App() {
  // Initialize dark mode based on user preference or system preference
  useEffect(() => {
    // Check for saved preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // If no saved preference, respect system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }
    }
    
    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
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
      <Toaster />
      <SonnerToaster 
        position="top-right" 
        theme={document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
        className="dark:bg-gray-900 dark:text-white dark:border-gray-800"
      />
    </>
  );
}

export default App;
