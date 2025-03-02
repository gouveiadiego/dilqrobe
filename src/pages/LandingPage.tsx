
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Calendar, CheckCircle, CreditCard, Layers, Settings2, Shield, Users } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login");
  };

  const features = [
    {
      icon: <CheckCircle className="h-10 w-10 text-purple-500" />,
      title: "Gerenciamento de Tarefas",
      description: "Organize suas tarefas por prioridade, data e categoria. Visualize o progresso em tempo real e nunca perca um prazo."
    },
    {
      icon: <CreditCard className="h-10 w-10 text-purple-500" />,
      title: "Controle Financeiro",
      description: "Controle despesas e receitas, categorize transações e visualize relatórios detalhados de sua saúde financeira."
    },
    {
      icon: <Users className="h-10 w-10 text-purple-500" />,
      title: "Gestão de Clientes",
      description: "Mantenha todos os detalhes de seus clientes organizados e acessíveis. Melhore seu relacionamento com clientes importantes."
    },
    {
      icon: <Layers className="h-10 w-10 text-purple-500" />,
      title: "Projetos Escritos",
      description: "Documente e acompanhe seus projetos escritos, mantendo um histórico organizado e acessível."
    },
    {
      icon: <Calendar className="h-10 w-10 text-purple-500" />,
      title: "Hábitos & Desafios",
      description: "Crie e monitore hábitos diários. Participe de desafios e acompanhe seu progresso com métricas visuais."
    },
    {
      icon: <BarChart3 className="h-10 w-10 text-purple-500" />,
      title: "Dashboard Intuitivo",
      description: "Visualize todos os seus dados importantes em um só lugar com gráficos intuitivos e relatórios personalizados."
    },
    {
      icon: <Shield className="h-10 w-10 text-purple-500" />,
      title: "Portal do Cliente",
      description: "Um espaço dedicado onde seus clientes podem acessar informações relevantes e acompanhar o progresso dos projetos."
    },
    {
      icon: <Settings2 className="h-10 w-10 text-purple-500" />,
      title: "Perfil & Configurações",
      description: "Personalize sua experiência ajustando configurações de acordo com suas preferências."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-32 md:py-40">
        <div className="flex flex-col items-center text-center">
          <div className="aspect-square w-32 h-32 md:w-40 md:h-40 mx-auto relative overflow-hidden mb-8">
            <img
              src="/lovable-uploads/edd4e2f7-ee31-4d6c-8b97-6b0b3771a57e.png"
              alt="DILQ ORBE"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            O Grande Alinhamento
          </h1>
          <p className="text-xl text-purple-200 max-w-3xl mb-10">
            Sincronize sua mente, corpo e propósito. Transforme sua existência em um estado de alta performance e significado através deste sistema integrado de gestão.
          </p>
          <Button 
            onClick={handleGetStarted} 
            className="text-lg bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Começar Agora <ArrowRight className="ml-2" />
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24 md:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Funcionalidades Poderosas
          </h2>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto">
            Todas as ferramentas que você precisa para transformar sua vida pessoal e profissional em um só lugar.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-purple-200">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-2xl p-12 backdrop-blur-sm border border-purple-500/20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Pronto para transformar sua vida?
          </h2>
          <p className="text-xl text-purple-200 mb-8">
            Comece a jornada para uma vida de significado, organização e alta performance hoje mesmo.
          </p>
          <Button 
            onClick={handleGetStarted} 
            className="text-lg bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            Acessar Plataforma <ArrowRight className="ml-2" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-10 text-center text-purple-300 border-t border-purple-800/30">
        <p>© 2024 DILQ ORBE. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
