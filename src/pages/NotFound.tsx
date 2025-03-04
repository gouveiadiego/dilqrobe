
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080a12] bg-gradient-to-br from-[#0c1420]/80 to-[#1a1b25]/80 p-8">
      <div className="text-center max-w-md relative">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-dilq-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-dilq-teal/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 space-y-6">
          <AlertCircle className="h-16 w-16 text-dilq-accent/70 mx-auto" />
          <h1 className="text-6xl font-bold bg-gradient-to-r from-dilq-accent via-purple-400 to-dilq-teal bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl text-white font-medium">Página não encontrada</h2>
          <p className="text-gray-400 mb-8">
            A página que você está procurando não existe ou foi movida.
          </p>
          
          <Button 
            onClick={() => navigate("/")} 
            className="bg-gradient-to-r from-dilq-accent to-dilq-teal hover:opacity-90 text-white px-6 py-2"
          >
            <Home className="mr-2 h-4 w-4" />
            Voltar para a Página Inicial
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
