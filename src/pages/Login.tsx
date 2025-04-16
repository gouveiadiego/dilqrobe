
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Mail, User, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    cpf: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name,
              cpf: formData.cpf,
            },
          },
        });

        if (signUpError) {
          console.error("Signup error:", signUpError);
          if (signUpError.message.includes("Password")) {
            toast.error("A senha deve ter pelo menos 6 caracteres");
          } else if (signUpError.message.includes("User already registered")) {
            toast.error("Este email já está registrado. Tente fazer login.");
            setIsSignUp(false);
          } else {
            toast.error(signUpError.message);
          }
          return;
        }

        toast.success("Conta criada com sucesso! Verifique seu email.");
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) {
          console.error("Login error:", signInError);
          if (signInError.message.includes("Invalid login credentials")) {
            toast.error("Email ou senha incorretos");
          } else {
            toast.error("Erro ao fazer login. Tente novamente.");
          }
          return;
        }

        if (data?.session) {
          // After successful login, redirect to home (root path)
          navigate("/", { replace: true });
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Apply CPF format (xxx.xxx.xxx-xx)
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    } else if (digits.length <= 9) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    } else {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    }
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCPF = formatCPF(e.target.value);
    setFormData({ ...formData, cpf: formattedCPF });
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              {isSignUp ? "Criar nova conta" : "Bem-vindo de volta"}
            </h2>
            <p className="text-gray-600">
              {isSignUp
                ? "Preencha seus dados para começar"
                : "Entre com suas credenciais para continuar"}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Seu nome completo"
                        className="pl-10"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required={isSignUp}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        className="pl-10"
                        maxLength={14}
                        value={formData.cpf}
                        onChange={handleCPFChange}
                        required={isSignUp}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
              disabled={isLoading}
            >
              {isLoading
                ? "Carregando..."
                : isSignUp
                ? "Criar conta"
                : "Entrar"}
            </Button>
          </form>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              {isSignUp
                ? "Já tem uma conta? Entre aqui"
                : "Não tem uma conta? Cadastre-se"}
            </button>
          </div>
        </div>
      </div>
      <div className="hidden lg:flex w-1/2 bg-[#465E73] p-12 items-center justify-center">
        <div className="max-w-lg space-y-8">
          <div className="aspect-square w-64 mx-auto relative overflow-hidden">
            <img
              src="/lovable-uploads/edd4e2f7-ee31-4d6c-8b97-6b0b3771a57e.png"
              alt="DILQ ORBE"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-4 text-center max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-white leading-tight">
              O Grande Alinhamento: Sincronize Sua Mente, Corpo e Propósito
            </h1>
            <p className="text-base text-gray-100 leading-relaxed">
              Esta é a reinicialização que vai redesenhar sua vida: assuma o
              controle das suas tarefas, finanças, corpo, hábitos e conexão com o
              essencial. Transforme sua existência em um estado de alta
              performance e significado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
