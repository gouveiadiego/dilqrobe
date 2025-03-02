
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompanyManager } from "./written-projects/CompanyManager";
import { ProjectTasks } from "./written-projects/ProjectTasks";
import { CredentialsManager } from "./written-projects/CredentialsManager";

export function WrittenProjectsTab() {
  const [activeTab, setActiveTab] = useState("companies");
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Projetos Escritos</h2>

      <Tabs defaultValue="companies" onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="companies">Empresas</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="credentials">Credenciais</TabsTrigger>
        </TabsList>
        
        <TabsContent value="companies" className="mt-4">
          <CompanyManager />
        </TabsContent>
        
        <TabsContent value="tasks" className="mt-4">
          <ProjectTasks />
        </TabsContent>
        
        <TabsContent value="credentials" className="mt-4">
          <CredentialsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
