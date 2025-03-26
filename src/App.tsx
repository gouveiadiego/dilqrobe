import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
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
import PaymentSuccess from "@/pages/payment/PaymentSuccess";
import PaymentCanceled from "@/pages/payment/PaymentCanceled";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }
    }
    
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

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Conexão de internet restaurada");
      supabase.auth.refreshSession().then(({ data, error }) => {
        if (error) {
          console.error("Erro ao atualizar sessão após reconexão:", error);
        } else if (data.session) {
          console.log("Sessão renovada após reconexão");
        }
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error("Sem conexão com a internet", {
        description: "Algumas funcionalidades podem estar indisponíveis"
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    console.log("Verificando configuração do Supabase client...");
    
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Erro ao pré-carregar sessão:", error);
      } else if (data.session) {
        console.log("Sessão pré-carregada com sucesso:", data.session.user.id);
        
        const refreshInterval = setInterval(async () => {
          console.log("Executando renovação programada de sessão...");
          try {
            const { data, error } = await supabase.auth.refreshSession();
            if (error) {
              console.error("Erro na renovação programada:", error);
            } else if (data.session) {
              console.log("Sessão renovada com sucesso:", data.session.user.id);
            } else {
              console.log("Não foi possível renovar a sessão");
            }
          } catch (e) {
            console.error("Erro inesperado na renovação:", e);
          }
        }, 4 * 60 * 1000);
        
        return () => clearInterval(refreshInterval);
      } else {
        console.log("Nenhuma sessão ativa encontrada durante pré-carregamento");
      }
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Alteração global de estado de autenticação:", event);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log("Token renovado com sucesso");
      } else if (event === 'SIGNED_OUT') {
        console.log("Usuário desconectado, redirecionando para a página de login");
      }
    });
    
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
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/canceled" element={<PaymentCanceled />} />
        
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute requireSubscription={true}>
              <Index />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/client-portal" element={
          <ProtectedRoute requireSubscription={true}>
            <ClientPortal />
          </ProtectedRoute>
        } />
        
        <Route
          path="/company/:companyId"
          element={
            <ProtectedRoute requireSubscription={true}>
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
