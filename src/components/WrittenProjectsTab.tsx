import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompanyManager } from "./written-projects/CompanyManager";
import { ProjectTasks } from "./written-projects/ProjectTasks";
import { CredentialsManager } from "./written-projects/CredentialsManager";
export function WrittenProjectsTab() {
  const [activeTab, setActiveTab] = useState("companies");
  return <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Written Projects</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="companies">Empresas</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="credentials">Credenciais</TabsTrigger>
        </TabsList>
        <TabsContent value="companies">
          <CompanyManager />
        </TabsContent>
        <TabsContent value="tasks">
          <ProjectTasks />
        </TabsContent>
        <TabsContent value="credentials">
          <CredentialsManager />
        </TabsContent>
      </Tabs>
    </div>;
}