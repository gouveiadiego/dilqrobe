
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompanyManager } from "./written-projects/CompanyManager";
import { ProjectTasks } from "./written-projects/ProjectTasks";
import { CredentialsManager } from "./written-projects/CredentialsManager";
import { Rocket, Database, Shield } from "lucide-react";

export function WrittenProjectsTab() {
  const [activeTab, setActiveTab] = useState("companies");
  
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Rocket className="h-6 w-6 text-dilq-purple animate-float" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-dilq-indigo to-dilq-purple bg-clip-text text-transparent">
          Projetos
        </h2>
      </div>

      <div className="p-1 rounded-2xl bg-gradient-to-r from-dilq-indigo/20 to-dilq-purple/20">
        <Tabs 
          value={activeTab} 
          defaultValue="companies" 
          onValueChange={setActiveTab} 
          className="w-full"
        >
          <TabsList className="mb-6 w-full bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 p-1 rounded-xl">
            <TabsTrigger 
              value="companies" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-dilq-indigo data-[state=active]:to-dilq-purple data-[state=active]:text-white"
            >
              <Database className="h-4 w-4" />
              <span>Empresas</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="tasks" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-dilq-indigo data-[state=active]:to-dilq-purple data-[state=active]:text-white"
            >
              <Rocket className="h-4 w-4" />
              <span>Tarefas</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="credentials" 
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-dilq-indigo data-[state=active]:to-dilq-purple data-[state=active]:text-white"
            >
              <Shield className="h-4 w-4" />
              <span>Credenciais</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100/80 overflow-hidden dark:bg-gray-900 dark:border-gray-800">
            <TabsContent value="companies" className="p-6 transition-all duration-300 animate-fade-in">
              <CompanyManager />
            </TabsContent>
            
            <TabsContent value="tasks" className="p-6 transition-all duration-300 animate-fade-in">
              <ProjectTasks />
            </TabsContent>
            
            <TabsContent value="credentials" className="p-6 transition-all duration-300 animate-fade-in">
              <CredentialsManager />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
