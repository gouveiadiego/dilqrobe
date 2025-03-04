
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Key, User, Phone, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth, AuthFormData } from "@/hooks/useAuth";

export const Auth = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  
  // Form data for login and registration
  const [formData, setFormData] = useState<AuthFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: ""
  });
  
  const { 
    loading, 
    checkingSession, 
    errorMessage, 
    setErrorMessage,
    handleSignIn, 
    handleSignUp,
    handlePasswordReset 
  } = useAuth({
    checkSubscriptionAfterAuth: true
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleSignIn(formData);
  };

  const handleRegistration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const success = await handleSignUp(formData);
    if (success) {
      toast.success("Conta criada com sucesso! Agora escolha um plano.");
      navigate("/plans");
    }
  };

  // If still checking session, show loading spinner
  if (checkingSession) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#080a12]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-dilq-accent mx-auto" />
          <p className="mt-4 text-lg text-gray-300">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#080a12] bg-gradient-to-br from-[#0c1420]/80 to-[#1a1b25]/80 p-8">
        <div className="w-full max-w-md space-y-8 relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-dilq-accent/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-dilq-teal/10 rounded-full blur-3xl"></div>
          
          <div className="text-center space-y-4 relative mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-dilq-accent via-purple-400 to-dilq-teal bg-clip-text text-transparent">
              {activeTab === "login" ? "Entrar no DILQ" : "Crie sua conta"}
            </h2>
            <p className="text-gray-300">
              {activeTab === "login" 
                ? "Faça login para acessar sua conta" 
                : "Cadastre-se para acessar todos os recursos"}
            </p>
          </div>
          
          {errorMessage && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-200 p-4 rounded-xl text-sm backdrop-blur-md">
              {errorMessage}
            </div>
          )}
          
          <Tabs 
            defaultValue="login" 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as "login" | "signup")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-dilq-accent/30 to-dilq-teal/30 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative bg-black/60 backdrop-blur-md rounded-lg overflow-hidden">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-dilq-accent transition-colors" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        className="bg-transparent border-0 ring-offset-0 pl-10 text-white focus:ring-1 focus:ring-dilq-accent/50"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-gray-300">Senha</Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-dilq-accent/30 to-dilq-teal/30 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative bg-black/60 backdrop-blur-md rounded-lg overflow-hidden">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-dilq-accent transition-colors" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Senha"
                        className="bg-transparent border-0 ring-offset-0 pl-10 text-white focus:ring-1 focus:ring-dilq-accent/50"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-dilq-accent to-dilq-teal hover:opacity-90 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
                
                <div className="flex justify-between text-sm text-gray-400 pt-2">
                  <button
                    type="button"
                    onClick={() => handlePasswordReset()}
                    className="hover:text-dilq-accent transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleRegistration} className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="fullName" className="text-gray-300">Nome Completo</Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-dilq-accent/30 to-dilq-teal/30 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative bg-black/60 backdrop-blur-md rounded-lg overflow-hidden">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-dilq-accent transition-colors" />
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Seu nome completo"
                        className="bg-transparent border-0 ring-offset-0 pl-10 text-white focus:ring-1 focus:ring-dilq-accent/50"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-dilq-accent/30 to-dilq-teal/30 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative bg-black/60 backdrop-blur-md rounded-lg overflow-hidden">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-dilq-accent transition-colors" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        className="bg-transparent border-0 ring-offset-0 pl-10 text-white focus:ring-1 focus:ring-dilq-accent/50"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-gray-300">Telefone (opcional)</Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-dilq-accent/30 to-dilq-teal/30 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative bg-black/60 backdrop-blur-md rounded-lg overflow-hidden">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-dilq-accent transition-colors" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        className="bg-transparent border-0 ring-offset-0 pl-10 text-white focus:ring-1 focus:ring-dilq-accent/50"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-gray-300">Senha</Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-dilq-accent/30 to-dilq-teal/30 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative bg-black/60 backdrop-blur-md rounded-lg overflow-hidden">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-dilq-accent transition-colors" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Senha"
                        className="bg-transparent border-0 ring-offset-0 pl-10 text-white focus:ring-1 focus:ring-dilq-accent/50"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="confirmPassword" className="text-gray-300">Confirmar Senha</Label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-dilq-accent/30 to-dilq-teal/30 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                    <div className="relative bg-black/60 backdrop-blur-md rounded-lg overflow-hidden">
                      <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-hover:text-dilq-accent transition-colors" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirme sua senha"
                        className="bg-transparent border-0 ring-offset-0 pl-10 text-white focus:ring-1 focus:ring-dilq-accent/50"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-dilq-accent to-dilq-teal hover:opacity-90 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                      <span>Processando...</span>
                    </div>
                  ) : (
                    "Cadastrar"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <div className="text-center pt-4">
            <button 
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center text-sm text-gray-400 hover:text-white transition-colors gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar para a página inicial</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="hidden lg:flex w-1/2 bg-[#465E73] p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1F2C] via-[#2C3D4F] to-[#465E73] opacity-90"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/lovable-uploads/51280539-8d8b-4153-9b22-b0eca70f327c.png')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        
        <div className="absolute top-10 right-10 w-20 h-20 bg-dilq-accent/20 rounded-full blur-3xl animate-pulse-subtle"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-dilq-teal/20 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: "1s" }}></div>
        
        <div className="max-w-lg space-y-8 relative z-10">
          <div className="aspect-square w-64 mx-auto relative overflow-hidden">
            <img
              src="/lovable-uploads/edd4e2f7-ee31-4d6c-8b97-6b0b3771a57e.png"
              alt="DILQ ORBE"
              className="w-full h-full object-contain animate-float"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#465E73] to-transparent opacity-30"></div>
          </div>
          <div className="space-y-6 text-center max-w-md mx-auto backdrop-blur-sm bg-black/10 p-8 rounded-xl border border-white/10">
            <h1 className="text-3xl font-bold text-white leading-tight">
              O Grande Alinhamento:
              <span className="bg-gradient-to-r from-dilq-accent to-dilq-teal bg-clip-text text-transparent"> Sincronize Sua Mente, Corpo e Propósito</span>
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

export default Auth;
