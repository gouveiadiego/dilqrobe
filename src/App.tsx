import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ClientPortal from "./pages/ClientPortal";
import CompanyDetails from "./pages/CompanyDetails";
import LandingPage from "./pages/LandingPage";

const queryClient = new QueryClient();

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

  // Check for payment status parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const success = queryParams.get('success');
    const cancelled = queryParams.get('cancelled');
    
    if (success === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        const toast = document.createElement('script');
        toast.innerHTML = `sonner.success("Assinatura realizada com sucesso!", { duration: 5000 })`;
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 100);
      }, 500);
    } else if (cancelled === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        const toast = document.createElement('script');
        toast.innerHTML = `sonner.info("Pagamento cancelado.", { duration: 5000 })`;
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 100);
      }, 500);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
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
      </Router>
    </QueryClientProvider>
  );
}

export default App;
