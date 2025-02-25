
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

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export function Sidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-24 h-24 overflow-hidden">
          <img
            src="/lovable-uploads/edd4e2f7-ee31-4d6c-8b97-6b0b3771a57e.png"
            alt="DILQ ORBE"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      
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
              Written Projects
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
  );
}
