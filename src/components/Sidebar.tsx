
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  CheckSquare,
  Wallet,
  FileText,
  Calendar,
  Trophy,
  User,
  Settings,
  LogOut,
  Briefcase,
  BarChart3,
} from "lucide-react";
import { useRef, useEffect, useState } from "react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export function Sidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  // Check if scrolling is needed based on sidebar height vs window height
  useEffect(() => {
    const checkScrollNeeded = () => {
      if (sidebarRef.current) {
        const sidebarHeight = sidebarRef.current.scrollHeight;
        const windowHeight = window.innerHeight;
        setShowScrollIndicator(sidebarHeight > windowHeight);
      }
    };

    checkScrollNeeded();
    window.addEventListener('resize', checkScrollNeeded);
    
    return () => {
      window.removeEventListener('resize', checkScrollNeeded);
    };
  }, []);

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-24 h-24 overflow-hidden">
          <img
            src="/lovable-uploads/edd4e2f7-ee31-4d6c-8b97-6b0b3771a57e.png"
            alt="DILQ ORBE"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      
      <div 
        ref={sidebarRef} 
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent pr-1"
      >
        <nav className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-400">MÓDULOS</span>
            <div className="space-y-1">
              <Button 
                variant={activeTab === 'dashboard' ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab('dashboard')}
              >
                <LayoutDashboard size={20} />
                Painel
              </Button>
              <Button 
                variant={activeTab === 'tasks' ? "secondary" : "ghost"} 
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab('tasks')}
              >
                <CheckSquare size={20} />
                Execução
              </Button>
              <Button 
                variant={activeTab === 'finance' ? "secondary" : "ghost"} 
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab('finance')}
              >
                <Wallet size={20} />
                Financeiro
              </Button>
              <Button 
                variant={activeTab === 'services' ? "secondary" : "ghost"} 
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab('services')}
              >
                <Briefcase size={20} />
                Serviços
              </Button>
              <Button 
                variant={activeTab === 'projects' ? "secondary" : "ghost"} 
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab('projects')}
              >
                <FileText size={20} />
                Projetos
              </Button>
              <Button 
                variant={activeTab === 'budget' ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab('budget')}
              >
                <FileText size={20} />
                Orçamentos
              </Button>
              <Button 
                variant={activeTab === 'journals' ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab('journals')}
              >
                <Calendar size={20} />
                Diários
              </Button>
              <Button 
                variant={activeTab === 'habits' ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab('habits')}
              >
                <BarChart3 size={20} />
                Hábitos
              </Button>
              <Button 
                variant={activeTab === 'challenges' ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab('challenges')}
              >
                <Trophy size={20} />
                Desafios
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-400">CONFIGURAÇÕES</span>
            <div className="space-y-1">
              <Button 
                variant={activeTab === 'profile' ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab('profile')}
              >
                <User size={20} />
                Perfil
              </Button>
              <Button 
                variant={activeTab === 'settings' ? "secondary" : "ghost"}
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab('settings')}
              >
                <Settings size={20} />
                Configurações
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={onLogout}
              >
                <LogOut size={20} />
                Sair
              </Button>
            </div>
          </div>
        </nav>
      </div>
      
      {showScrollIndicator && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 opacity-70 flex items-center justify-center animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
