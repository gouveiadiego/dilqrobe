
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompanyManager } from "./written-projects/CompanyManager";
import { ProjectTasks } from "./written-projects/ProjectTasks";
import { ProjectDashboard } from "./written-projects/ProjectDashboard";
import { CredentialsManager } from "./written-projects/CredentialsManager";
import { ProjectTemplatesManager } from "./written-projects/ProjectTemplatesManager";
import { Rocket, Database, Shield, BarChart3, List } from "lucide-react";

export function WrittenProjectsTab() {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Rocket className="h-6 w-6 text-dilq-purple animate-float" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-dilq-indigo to-dilq-purple bg-clip-text text-transparent">
          Projetos
        </h2>
      </div>

      <div className="rounded-xl overflow-hidden">
        <Tabs 
          value={activeTab} 
          defaultValue="dashboard" 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="mb-6 w-full bg-white/70 border border-gray-100 shadow-sm backdrop-blur-sm p-1 rounded-xl">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-dilq-purple data-[state=active]:text-white hover:bg-dilq-purple/10"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="companies" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-dilq-purple data-[state=active]:text-white hover:bg-dilq-purple/10"
            >
              <Database className="h-4 w-4" />
              <span>Empresas</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="tasks" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-dilq-purple data-[state=active]:text-white hover:bg-dilq-purple/10"
            >
              <Rocket className="h-4 w-4" />
              <span>Tarefas</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="credentials" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-dilq-purple data-[state=active]:text-white hover:bg-dilq-purple/10"
            >
              <Shield className="h-4 w-4" />
              <span>Credenciais</span>
            </TabsTrigger>

            <TabsTrigger
              value="templates"
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-dilq-purple data-[state=active]:text-white hover:bg-dilq-purple/10"
            >
              <List className="h-4 w-4" />
              <span>Templates</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/80 overflow-hidden">
            <TabsContent value="dashboard" className="p-6 transition-all duration-300 animate-fade-in">
              <ProjectDashboard />
            </TabsContent>
            
            <TabsContent value="companies" className="p-6 transition-all duration-300 animate-fade-in">
              <CompanyManager />
            </TabsContent>
            
            <TabsContent value="tasks" className="p-6 transition-all duration-300 animate-fade-in">
              <ProjectTasks />
            </TabsContent>
            
            <TabsContent value="credentials" className="p-6 transition-all duration-300 animate-fade-in">
              <CredentialsManager />
            </TabsContent>

            <TabsContent value="templates" className="p-6 transition-all duration-300 animate-fade-in">
              <ProjectTemplatesManager />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
