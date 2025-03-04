
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PricingSection } from "@/components/checkout/PricingSection";

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLoginWithGoogle = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/index`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error logging in with Google:", error);
      toast.error("Erro ao fazer login com Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-dilq-indigo to-dilq-purple bg-clip-text text-transparent">
                O Grande Alinhamento
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
                Transforme sua jornada empreendedora e alcance novos patamares de sucesso. 
                Nossa plataforma combina ferramentas poderosas para gestão de projetos, 
                finanças e produtividade em um único lugar.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleLoginWithGoogle}
                  disabled={loading}
                  className="bg-gradient-to-r from-dilq-indigo to-dilq-purple text-white hover:from-dilq-indigo/90 hover:to-dilq-purple/90 px-6 py-3 h-auto text-lg"
                >
                  {loading ? "Carregando..." : "Comece Agora"}
                </Button>
                <Button 
                  variant="outline" 
                  asChild
                  className="border-indigo-200 hover:border-indigo-400 px-6 py-3 h-auto text-lg"
                >
                  <a href="#pricing">Ver Planos</a>
                </Button>
              </div>
            </div>
            <div className="flex-shrink-0 w-full md:w-1/2">
              <img
                src="/lovable-uploads/cfdaeb87-1249-4d11-9b08-efa04c175a38.png"
                alt="Dashboard Preview"
                className="w-full h-auto rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Recursos Poderosos para Seu Negócio</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-4">
              Tudo o que você precisa para gerenciar e escalar seu negócio
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Gestão Financeira",
                description: "Controle receitas, despesas e gere relatórios detalhados para tomar decisões baseadas em dados.",
                icon: "💰"
              },
              {
                title: "Gestão de Projetos",
                description: "Organize tarefas, acompanhe prazos e colabore com sua equipe em tempo real.",
                icon: "📊"
              },
              {
                title: "Orçamentos Profissionais",
                description: "Crie orçamentos personalizados para seus clientes com apenas alguns cliques.",
                icon: "📝"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Pricing Section */}
      <div id="pricing" className="py-16 bg-white dark:bg-gray-900">
        <PricingSection />
      </div>
      
      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto para transformar seu negócio?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Junte-se a milhares de empreendedores que estão elevando seus negócios ao próximo nível
          </p>
          <Button 
            onClick={handleLoginWithGoogle}
            variant="secondary" 
            size="lg"
            className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-3 h-auto text-lg"
          >
            Comece Grátis
          </Button>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-8 bg-gray-800 text-gray-300">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p>&copy; 2023 O Grande Alinhamento. Todos os direitos reservados.</p>
            </div>
            <div className="flex gap-4">
              <Link to="/login" className="hover:text-white">Login</Link>
              <a href="#pricing" className="hover:text-white">Planos</a>
              <a href="#" className="hover:text-white">Termos</a>
              <a href="#" className="hover:text-white">Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
