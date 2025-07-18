import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Bell, Shield, Volume2, Settings2, Save, RefreshCw, Lock, Eye, BellDot, CreditCard } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
type Settings = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  darkMode: boolean;
  language: string;
  autoSave: boolean;
  notificationFrequency: "realtime" | "daily" | "weekly";
  volume: number;
};
const defaultSettings: Settings = {
  emailNotifications: true,
  pushNotifications: true,
  soundEnabled: true,
  darkMode: false,
  language: "pt-BR",
  autoSave: true,
  notificationFrequency: "daily",
  volume: 80
};
export function SettingsTab() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  useEffect(() => {
    const storedSettings = localStorage.getItem("appSettings");
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      setSettings({
        ...defaultSettings,
        ...parsed
      });
      document.documentElement.classList.toggle("dark", parsed.darkMode);
    } else {
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setSettings(s => ({
        ...s,
        darkMode: isSystemDark
      }));
      document.documentElement.classList.toggle("dark", isSystemDark);
    }
  }, []);
  const handleSettingChange = <K extends keyof Settings,>(key: K, value: Settings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const toggleDarkMode = (enabled: boolean) => {
    handleSettingChange("darkMode", enabled);
    document.documentElement.classList.toggle("dark", enabled);
    toast.success(`Modo ${enabled ? "escuro" : "claro"} ativado`);
  };
  const handleSaveSettings = () => {
    localStorage.setItem("appSettings", JSON.stringify(settings));
    toast.success("Configurações salvas com sucesso!");
  };
  const handleReset = () => {
    setSettings(defaultSettings);
    localStorage.removeItem("appSettings");
    document.documentElement.classList.toggle("dark", defaultSettings.darkMode);
    toast.success("Configurações redefinidas para os valores padrão");
  };
  return <div className="space-y-6 max-w-5xl mx-auto">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-dilq-purple/20 to-dilq-blue/20 rounded-2xl blur-3xl -z-10 opacity-70"></div>
        <div className="bg-gradient-to-r from-white/10 to-white/5 dark:from-gray-900/60 dark:to-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-white/10 shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-4">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold bg-gradient-to-r from-dilq-blue to-dilq-purple bg-clip-text text-transparent flex items-center">
                <Settings2 className="mr-2 h-7 w-7 text-dilq-purple animate-pulse-subtle" />
                Configurações
              </div>
              <div className="hidden md:block h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
              <div className="text-muted-foreground">
                Personalize sua experiência no aplicativo
              </div>
            </div>
            
            <div className="flex space-x-2">
              
              
              
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-200 dark:border-gray-700 w-full grid grid-cols-2 sm:grid-cols-3 gap-1">
          <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200 data-[state=active]:border-b-2 data-[state=active]:border-dilq-purple">
            <Bell className="h-4 w-4 mr-2" />
            Notificações
          </TabsTrigger>
          
          <TabsTrigger value="privacy" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200 data-[state=active]:border-b-2 data-[state=active]:border-dilq-accent">
            <Shield className="h-4 w-4 mr-2" />
            Privacidade
          </TabsTrigger>

          <TabsTrigger value="billing" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm transition-all duration-200 data-[state=active]:border-b-2 data-[state=active]:border-dilq-accent">
            <CreditCard className="h-4 w-4 mr-2" />
            Faturamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4 animate-fade-in">
          <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-dilq-purple/5 to-dilq-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-xl font-medium text-dilq-blue">
                <BellDot className="h-5 w-5 text-dilq-purple" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure como você deseja receber notificações
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between space-x-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <Label htmlFor="email-notifications" className="flex flex-col">
                    <span className="text-base font-medium">Notificações por email</span>
                    <span className="text-sm text-muted-foreground">
                      Receba atualizações importantes por email
                    </span>
                  </Label>
                  <Switch id="email-notifications" checked={settings.emailNotifications} onCheckedChange={val => handleSettingChange('emailNotifications', val)} className="data-[state=checked]:bg-dilq-purple" />
                </div>
                
                <div className="flex items-center justify-between space-x-2 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <Label htmlFor="push-notifications" className="flex flex-col">
                    <span className="text-base font-medium">Notificações push</span>
                    <span className="text-sm text-muted-foreground">
                      Receba notificações em tempo real
                    </span>
                  </Label>
                  <Switch id="push-notifications" checked={settings.pushNotifications} onCheckedChange={val => handleSettingChange('pushNotifications', val)} className="data-[state=checked]:bg-dilq-purple" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4 animate-fade-in">
          <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-dilq-accent/5 to-dilq-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-xl font-medium text-dilq-accent">
                <Shield className="h-5 w-5 text-dilq-accent" />
                Privacidade
              </CardTitle>
              <CardDescription>
                Gerencie suas configurações de privacidade
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 relative overflow-hidden md:col-span-2">
                  <div className="absolute top-0 right-0 p-1 m-1 rounded-full bg-green-100 dark:bg-green-900/30">
                    <Lock className="h-3 w-3 text-green-500 dark:text-green-400" />
                  </div>
                  
                  <h3 className="text-base font-medium mb-2 flex items-center">
                    <Eye className="h-4 w-4 mr-2 text-dilq-accent" />
                    Política de Privacidade
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-4">
                    Nossa política de privacidade descreve como coletamos, usamos e
                    protegemos suas informações pessoais.
                  </p>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="border-dilq-accent/20 hover:border-dilq-accent/50 hover:bg-dilq-accent/5 transition-all duration-300">
                        Ler política de privacidade
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border border-dilq-accent/20">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Resumo da política de privacidade</h4>
                        <p className="text-xs text-muted-foreground">
                          Coletamos apenas os dados necessários para fornecer os serviços
                          solicitados. Suas informações são armazenadas de forma segura e
                          não são compartilhadas com terceiros sem sua autorização.
                        </p>
                        <Button size="sm" variant="outline" className="w-full mt-2 text-xs">
                          Ver política completa
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 md:col-span-2">
                  <h3 className="text-base font-medium mb-2">Dados pessoais</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Gerencie como seus dados pessoais são utilizados em nossa plataforma.
                  </p>
                  <Button variant="outline" className="border-dilq-accent/20 hover:border-dilq-accent/50 hover:bg-dilq-accent/5 transition-all duration-300">
                    Gerenciar dados
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4 animate-fade-in">
          <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white/70 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-dilq-accent/5 to-dilq-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-xl font-medium text-dilq-accent">
                <CreditCard className="h-5 w-5 text-dilq-accent" />
                Faturamento e Assinatura
              </CardTitle>
              <CardDescription>
                Gerencie suas informações de pagamento e assinatura
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="text-base font-medium mb-2">Plano Atual</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Você está no plano <span className="font-bold text-dilq-purple">Pro</span>.
                  </p>
                  <Button variant="outline" className="border-dilq-accent/20 hover:border-dilq-accent/50 hover:bg-dilq-accent/5 transition-all duration-300">
                    Gerenciar Assinatura
                  </Button>
                </div>
                
                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="text-base font-medium mb-2">Método de Pagamento</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Seu cartão de crédito terminando em •••• 1234.
                  </p>
                  <Button variant="outline" className="border-dilq-accent/20 hover:border-dilq-accent/50 hover:bg-dilq-accent/5 transition-all duration-300">
                    Atualizar Pagamento
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button onClick={handleSaveSettings} className="bg-gradient-to-r from-dilq-blue to-dilq-purple hover:from-dilq-blue/90 hover:to-dilq-purple/90 transition-all duration-300 shadow-md hover:shadow-lg group">
          <Save className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
          Salvar configurações
        </Button>
      </div>
    </div>;
}