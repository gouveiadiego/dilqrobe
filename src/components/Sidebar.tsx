import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  CheckSquare, 
  Wallet, 
  Calendar, 
  Target, 
  User, 
  Settings, 
  LogOut, 
  BookOpen, 
  TrendingUp, 
  Briefcase, 
  FileText,
  Sparkles
} from "lucide-react";

type TabType = 'dashboard' | 'tasks' | 'finance' | 'habits' | 'journals' | 'challenges' | 'profile' | 'settings' | 'budget' | 'services' | 'projects' | 'meetings' | 'ai-assistant';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar = ({ activeTab, setActiveTab, onLogout, isOpen, setIsOpen }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'ai-assistant', label: 'Assistente IA', icon: Sparkles },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
    { id: 'meetings', label: 'Reuniões', icon: Calendar },
    { id: 'finance', label: 'Financeiro', icon: Wallet },
    { id: 'budget', label: 'Orçamento', icon: TrendingUp },
    { id: 'habits', label: 'Hábitos', icon: Target },
    { id: 'journals', label: 'Diário', icon: BookOpen },
    { id: 'services', label: 'Serviços', icon: Briefcase },
    { id: 'projects', label: 'Projetos', icon: FileText },
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold bg-gradient-to-r from-dilq-accent to-dilq-teal bg-clip-text text-transparent">
          DilQ Orbe
        </h1>
        <p className="text-sm text-gray-500 mt-1">Produtividade Inteligente</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start text-left transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-dilq-accent to-dilq-teal text-white shadow-md' 
                  : 'hover:bg-gray-100 text-gray-700'
              } ${item.id === 'ai-assistant' ? 'border border-[#9b87f5]/30 bg-gradient-to-r from-[#9b87f5]/10 to-[#33C3F0]/10' : ''}`}
              onClick={() => {
                setActiveTab(item.id as TabType);
                if (window.innerWidth < 768) {
                  setIsOpen(false);
                }
              }}
            >
              <Icon className={`mr-3 h-4 w-4 ${item.id === 'ai-assistant' ? 'text-[#9b87f5]' : ''}`} />
              <span className={item.id === 'ai-assistant' ? 'bg-gradient-to-r from-[#9b87f5] to-[#33C3F0] bg-clip-text text-transparent font-medium' : ''}>
                {item.label}
              </span>
              {item.id === 'ai-assistant' && (
                <Sparkles className="ml-auto h-3 w-3 text-[#9b87f5]" />
              )}
            </Button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={onLogout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
};
