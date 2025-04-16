
import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoDilq } from "./LogoDilq";
import { ThemeToggle } from "@/components/ThemeToggle";

export type TabType = 'dashboard' | 'tasks' | 'finance' | 'habits' | 'journals' | 'challenges' | 'profile' | 'settings' | 'budget' | 'services' | 'projects' | 'meetings';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
  onLogout?: () => Promise<void>;
}

export function Sidebar({ 
  isOpen,
  setIsOpen,
  activeTab,
  setActiveTab,
  onLogout
}: SidebarProps) {
  const [profile, setProfile] = useState<{
    id: string | undefined;
    avatar_url: string | undefined;
    email: string | undefined;
  }>({ id: undefined, avatar_url: undefined, email: undefined });
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const getProfile = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.error("Erro ao obter dados do usuário:", error);
          return;
        }

        const userId = data.user?.id;

        if (userId) {
          const { data: userProfile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

          if (profileError) {
            console.error("Erro ao buscar perfil do usuário:", profileError);
            return;
          }

          if (userProfile) {
            setProfile({
              id: userProfile.id,
              avatar_url: userProfile.avatar_url,
              email: data.user?.email,
            });
          }
        }
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Erro ao fazer logout:", error);
    }
    
    if (onLogout) {
      await onLogout();
    }
  };

  const handleNavLinkClick = (tab: TabType) => {
    if (setActiveTab) {
      setActiveTab(tab);
    }
  };

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:sticky top-0 h-screen`}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Menu className="absolute top-4 right-4 lg:hidden cursor-pointer" />
        </SheetTrigger>
        <SheetContent className="sm:max-w-xs p-0">
          <SheetHeader className="pl-0 pr-6">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>
              Ações rápidas e informações importantes
            </SheetDescription>
          </SheetHeader>
          <div className="flex h-16 items-center px-4 border-b border-gray-200 dark:border-gray-800">
            <LogoDilq className="h-8 w-auto" />
            <span className="ml-2 text-lg font-medium text-gray-900 dark:text-white">DilQ</span>
            <div className="ml-auto">
              <ThemeToggle size="sm" variant="ghost" />
            </div>
          </div>
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800">
            {loading ? (
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Avatar>
                  {profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt="Avatar" />
                  ) : (
                    <AvatarFallback>{profile.email?.[0].toUpperCase()}</AvatarFallback>
                  )}
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">{profile.email}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {profile.id}
                  </p>
                </div>
              </div>
            )}
          </div>
          <nav className="flex flex-col px-2 py-4 space-y-1">
            <NavLink
              to="/dashboard"
              className={`flex items-center px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ${location.pathname === '/dashboard' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
              onClick={() => handleNavLinkClick('dashboard')}
            >
              Visão geral
            </NavLink>
            <NavLink
              to="/dashboard/tasks"
              className={`flex items-center px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ${location.pathname === '/dashboard/tasks' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
              onClick={() => handleNavLinkClick('tasks')}
            >
              Tarefas
            </NavLink>
            <NavLink
              to="/dashboard/projects"
              className={`flex items-center px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ${location.pathname === '/dashboard/projects' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
              onClick={() => handleNavLinkClick('projects')}
            >
              Projetos
            </NavLink>
            <NavLink
              to="/dashboard/finances"
              className={`flex items-center px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ${location.pathname === '/dashboard/finances' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
              onClick={() => handleNavLinkClick('finance')}
            >
              Financeiro
            </NavLink>
            <NavLink
              to="/dashboard/meetings"
              className={`flex items-center px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ${location.pathname === '/dashboard/meetings' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
              onClick={() => handleNavLinkClick('meetings')}
            >
              Reuniões
            </NavLink>
            <NavLink
              to="/dashboard/settings"
              className={`flex items-center px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ${location.pathname === '/dashboard/settings' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
              onClick={() => handleNavLinkClick('settings')}
            >
              Configurações
            </NavLink>
          </nav>
          <div className="mt-auto px-4 py-2">
            <button
              onClick={handleSignOut}
              className="w-full py-2 px-4 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
            >
              Sair
            </button>
          </div>
        </SheetContent>
      </Sheet>
      <div className="flex h-16 items-center px-4 border-b border-gray-200 dark:border-gray-800">
        <LogoDilq className="h-8 w-auto" />
        <span className="ml-2 text-lg font-medium text-gray-900 dark:text-white">DilQ</span>
        <div className="ml-auto">
          <ThemeToggle size="sm" variant="ghost" />
        </div>
      </div>
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800">
        {loading ? (
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Avatar>
              {profile.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt="Avatar" />
              ) : (
                <AvatarFallback>{profile.email?.[0].toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">{profile.email}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {profile.id}
              </p>
            </div>
          </div>
        )}
      </div>
      <nav className="flex flex-col px-2 py-4 space-y-1">
        <NavLink
          to="/dashboard"
          className={`flex items-center px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ${location.pathname === '/dashboard' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
          onClick={() => handleNavLinkClick('dashboard')}
        >
          Visão geral
        </NavLink>
        <NavLink
          to="/dashboard/tasks"
          className={`flex items-center px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ${location.pathname === '/dashboard/tasks' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
          onClick={() => handleNavLinkClick('tasks')}
        >
          Tarefas
        </NavLink>
        <NavLink
          to="/dashboard/projects"
          className={`flex items-center px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ${location.pathname === '/dashboard/projects' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
          onClick={() => handleNavLinkClick('projects')}
        >
          Projetos
        </NavLink>
        <NavLink
          to="/dashboard/finances"
          className={`flex items-center px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ${location.pathname === '/dashboard/finances' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
          onClick={() => handleNavLinkClick('finance')}
        >
          Financeiro
        </NavLink>
        <NavLink
          to="/dashboard/meetings"
          className={`flex items-center px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ${location.pathname === '/dashboard/meetings' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
          onClick={() => handleNavLinkClick('meetings')}
        >
          Reuniões
        </NavLink>
        <NavLink
          to="/dashboard/settings"
          className={`flex items-center px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ${location.pathname === '/dashboard/settings' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
          onClick={() => handleNavLinkClick('settings')}
        >
          Configurações
        </NavLink>
      </nav>
      <div className="mt-auto px-4 py-2">
        <button
          onClick={handleSignOut}
          className="w-full py-2 px-4 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
