import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Calendar, 
  CheckCircle, 
  CreditCard, 
  Layers, 
  Settings2, 
  Shield, 
  Users, 
  Sparkles, 
  Brain, 
  ArrowDown, 
  CheckSquare, 
  Wallet, 
  FileText,
  LayoutDashboard,
  BarChart3,
  Rocket,
  CircuitBoard,
  Atom,
  Infinity,
  Globe,
  Gem,
  Star,
  ArrowUp,
  Check,
  CreditCard as CreditCardIcon,
  Lock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const [currentTimeImage, setCurrentTimeImage] = useState("");
  const [currentPeriod, setCurrentPeriod] = useState("");
  const [scrollY, setScrollY] = useState(0);
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

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

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getCurrentTimePeriod = () => {
    const brazilTime = toZonedTime(new Date(), 'America/Sao_Paulo');
    const hours = brazilTime.getHours();
    
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

  const getTimeBasedImage = (period) => {
    const images = dayTimeImages[period];
    return images[Math.floor(Math.random() * images.length)];
  };

  useEffect(() => {
    const updateTimeImage = () => {
      const period = getCurrentTimePeriod();
      setCurrentPeriod(period);
      setCurrentTimeImage(getTimeBasedImage(period));
    };

    updateTimeImage();
    
    const interval = setInterval(updateTimeImage, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const formatBrazilTime = () => {
    const brazilTime = toZonedTime(new Date(), 'America/Sao_Paulo');
    return format(brazilTime, 'HH:mm');
  };

  const getPeriodNamePt = (period) => {
    const names = {
      sunrise: "Nascer do Sol",
      day: "Dia",
      sunset: "Pôr do Sol",
      night: "Noite"
    };
    return names[period] || "";
  };

  const features = [
    {
      icon: <CheckSquare className="h-12 w-12 text-white" />,
      title: "Gerenciamento de Tarefas",
      description: "Organize suas tarefas por prioridade, data e categoria. Visualize o progresso em tempo real e nunca perca um prazo.",
      image: "/lovable-uploads/99e7aac7-744d-4de9-b9e1-9c20a8fc888d.png",
      benefits: ["Categorização inteligente de tarefas", "Sistema de prioridades visual", "Lembretes e notificações", "Visualização em calendário"]
    }, 
    {
      icon: <Wallet className="h-12 w-12 text-white" />,
      title: "Controle Financeiro",
      description: "Controle despesas e receitas, categorize transações e visualize relatórios detalhados de sua saúde financeira.",
      image: "/lovable-uploads/8f240519-6c48-4f3b-8df8-d14185a69801.png",
      benefits: ["Rastreamento de gastos em tempo real", "Categorização automática de transações", "Relatórios e gráficos interativos", "Previsão de fluxo de caixa"]
    }, 
    {
      icon: <Users className="h-12 w-12 text-white" />,
      title: "Gestão de Clientes",
      description: "Mantenha todos os detalhes de seus clientes organizados e acessíveis. Melhore seu relacionamento com clientes importantes.",
      image: "/lovable-uploads/5ae00ec0-2ce3-4089-8b37-74e21853f67a.png",
      benefits: ["Base de dados centralizada", "Histórico de interações", "Acompanhamento de projetos por cliente", "Acesso via portal do cliente"]
    }, 
    {
      icon: <FileText className="h-12 w-12 text-white" />,
      title: "Projetos Escritos",
      description: "Documente e acompanhe seus projetos escritos, mantendo um histórico organizado e acessível.",
      image: "/lovable-uploads/5ae00ec0-2ce3-4089-8b37-74e21853f67a.png",
      benefits: ["Repositório de documentos estruturado", "Controle de versões de arquivos", "Colaboração em equipe", "Métricas de progresso"]
    }, 
    {
      icon: <Calendar className="h-12 w-12 text-white" />,
      title: "Hábitos & Desafios",
      description: "Crie e monitore hábitos diários. Participe de desafios e acompanhe seu progresso com métricas visuais.",
      image: "/lovable-uploads/99e7aac7-744d-4de9-b9e1-9c20a8fc888d.png",
      benefits: ["Rastreador de hábitos diários", "Desafios personalizáveis", "Estatísticas de performance", "Sistema de recompensas"]
    }, 
    {
      icon: <LayoutDashboard className="h-12 w-12 text-white" />,
      title: "Dashboard Intuitivo",
      description: "Visualize todos os seus dados importantes em um só lugar com gráficos intuitivos e relatórios personalizados.",
      image: "/lovable-uploads/8f240519-6c48-4f3b-8df8-d14185a69801.png",
      benefits: ["Visão consolidada de todas as áreas", "Widgets personalizáveis", "Painéis interativos", "Métricas e KPIs configuráveis"]
    }, 
    {
      icon: <Shield className="h-12 w-12 text-white" />,
      title: "Portal do Cliente",
      description: "Um espaço dedicado onde seus clientes podem acessar informações relevantes e acompanhar o progresso dos projetos.",
      image: "/lovable-uploads/a75a2d60-5167-4f4b-a7d2-fb100c9c9a80.png",
      benefits: ["Acesso seguro para clientes", "Compartilhamento de arquivos", "Aprovações e feedback em tempo real", "Comunicação centralizada"]
    }, 
    {
      icon: <Settings2 className="h-12 w-12 text-white" />,
      title: "Perfil & Configurações",
      description: "Personalize sua experiência ajustando configurações de acordo com suas preferências.",
      image: "/lovable-uploads/5ae00ec0-2ce3-4089-8b37-74e21853f67a.png",
      benefits: ["Perfil detalhado do usuário", "Configurações de notificações", "Personalização visual", "Ajustes de privacidade"]
    }
  ];
  
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
  
  const Step = ({ number, title, description, icon }: StepProps) => (
    <div className="flex items-start space-x-4 relative z-10 backdrop-blur-sm bg-white/10 p-6 rounded-xl border border-white/20 shadow-lg transition-all duration-300 hover:bg-white/20 hover:scale-105">
      <div className="flex-shrink-0 bg-gradient-to-br from-purple-600 to-blue-500 h-12 w-12 rounded-full flex items-center justify-center shadow-lg">
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-100 mb-2">{title}</h3>
        <p className="text-gray-300">{description}</p>
      </div>
    </div>
  );
  
  const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => (
    <Card className="bg-gradient-to-br from-gray-900/70 to-gray-800/70 backdrop-blur-lg border-gray-700 hover:border-dilq-accent hover:shadow-lg hover:shadow-dilq-accent/20 transition-all duration-300 text-white">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <img src={testimonial.avatar} alt={testimonial.name} className="w-16 h-16 rounded-full object-cover border-2 border-dilq-accent/50" />
          <div>
            <p className="italic text-gray-300 mb-4">"{testimonial.content}"</p>
            <div>
              <p className="font-semibold text-white">{testimonial.name}</p>
              <p className="text-sm bg-gradient-to-r from-dilq-purple to-dilq-accent bg-clip-text text-transparent">{testimonial.role}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    isActive?: boolean;
    onClick?: () => void;
  }
  
  const FeatureCard = ({ icon, title, description, isActive = false, onClick }: FeatureCardProps) => (
    <Card 
      className={`
        cursor-pointer border transition-all duration-300 h-full backdrop-blur-md
        ${isActive ? 
          'bg-gradient-to-br from-purple-900/80 to-blue-900/80 border-dilq-accent shadow-md shadow-dilq-accent/30' : 
          'bg-gray-900/60 border-gray-700 hover:border-gray-500 hover:shadow-sm hover:shadow-dilq-accent/20'}
      `} 
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className={`mb-4 p-3 rounded-full inline-block ${isActive ? 'bg-dilq-accent/30' : 'bg-gray-800/70'}`}>
          {icon}
        </div>
        <h3 className={`text-xl font-semibold mb-2 ${isActive ? 'text-white' : 'text-gray-300'}`}>
          {title}
        </h3>
        <p className={`${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
          {description}
        </p>
      </CardContent>
    </Card>
  );

  interface PricingCardProps {
    title: string;
    price: string;
    description: string;
    features: string[];
    buttonText: string;
    isPopular?: boolean;
    onClick: () => void;
  }

  const PricingCard = ({ title, price, description, features, buttonText, isPopular = false, onClick }: PricingCardProps) => (
    <Card 
      className={`
        relative overflow-hidden transition-all duration-300 h-full backdrop-blur-md
        ${isPopular ? 
          'bg-gradient-to-br from-purple-900/80 to-blue-900/80 border-dilq-accent shadow-lg shadow-dilq-accent/30' : 
          'bg-gray-900/60 border-gray-700 hover:border-gray-500'}
      `}
    >
      {isPopular && (
        <div className="absolute top-0 right-0">
          <div className="relative h-24 w-24">
            <div className="absolute transform rotate-45 bg-dilq-accent text-white text-xs font-bold py-1 right-[-35px] top-[32px] w-[170px] text-center">
              MAIS POPULAR
            </div>
          </div>
        </div>
      )}
      
      <CardContent className="p-6 flex flex-col h-full">
        <div className="mb-6">
          <h3 className={`text-xl font-semibold mb-2 ${isPopular ? 'text-white' : 'text-gray-300'}`}>
            {title}
          </h3>
          <div className="flex items-end gap-1 mb-2">
            <span className="text-3xl font-bold text-white">{price}</span>
            {price !== "Grátis" && <span className="text-gray-400 mb-1">/mês</span>}
          </div>
          <p className={`${isPopular ? 'text-gray-300' : 'text-gray-400'} mb-6`}>
            {description}
          </p>
        </div>
        
        <div className="space-y-4 flex-grow mb-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <Check className={`h-5 w-5 mt-0.5 ${isPopular ? 'text-dilq-accent' : 'text-gray-400'}`} />
              <span className={isPopular ? 'text-gray-200' : 'text-gray-400'}>{feature}</span>
            </div>
          ))}
        </div>
        
        <Button 
          onClick={onClick} 
          className={`w-full ${isPopular ? 
            'bg-dilq-accent hover:bg-dilq-accent/90 text-white' : 
            'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'}`}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-dilq-darkblue via-gray-900 to-black"></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_400px_at_0%_0%,rgba(123,104,238,0.2),transparent)]"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_400px_at_100%_100%,rgba(32,178,170,0.2),transparent)]"></div>
        </div>
        
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-white/5 animate-pulse-subtle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 10 + 2}px`,
                height: `${Math.random() * 10 + 2}px`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 10 + 5}s`
              }}
            ></div>
          ))}
        </div>
        
        <div className="absolute inset-0 bg-[linear-gradient(rgba(123,104,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(123,104,238,0.1)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
      </div>

      <nav className="py-4 px-6 border-b border-white/10 sticky top-0 bg-gray-900/80 backdrop-blur-lg z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/lovable-uploads/edd4e2f7-ee31-4d6c-8b97-6b0b3771a57e.png" alt="DILQ ORBE" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold text-white">DILQ ORBE</span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="text-gray-300 hover:text-white"
              onClick={scrollToPricing}
            >
              Preços
            </Button>
            <Button onClick={handleGetStarted} className="bg-gradient-to-r from-dilq-accent to-dilq-teal hover:shadow-lg hover:shadow-dilq-accent/30 text-white transition-all">
              Começar Agora
            </Button>
          </div>
        </div>
      </nav>

      <div ref={heroRef} className="relative container mx-auto px-4 py-24 md:py-36">
        <div 
          className="absolute top-20 right-10 w-64 h-64 bg-dilq-accent/20 rounded-full blur-3xl opacity-30 animate-pulse-subtle"
          style={{ animationDuration: '15s' }}
        ></div>
        <div 
          className="absolute bottom-10 left-10 w-72 h-72 bg-dilq-teal/20 rounded-full blur-3xl opacity-30 animate-pulse-subtle"
          style={{ animationDuration: '20s', animationDelay: '2s' }}
        ></div>
        
        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="lg:w-1/2 space-y-8 relative" style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="px-3 py-1 bg-gradient-to-r from-dilq-accent/20 to-dilq-teal/20 backdrop-blur-sm rounded-full border border-white/10">
                  <span className="text-sm text-white flex items-center">
                    <Rocket className="h-3 w-3 mr-2" /> Tecnologia de ponta
                  </span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-300 leading-tight">
                O Grande <span className="text-transparent bg-clip-text bg-gradient-to-r from-dilq-accent to-dilq-teal">Alinhamento</span>
              </h1>
              
              <p className="text-xl text-gray-300 max-w-2xl">
                Sincronize sua mente, corpo e propósito. Transforme sua existência em um estado de alta performance e significado através deste sistema integrado de gestão.
              </p>
              
              <div className="flex items-center space-x-2 text-gray-400">
                <div className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                  <p className="text-sm">
                    Horário atual no Brasil: {formatBrazilTime()} - {getPeriodNamePt(currentPeriod)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleGetStarted} 
                className="text-lg relative overflow-hidden group bg-gradient-to-r from-dilq-accent to-dilq-teal hover:from-dilq-accent/90 hover:to-dilq-teal/90 text-white px-8 py-6 rounded-lg transition-all duration-300"
              >
                <span className="relative z-10 flex items-center">
                  Começar Agora <ArrowRight className="ml-2" />
                </span>
                <span className="absolute inset-0 translate-y-[105%] bg-white/20 transition-transform duration-300 group-hover:translate-y-0"></span>
              </Button>
              
              <Button 
                variant="outline" 
                className="text-lg border-white/20 text-gray-300 hover:bg-white/10 px-8 py-6 rounded-lg backdrop-blur-sm transition-all duration-300"
                onClick={scrollToPricing}
              >
                Ver Preços <ArrowDown className="ml-2" />
              </Button>
            </div>
          </div>
          
          <div className="lg:w-1/2 relative" style={{ transform: `translateY(${scrollY * -0.1}px)` }}>
            <div className="absolute -inset-4 bg-gradient-to-r from-dilq-accent/20 to-dilq-teal/20 rounded-[30px] blur-xl opacity-70 animate-pulse-subtle" style={{ animationDuration: '8s' }}></div>
            
            <div className="relative rounded-2xl overflow-hidden border-[3px] border-white/20 transform hover:scale-105 transition-transform duration-500 bg-gray-800/50 backdrop-blur-md">
              {currentTimeImage && (
                <img 
                  alt={`DILQ ORBE - ${getPeriodNamePt(currentPeriod)}`} 
                  className="w-full object-contain"
                  src={currentTimeImage}
                />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 via-transparent to-gray-900/30 pointer-events-none"></div>
              
              <div className="absolute top-6 right-6 p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 animate-float">
                <CircuitBoard className="h-5 w-5 text-dilq-accent" />
              </div>
              <div className="absolute bottom-6 left-6 p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 animate-float" style={{ animationDelay: '1s' }}>
                <Brain className="h-5 w-5 text-dilq-teal" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="features" className="relative z-10 py-24 md:py-36">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-dilq-accent/10 rounded-full blur-[100px] -z-10"></div>
            <div className="inline-block px-4 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 mb-4">
              <Sparkles className="inline-block h-4 w-4 mr-2 text-dilq-accent" />
              Funcionalidades exclusivas
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Funcionalidades <span className="text-transparent bg-clip-text bg-gradient-to-r from-dilq-accent to-dilq-teal">Poderosas</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Todas as ferramentas que você precisa para transformar sua vida pessoal e profissional em um só lugar, projetadas para sincronizar todas as áreas da sua existência.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index} 
                icon={feature.icon} 
                title={feature.title} 
                description={feature.description} 
                isActive={activeFeature === index} 
                onClick={() => setActiveFeature(index)} 
              />
            ))}
          </div>
          
          <div className="mt-24 bg-gray-900/60 backdrop-blur-xl rounded-2xl shadow-2xl p-8 md:p-12 border border-white/10">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <div className="relative rounded-xl overflow-hidden border-[3px] border-dilq-accent/20 shadow-2xl shadow-dilq-accent/10 h-[400px] transform transition-all duration-700 hover:scale-105 group">
                  <img src={features[activeFeature].image} alt={features[activeFeature].title} className="w-full h-full object-cover" />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex items-end">
                    <div className="p-6 text-white transform transition-transform duration-300 group-hover:translate-y-0 translate-y-4">
                      <h3 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-dilq-accent to-dilq-teal">{features[activeFeature].title}</h3>
                      <p className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">{features[activeFeature].description}</p>
                    </div>
                  </div>
                  
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-dilq-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-dilq-teal opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
              
              <div className="lg:w-1/2 space-y-8">
                <h3 className="text-2xl font-bold text-white">
                  {features[activeFeature].title}
                </h3>
                <p className="text-gray-300">
                  {features[activeFeature].description}
                </p>
                
                <ul className="space-y-4">
                  {features[activeFeature].benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-3 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 transform transition-all duration-300 hover:bg-white/10 hover:translate-x-2">
                      <CheckCircle className="h-5 w-5 text-dilq-accent" />
                      <span className="text-gray-200">{benefit}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={handleGetStarted} 
                  className="relative overflow-hidden bg-gradient-to-r from-dilq-accent to-dilq-teal hover:shadow-lg hover:shadow-dilq-accent/30 text-white transform transition-all duration-300 hover:scale-105"
                >
                  Experimentar <ArrowRight className="ml-2 h-4 w-4" />
                  <span className="absolute inset-0 bg-white/20 scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100"></span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="pricing" ref={pricingRef} className="relative z-10 py-24 md:py-36">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-dilq-accent/10 rounded-full blur-[100px] -z-10"></div>
            <div className="inline-block px-4 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 mb-4">
              <CreditCardIcon className="inline-block h-4 w-4 mr-2 text-dilq-accent" />
              Planos Acessíveis
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Escolha o <span className="text-transparent bg-clip-text bg-gradient-to-r from-dilq-accent to-dilq-teal">Plano</span> Ideal
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10">
              Experimente gratuitamente e escolha o plano que melhor se adapta às suas necessidades.
            </p>
            
            <div className="flex items-center justify-center gap-3 mb-12">
              <span className={`text-sm ${!yearlyBilling ? 'text-white font-medium' : 'text-gray-400'}`}>Cobrança Mensal</span>
              <button 
                onClick={() => setYearlyBilling(!yearlyBilling)}
                className="relative inline-flex h-6 w-12 items-center rounded-full bg-gray-800 transition-colors focus:outline-none"
              >
                <span className="sr-only">Alternar entre cobrança mensal e anual</span>
                <span
                  className={`${
                    yearlyBilling ? 'translate-x-6 bg-dilq-accent' : 'translate-x-1 bg-gray-400'
                  } inline-block h-4 w-4 transform rounded-full transition-transform`}
                />
              </button>
              <span className={`text-sm flex items-center gap-1 ${yearlyBilling ? 'text-white font-medium' : 'text-gray-400'}`}>
                Cobrança Anual
                <span className="text-xs px-1.5 py-0.5 bg-dilq-accent/30 text-dilq-accent rounded-full">Economize 20%</span>
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <PricingCard
              title="Teste Grátis"
              price="Grátis"
              description="Experimente todas as funcionalidades por 3 dias sem compromisso."
              features={[
                "Acesso a todos os módulos",
                "Gerenciamento de tarefas",
                "Controle financeiro básico",
                "Gestão de clientes (limitado)",
                "Hábitos & Desafios"
              ]}
              buttonText="Começar Teste Grátis"
              onClick={handleGetStarted}
            />
            
            <PricingCard
              title="Premium"
              price={yearlyBilling ? "R$15,99" : "R$19,00"}
              description="Acesso completo a todas as funcionalidades disponíveis."
              features={[
                "Acesso ilimitado a todos os módulos",
                "Gerenciamento avançado de tarefas",
                "Controle financeiro completo",
                "Gestão ilimitada de clientes",
                "Hábitos & Desafios avançados",
                "Portal do cliente personalizado",
                "Prioridade no suporte"
              ]}
              buttonText="Assinar Agora"
              isPopular={true}
              onClick={handleGetStarted}
            />
          </div>
          
          <div className="flex items-center justify-center mt-12">
            <div className="flex items-center justify-center px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
              <Lock className="h-4 w-4 mr-2 text-gray-400" />
              <span className="text-sm text-gray-400">Pagamentos seguros via Stripe</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative py-24 z-10">
        <div 
          className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-dilq-teal/20 rounded-full blur-[100px] -z-10"
          style={{ transform: `translateY(${scrollY * 0.05}px)` }}
        ></div>
        
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 mb-4">
              <Atom className="inline-block h-4 w-4 mr-2 text-dilq-teal" />
              Processo simples
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Como <span className="text-transparent bg-clip-text bg-gradient-to-r from-dilq-accent to-dilq-teal">Funciona</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Em apenas alguns passos simples, você estará no caminho para uma vida mais organizada e produtiva.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Step number={1} title="Crie sua Conta" description="Configure seu perfil pessoal para começar a jornada de transformação." icon={<Users className="h-6 w-6 text-white" />} />
            <Step number={2} title="Configure seus Módulos" description="Personalize cada módulo de acordo com suas necessidades específicas." icon={<Settings2 className="h-6 w-6 text-white" />} />
            <Step number={3} title="Eleve sua Produtividade" description="Acompanhe seu progresso através de métricas claras e objetivas." icon={<Sparkles className="h-6 w-6 text-white" />} />
          </div>
        </div>
      </div>

      <div className="relative py-24 z-10">
        <div 
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-dilq-accent/20 rounded-full blur-[100px] -z-10"
          style={{ transform: `translateY(${scrollY * -0.05}px)` }}
        ></div>
        
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 mb-4">
              <Users className="inline-block h-4 w-4 mr-2 text-dilq-accent" />
              Histórias reais
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              O Que Nossos <span className="text-transparent bg-clip-text bg-gradient-to-r from-dilq-accent to-dilq-teal">Clientes</span> Dizem
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Descubra como nossos usuários transformaram suas vidas usando a plataforma DILQ ORBE.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </div>

      <div className="relative py-24 z-10">
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-b from-gray-900/0 via-dilq-darkblue/20 to-gray-900/0 pointer-events-none"></div>
        
        <div className="container mx-auto px-4">
          <div className="relative bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-3xl p-8 md:p-16 overflow-hidden border border-white/10 shadow-2xl max-w-5xl mx-auto">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-dilq-accent/10 rounded-full blur-[100px] -z-10 animate-pulse-subtle" style={{ animationDuration: '15s' }}></div>
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-dilq-teal/10 rounded-full blur-[100px] -z-10 animate-pulse-subtle" style={{ animationDuration: '20s', animationDelay: '2s' }}></div>
            </div>
            
            <div className="relative z-10 text-center space-y-8">
              <div className="inline-flex items-center justify-center p-1 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 mb-6">
                <div className="px-6 py-1 bg-gradient-to-r from-dilq-accent/20 to-dilq-teal/20 rounded-full">
                  <span className="text-sm text-white flex items-center justify-center">
                    <Infinity className="h-4 w-4 mr-2" /> Possibilidades Infinitas
                  </span>
                </div>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                Pronto para Transformar sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-dilq-accent to-dilq-teal">Existência</span>?
              </h2>
              
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Junte-se a milhares de pessoas que estão levando sua vida a um novo patamar através da integração do que realmente importa.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                <Button 
                  onClick={scrollToPricing} 
                  className="relative overflow-hidden group bg-gradient-to-r from-dilq-accent to-dilq-teal hover:from-dilq-accent/90 hover:to-dilq-teal/90 text-white px-10 py-6 rounded-xl transition-all duration-300 text-lg font-semibold shadow-lg shadow-dilq-accent/20 w-full sm:w-auto"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    Ver Planos <ArrowRight className="ml-2" />
                  </span>
                  <span className="absolute inset-0 translate-y-[105%] bg-white/20 transition-transform duration-300 group-hover:translate-y-0"></span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="text-lg border-white/20 text-gray-300 hover:bg-white/10 px-10 py-6 rounded-xl backdrop-blur-sm transition-all duration-300 w-full sm:w-auto"
                  onClick={() => window.open('mailto:info@dilqorbe.com')}
                >
                  <Globe className="mr-2 h-5 w-5" /> Entre em Contato
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative py-12 z-10 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-3">
                <img src="/lovable-uploads/edd4e2f7-ee31-4d6c-8b97-6b0b3771a57e.png" alt="DILQ ORBE" className="w-8 h-8 object-contain" />
                <span className="text-xl font-bold text-white">DILQ ORBE</span>
              </div>
              <p className="text-gray-400 mt-2 text-sm">© {new Date().getFullYear()} DILQ ORBE. Todos os direitos reservados.</p>
            </div>
            
            <div className="flex space-x-6">
              <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-transparent">
                Termos de Uso
              </Button>
              <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-transparent">
                Privacidade
              </Button>
              <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-transparent">
                Contato
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
