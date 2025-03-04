import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
  fullName?: string;
  phone?: string;
}

interface UseAuthOptions {
  redirectTo?: string;
  checkSubscriptionAfterAuth?: boolean;
}

export function useAuth(options: UseAuthOptions = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isPlanSelected, setIsPlanSelected] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const selectedPlan = params.get("plan");
    setIsPlanSelected(!!selectedPlan);
    
    // Check if user is already logged in with a valid subscription
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Auth hook - session found for user:", session.user.id);
          
          // Check subscription if needed
          if (options.checkSubscriptionAfterAuth) {
            try {
              const { data: subscription, error: subscriptionError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', session.user.id)
                .in('status', ['active', 'trialing', 'paused'])
                .maybeSingle();
              
              if (subscriptionError && subscriptionError.code !== 'PGRST116') {
                console.error("Error checking subscription in hook:", subscriptionError);
              }
              
              if (subscription) {
                console.log("Active subscription found in hook:", subscription);
                
                // If user already has a valid subscription, redirect to dashboard
                console.log("Valid subscription found, navigating to dashboard");
                toast.success("Login realizado com sucesso");
                navigate(options.redirectTo || "/dashboard");
                return;
              } else {
                console.log("No valid subscription found for logged-in user in hook");
              }
            } catch (error) {
              console.error("Error checking subscription status in hook:", error);
            }
          } else if (options.redirectTo) {
            // If not checking subscription but redirect is needed
            navigate(options.redirectTo);
            return;
          }
        } else {
          console.log("No active session found in auth hook");
        }
      } catch (error) {
        console.error("Error checking session in hook:", error);
      }
      
      setCheckingSession(false);
    };
    
    checkSession();
  }, [location.search, navigate, options.redirectTo, options.checkSubscriptionAfterAuth]);

  const handleSignIn = async (formData: AuthFormData) => {
    setLoading(true);
    setErrorMessage("");
    
    try {
      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (error) {
        console.error("Login error:", error.message);
        toast.error("Erro ao fazer login: " + error.message);
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }
      
      if (!data.session) {
        console.error("No session returned after login");
        toast.error("Erro ao obter sessão após login");
        setErrorMessage("Erro ao obter sessão após login");
        setLoading(false);
        return;
      }
      
      console.log("User logged in successfully:", data.session.user.id);
      
      // After successful login, check if user has a valid subscription
      if (options.checkSubscriptionAfterAuth) {
        try {
          console.log("Checking subscription after login in hook");
          const { data: subscription, error: subscriptionError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', data.session.user.id)
            .in('status', ['active', 'trialing', 'paused'])
            .maybeSingle();
            
          if (subscriptionError) {
            console.error("Error checking subscription in hook:", subscriptionError);
            toast.error("Erro ao verificar assinatura");
            setErrorMessage("Erro ao verificar assinatura: " + subscriptionError.message);
            setLoading(false);
            return;
          }
          
          if (subscription) {
            console.log("Valid subscription found in hook, navigating to dashboard");
            toast.success("Login realizado com sucesso!");
            navigate("/dashboard");
          } else {
            console.log("No valid subscription found in hook, redirect user to plans");
            // If user doesn't have a valid subscription, handle accordingly
            if (isPlanSelected) {
              // User was in the process of selecting a plan, redirect to checkout
              console.log("Plan was selected, redirecting to payment");
              // Extract plan ID from URL
              const params = new URLSearchParams(location.search);
              const planId = params.get("plan");
              navigate(`/payment?plan=${planId}`);
            } else {
              // Otherwise redirect to plans page
              console.log("No plan selected, redirecting to plans page");
              toast.error("Você não possui uma assinatura ativa. Por favor, escolha um plano.");
              navigate("/plans");
            }
          }
        } catch (error: any) {
          console.error("Error checking subscription in hook:", error);
          toast.error("Erro ao verificar assinatura");
          setErrorMessage("Erro ao verificar assinatura: " + error.message);
        }
      } else if (options.redirectTo) {
        // If not checking subscription but redirect is needed
        toast.success("Login realizado com sucesso!");
        navigate(options.redirectTo);
      }
    } catch (error: any) {
      console.error("Error in handleSignIn in hook:", error);
      toast.error("Erro desconhecido ao fazer login");
      setErrorMessage("Erro desconhecido: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (formData: AuthFormData) => {
    if (!formData.email || !formData.email.includes("@")) {
      toast.error("Por favor, insira um email válido");
      setErrorMessage("Por favor, insira um email válido");
      return false;
    }
    
    if (!formData.password || formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      setErrorMessage("A senha deve ter pelo menos 6 caracteres");
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      setErrorMessage("As senhas não coincidem");
      return false;
    }
    
    if (!formData.fullName) {
      toast.error("Por favor, informe seu nome completo");
      setErrorMessage("Por favor, informe seu nome completo");
      return false;
    }
    
    setLoading(true);
    setErrorMessage("");
    
    try {
      // Register the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone
          }
        }
      });
      
      if (authError) {
        console.error("Error registering user:", authError);
        
        if (authError.message.includes("already exists")) {
          toast.error("Este email já está registrado. Por favor, faça login ou use outro email.");
        } else {
          toast.error(`Erro ao registrar: ${authError.message}`);
        }
        
        setErrorMessage(authError.message);
        setLoading(false);
        return false;
      }
      
      console.log("User registered successfully:", authData);
      toast.success("Conta criada com sucesso!");
      
      setLoading(false);
      return true;
    } catch (error: any) {
      console.error("Error in registration process:", error);
      toast.error(`Ocorreu um erro ao processar sua solicitação: ${error.message || ''}`);
      setErrorMessage(`Erro: ${error.message || 'Ocorreu um erro desconhecido'}`);
      setLoading(false);
      return false;
    }
  };

  const handlePasswordReset = async (email?: string) => {
    const resetEmail = email || prompt("Digite seu email para redefinir a senha:");
    
    if (!resetEmail || !resetEmail.includes("@")) {
      toast.error("Por favor, insira um email válido");
      return;
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        toast.error(`Erro ao enviar email de redefinição: ${error.message}`);
        return;
      }
      
      toast.success("Email de redefinição de senha enviado. Verifique sua caixa de entrada.");
    } catch (error: any) {
      toast.error(`Erro ao solicitar redefinição de senha: ${error.message}`);
    }
  };

  return {
    loading,
    checkingSession,
    isPlanSelected,
    errorMessage,
    setErrorMessage,
    handleSignIn,
    handleSignUp,
    handlePasswordReset,
  };
}
