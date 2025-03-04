
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useAuth, AuthFormData } from "@/hooks/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AuthFormData>({
    email: "",
    password: "",
  });
  
  const { 
    loading, 
    checkingSession, 
    errorMessage, 
    handleSignIn, 
    handlePasswordReset 
  } = useAuth({
    checkSubscriptionAfterAuth: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await handleSignIn(formData);
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#080a12] to-[#1e2433] p-4">
      <Card className="w-full max-w-md backdrop-blur-lg bg-white/10 border-gray-500/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">
            Entrar no DILQ
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <div className="bg-red-900/30 border border-red-700/50 text-red-200 p-4 rounded-xl text-sm backdrop-blur-md">
                {errorMessage}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input 
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Senha</Label>
              <Input 
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="border-gray-700 bg-gray-800 text-white placeholder:text-gray-400"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-dilq-accent hover:bg-dilq-accent/90"
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
            <div className="text-sm text-gray-400 text-center">
              Não tem uma conta?{" "}
              <Button variant="link" className="p-0 text-dilq-accent" onClick={() => navigate("/signup")}>
                Cadastre-se
              </Button>
            </div>
            <div className="text-sm text-gray-400 text-center">
              <Button 
                type="button" 
                variant="link" 
                className="p-0 text-dilq-accent"
                onClick={() => handlePasswordReset()}
              >
                Esqueceu a senha?
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
