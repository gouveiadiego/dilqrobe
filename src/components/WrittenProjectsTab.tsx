
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompanyManager } from "./written-projects/CompanyManager";
import { ProjectTasks } from "./written-projects/ProjectTasks";
import { CredentialsManager } from "./written-projects/CredentialsManager";
import { Rocket, Database, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function WrittenProjectsTab() {
  const [activeTab, setActiveTab] = useState("companies");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Função para forçar atualização da sessão
  const refreshSession = async () => {
    try {
      setIsRefreshing(true);
      setLoadError(null);
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Erro ao atualizar sessão:", error);
        toast.error("Não foi possível renovar sua sessão, redirecionando para login...");
        
        // Aguardar pequeno delay antes de redirecionar para login
        setTimeout(() => {
          supabase.auth.signOut().then(() => {
            navigate("/login");
          });
        }, 1500);
        
        return;
      }
      
      if (data.session) {
        toast.success("Sessão renovada com sucesso!");
        // Recarregar a página para atualizar todos os componentes
        window.location.reload();
      } else {
        toast.error("Sessão expirada, por favor faça login novamente");
        navigate("/login");
      }
    } catch (error) {
      console.error("Erro inesperado:", error);
      toast.error("Ocorreu um erro, por favor tente novamente");
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Verificar sessão ao montar o componente
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setLoadError("Sessão expirada");
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        setLoadError("Erro ao verificar sessão");
      }
    };
    
    checkSession();
  }, []);
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Rocket className="h-6 w-6 text-dilq-purple animate-float" />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-dilq-indigo to-dilq-purple bg-clip-text text-transparent">
            Projetos
          </h2>
        </div>
        
        {loadError && (
          <Button 
            onClick={refreshSession} 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Reconectar
          </Button>
        )}
      </div>

      {loadError ? (
        <div className="p-12 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
          <h3 className="text-xl font-medium mb-3">Problema de conexão detectado</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Não foi possível carregar os dados. Isso pode ocorrer quando sua sessão expirou ou houve um problema na conexão.
          </p>
          <Button 
            onClick={refreshSession} 
            className="mx-auto"
            disabled={isRefreshing}
          >
            {isRefreshing ? "Reconectando..." : "Reconectar agora"}
          </Button>
        </div>
      ) : (
        <div className="p-1 rounded-2xl bg-gradient-to-r from-dilq-indigo/20 to-dilq-purple/20">
          <Tabs 
            value={activeTab} 
            defaultValue="companies" 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="mb-6 w-full bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-1 rounded-xl">
              <TabsTrigger 
                value="companies" 
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-dilq-indigo data-[state=active]:to-dilq-purple data-[state=active]:text-white"
              >
                <Database className="h-4 w-4" />
                <span>Empresas</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="tasks" 
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-dilq-indigo data-[state=active]:to-dilq-purple data-[state=active]:text-white"
              >
                <Rocket className="h-4 w-4" />
                <span>Tarefas</span>
              </TabsTrigger>
              
              <TabsTrigger 
                value="credentials" 
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-dilq-indigo data-[state=active]:to-dilq-purple data-[state=active]:text-white"
              >
                <Shield className="h-4 w-4" />
                <span>Credenciais</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100/80 overflow-hidden dark:bg-gray-900 dark:border-gray-800">
              <TabsContent value="companies" className="p-6 transition-all duration-300 animate-fade-in">
                <CompanyManager />
              </TabsContent>
              
              <TabsContent value="tasks" className="p-6 transition-all duration-300 animate-fade-in">
                <ProjectTasks />
              </TabsContent>
              
              <TabsContent value="credentials" className="p-6 transition-all duration-300 animate-fade-in">
                <CredentialsManager />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}
