
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Calendar, CheckCircle, CreditCard, Layers, Settings2, Shield, Users, Sparkles, Brain, ArrowDown, Origami, Bird, CheckSquare, Wallet, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const [currentTimeImage, setCurrentTimeImage] = useState("");
  const [currentPeriod, setCurrentPeriod] = useState("");

  const dayTimeImages = {
    sunrise: [
      "/lovable-uploads/fb142e12-7f04-465f-b651-75fa83e361bd.png",
      "/lovable-uploads/16218e44-718f-4da1-94fe-d4aa5bdd945c.png",
    ],
    day: [
      "/lovable-uploads/e5c52c62-67c0-4a53-90ce-47dfc2bc08f1.png",
      "/lovable-uploads/be64081a-d75d-4507-b2dc-337948bb4bbc.png",
      "/lovable-uploads/75844122-7008-4e1d-9c88-355fa1a25138.png",
    ],
    sunset: [
      "/lovable-uploads/8d5658dd-0a54-4f4f-92b2-0aa25b544942.png",
      "/lovable-uploads/48deecf0-3c7d-4ab4-84b1-914f996e585e.png",
    ],
    night: [
      "/lovable-uploads/1689356a-975b-4f70-b497-b774fbf2fb0f.png",
      "/lovable-uploads/adb2e7a1-b666-46fa-bfdb-546c5b6d9fea.png",
      "/lovable-uploads/76be8734-243f-4c81-8021-81e311dfe74d.png",
      "/lovable-uploads/1d07bcca-52ad-4691-9f71-b26b357c19cb.png",
    ]
  };

  const handleGetStarted = () => {
    navigate("/login");
  };

  // Determine the current time period in Brazil
  const getCurrentTimePeriod = () => {
    // Get current time in Brazil timezone
    const brazilTime = toZonedTime(new Date(), 'America/Sao_Paulo');
    const hours = brazilTime.getHours();
    
    // Determine period based on hours
    if (hours >= 5 && hours < 8) {
      return "sunrise";
    } else if (hours >= 8 && hours < 17) {
      return "day";
    } else if (hours >= 17 && hours < 19) {
      return "sunset";
    } else {
      return "night";
    }
  };

  // Get an image based on the current time period
  const getTimeBasedImage = (period) => {
    const images = dayTimeImages[period];
    return images[Math.floor(Math.random() * images.length)];
  };

  useEffect(() => {
    // Update time-based image every minute
    const updateTimeImage = () => {
      const period = getCurrentTimePeriod();
      setCurrentPeriod(period);
      setCurrentTimeImage(getTimeBasedImage(period));
    };

    // Initial update
    updateTimeImage();
    
    // Set interval for updates
    const interval = setInterval(updateTimeImage, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Display current time
  const formatBrazilTime = () => {
    const brazilTime = toZonedTime(new Date(), 'America/Sao_Paulo');
    return format(brazilTime, 'HH:mm');
  };

  // Get period name in Portuguese
  const getPeriodNamePt = (period) => {
    const names = {
      sunrise: "Nascer do Sol",
      day: "Dia",
      sunset: "Pôr do Sol",
      night: "Noite"
    };
    return names[period] || "";
  };

  const features = [{
    icon: <CheckCircle className="h-12 w-12 text-dilq-blue" />,
    title: "Gerenciamento de Tarefas",
    description: "Organize suas tarefas por prioridade, data e categoria. Visualize o progresso em tempo real e nunca perca um prazo.",
    image: "/lovable-uploads/50f912fc-cfc5-4a73-aec2-3d41a195dd52.png",
    benefits: ["Categorização inteligente de tarefas", "Sistema de prioridades visual", "Lembretes e notificações", "Visualização em calendário"]
  }, {
    icon: <CreditCard className="h-12 w-12 text-dilq-blue" />,
    title: "Controle Financeiro",
    description: "Controle despesas e receitas, categorize transações e visualize relatórios detalhados de sua saúde financeira.",
    image: "/lovable-uploads/50f912fc-cfc5-4a73-aec2-3d41a195dd52.png",
    benefits: ["Rastreamento de gastos em tempo real", "Categorização automática de transações", "Relatórios e gráficos interativos", "Previsão de fluxo de caixa"]
  }, {
    icon: <Users className="h-12 w-12 text-dilq-blue" />,
    title: "Gestão de Clientes",
    description: "Mantenha todos os detalhes de seus clientes organizados e acessíveis. Melhore seu relacionamento com clientes importantes.",
    image: "/lovable-uploads/50f912fc-cfc5-4a73-aec2-3d41a195dd52.png",
    benefits: ["Base de dados centralizada", "Histórico de interações", "Acompanhamento de projetos por cliente", "Acesso via portal do cliente"]
  }, {
    icon: <Layers className="h-12 w-12 text-dilq-blue" />,
    title: "Projetos Escritos",
    description: "Documente e acompanhe seus projetos escritos, mantendo um histórico organizado e acessível.",
    image: "/lovable-uploads/50f912fc-cfc5-4a73-aec2-3d41a195dd52.png",
    benefits: ["Repositório de documentos estruturado", "Controle de versões de arquivos", "Colaboração em equipe", "Métricas de progresso"]
  }, {
    icon: <Calendar className="h-12 w-12 text-dilq-blue" />,
    title: "Hábitos & Desafios",
    description: "Crie e monitore hábitos diários. Participe de desafios e acompanhe seu progresso com métricas visuais.",
    image: "/lovable-uploads/50f912fc-cfc5-4a73-aec2-3d41a195dd52.png",
    benefits: ["Rastreador de hábitos diários", "Desafios personalizáveis", "Estatísticas de performance", "Sistema de recompensas"]
  }, {
    icon: <BarChart3 className="h-12 w-12 text-dilq-blue" />,
    title: "Dashboard Intuitivo",
    description: "Visualize todos os seus dados importantes em um só lugar com gráficos intuitivos e relatórios personalizados.",
    image: "/lovable-uploads/50f912fc-cfc5-4a73-aec2-3d41a195dd52.png",
    benefits: ["Visão consolidada de todas as áreas", "Widgets personalizáveis", "Painéis interativos", "Métricas e KPIs configuráveis"]
  }, {
    icon: <Shield className="h-12 w-12 text-dilq-blue" />,
    title: "Portal do Cliente",
    description: "Um espaço dedicado onde seus clientes podem acessar informações relevantes e acompanhar o progresso dos projetos.",
    image: "/lovable-uploads/50f912fc-cfc5-4a73-aec2-3d41a195dd52.png",
    benefits: ["Acesso seguro para clientes", "Compartilhamento de arquivos", "Aprovações e feedback em tempo real", "Comunicação centralizada"]
  }, {
    icon: <Settings2 className="h-12 w-12 text-dilq-blue" />,
    title: "Perfil & Configurações",
    description: "Personalize sua experiência ajustando configurações de acordo com suas preferências.",
    image: "/lovable-uploads/50f912fc-cfc5-4a73-aec2-3d41a195dd52.png",
    benefits: ["Perfil detalhado do usuário", "Configurações de notificações", "Personalização visual", "Ajustes de privacidade"]
  }];
  const testimonials = [{
    name: "Paulo Andrade",
    role: "Empresário",
    content: "Esta plataforma transformou completamente a maneira como gerencio meus projetos e finanças. A integração entre os módulos é simplesmente perfeita.",
    avatar: "https://i.pravatar.cc/100?img=1"
  }, {
    name: "Aline Ferreira",
    role: "Profissional Autônomo",
    content: "Consegui aumentar minha produtividade em 40% usando o sistema de tarefas e hábitos. Os relatórios me ajudam a entender onde estou gastando meu tempo.",
    avatar: "https://i.pravatar.cc/100?img=5"
  }, {
    name: "Ricardo Mendes",
    role: "Consultor Financeiro",
    content: "A funcionalidade de controle financeiro é excepcional. Consigo ter uma visão clara das minhas receitas e despesas, categorizadas automaticamente.",
    avatar: "https://i.pravatar.cc/100?img=3"
  }];
  interface StepProps {
    number: number;
    title: string;
    description: string;
    icon: React.ReactNode;
  }
  const Step = ({
    number,
    title,
    description,
    icon
  }: StepProps) => <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 bg-sky-100 h-12 w-12 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>;
  const TestimonialCard = ({
    testimonial
  }: {
    testimonial: typeof testimonials[0];
  }) => <Card className="bg-white border-gray-200 hover:border-dilq-blue hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <img src={testimonial.avatar} alt={testimonial.name} className="w-16 h-16 rounded-full object-cover border-2 border-sky-200" />
          <div>
            <p className="italic text-gray-700 mb-4">"{testimonial.content}"</p>
            <div>
              <p className="font-semibold text-gray-900">{testimonial.name}</p>
              <p className="text-sm text-dilq-blue">{testimonial.role}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
  interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    isActive?: boolean;
    onClick?: () => void;
  }
  const FeatureCard = ({
    icon,
    title,
    description,
    isActive = false,
    onClick
  }: FeatureCardProps) => <Card className={`
        cursor-pointer border transition-all duration-300 h-full
        ${isActive ? 'bg-sky-50 border-sky-300 shadow-md' : 'bg-white border-gray-200 hover:border-sky-200 hover:shadow-sm'}
      `} onClick={onClick}>
      <CardContent className="p-6">
        <div className="mb-4">{icon}</div>
        <h3 className={`text-xl font-semibold mb-2 ${isActive ? 'text-dilq-blue' : 'text-gray-900'}`}>
          {title}
        </h3>
        <p className={`${isActive ? 'text-dilq-blue' : 'text-gray-600'}`}>
          {description}
        </p>
      </CardContent>
    </Card>;
  return <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="py-4 px-6 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-sm z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/lovable-uploads/edd4e2f7-ee31-4d6c-8b97-6b0b3771a57e.png" alt="DILQ ORBE" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold text-gray-900">DILQ ORBE</span>
          </div>
          <Button onClick={handleGetStarted} className="bg-dilq-blue hover:bg-sky-600 text-white">
            Começar Agora
          </Button>
        </div>
      </nav>

      {/* Hero Section with Time-Based Images */}
      <div className="container mx-auto px-4 py-24 md:py-32">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                O Grande <span className="text-dilq-blue">Alinhamento</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl">
                Sincronize sua mente, corpo e propósito. Transforme sua existência em um estado de alta performance e significado através deste sistema integrado de gestão.
              </p>
              
              <div className="flex flex-col items-start space-y-2 text-gray-500">
                <p className="text-sm bg-gray-100 px-3 py-1 rounded-full">
                  Horário atual no Brasil: {formatBrazilTime()} - {getPeriodNamePt(currentPeriod)}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleGetStarted} className="text-lg bg-dilq-blue hover:bg-sky-600 text-white px-8 py-6 rounded-lg transition-all duration-300 transform hover:scale-105">
                Começar Agora <ArrowRight className="ml-2" />
              </Button>
              <Button variant="outline" className="text-lg border-gray-300 text-dilq-dark hover:bg-sky-50 px-8 py-6 rounded-lg" onClick={() => {
              const featuresSection = document.getElementById('features');
              featuresSection?.scrollIntoView({
                behavior: 'smooth'
              });
            }}>
                Explorar Recursos <ArrowDown className="ml-2" />
              </Button>
            </div>
          </div>
          
          <div className="lg:w-1/2">
            <div className="relative rounded-2xl shadow-2xl overflow-hidden border-8 border-white transform hover:scale-105 transition-transform duration-500 bg-gray-50">
              {/* Dynamic time-based image */}
              {currentTimeImage && (
                <img 
                  alt={`DILQ ORBE - ${getPeriodNamePt(currentPeriod)}`} 
                  className="w-full object-contain"
                  src={currentTimeImage}
                />
              )}
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-sky-200 rounded-full opacity-20"></div>
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-200 rounded-full opacity-20"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-gradient-to-b from-white to-sky-50 py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Funcionalidades <span className="text-dilq-blue">Poderosas</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Todas as ferramentas que você precisa para transformar sua vida pessoal e profissional em um só lugar, projetadas para sincronizar todas as áreas da sua existência.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {features.map((feature, index) => <FeatureCard key={index} icon={feature.icon} title={feature.title} description={feature.description} isActive={activeFeature === index} onClick={() => setActiveFeature(index)} />)}
          </div>
          
          <div className="mt-24 bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <div className="relative rounded-xl overflow-hidden border-4 border-sky-100 shadow-xl h-[400px] transform transition-all duration-700 hover:scale-105">
                  <img src={features[activeFeature].image} alt={features[activeFeature].title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                    <div className="p-6 text-white">
                      <h3 className="text-2xl font-bold mb-2">{features[activeFeature].title}</h3>
                      <p className="text-sky-100">{features[activeFeature].description}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-1/2 space-y-8">
                <h3 className="text-2xl font-bold text-gray-900">
                  {features[activeFeature].title}
                </h3>
                <p className="text-gray-600">
                  {features[activeFeature].description}
                </p>
                
                <ul className="space-y-4">
                  {features[activeFeature].benefits.map((benefit, i) => <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>)}
                </ul>
                
                <Button onClick={handleGetStarted} className="bg-dilq-blue hover:bg-sky-600 text-white">
                  Experimentar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Como <span className="text-dilq-blue">Funciona</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Em apenas alguns passos simples, você estará no caminho para uma vida mais organizada e produtiva.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <Step number={1} title="Crie sua Conta" description="Configure seu perfil pessoal para começar a jornada de transformação." icon={<Users className="h-6 w-6 text-dilq-blue" />} />
            <Step number={2} title="Configure seus Módulos" description="Personalize cada módulo de acordo com suas necessidades específicas." icon={<Settings2 className="h-6 w-6 text-dilq-blue" />} />
            <Step number={3} title="Eleve sua Produtividade" description="Acompanhe seu progresso através de métricas claras e objetivas." icon={<Sparkles className="h-6 w-6 text-dilq-blue" />} />
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-sky-50 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              O Que Nossos <span className="text-dilq-blue">Usuários</span> Dizem
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubra como nosso sistema está transformando a vida de pessoas em todo o Brasil.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => <TestimonialCard key={index} testimonial={testimonial} />)}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                Por Que <span className="text-dilq-blue">Escolher</span> Nossa Plataforma
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Uma solução completa que transforma a maneira como você gerencia suas tarefas, finanças e relacionamentos.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-green-100 h-12 w-12 rounded-full flex items-center justify-center">
                  <Brain className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Integração Total</h3>
                  <p className="text-gray-600">Todos os módulos trabalham em perfeita harmonia, criando uma experiência coesa e eficiente.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-blue-100 h-12 w-12 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Segurança Avançada</h3>
                  <p className="text-gray-600">Seus dados são protegidos com os mais altos padrões de segurança e criptografia.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-yellow-100 h-12 w-12 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Visualização Clara</h3>
                  <p className="text-gray-600">Acompanhe seu progresso com dashboards intuitivos e relatórios detalhados.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-red-100 h-12 w-12 rounded-full flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Controle Total</h3>
                  <p className="text-gray-600">Tenha o controle de todas as áreas importantes da sua vida em uma única plataforma.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-dilq-blue to-blue-600 py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
            Pronto para transformar sua vida?
          </h2>
          <p className="text-xl text-sky-100 max-w-3xl mx-auto mb-12">
            Comece a jornada para uma vida de significado, organização e alta performance hoje mesmo.
          </p>
          <Button onClick={handleGetStarted} className="text-lg bg-white text-dilq-blue hover:bg-gray-100 px-8 py-6 rounded-lg transition-all duration-300 transform hover:scale-105">
            Começar Gratuitamente <ArrowRight className="ml-2" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <img src="/lovable-uploads/edd4e2f7-ee31-4d6c-8b97-6b0b3771a57e.png" alt="DILQ ORBE" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold">DILQ ORBE</span>
            </div>
            
            <div className="text-gray-400 text-center md:text-right">
              <p>© 2024 DILQ ORBE. Todos os direitos reservados.</p>
              <p className="mt-2 text-sm">Criado com ❤️ para elevar seu potencial.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>;
}
