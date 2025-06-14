import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Building2,
  CheckCircle,
  AlertCircle,
  Users,
  Target,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

type ProjectCompany = {
  id: string;
  name: string;
  is_active: boolean | null;
  user_id: string;
};

type ProjectTask = {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  company_id: string;
  project_companies?: {
    name: string;
    is_active: boolean | null;
  } | null;
};

export function ProjectDashboard() {
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['project-companies-dashboard'],
    queryFn: async () => {
      console.log('🏢 Fetching companies for dashboard...');
      const { data, error } = await supabase
        .from('project_companies')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('❌ Error fetching companies:', error);
        throw error;
      }
      console.log('✅ Companies for dashboard loaded:', data?.length);
      return data as ProjectCompany[];
    }
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['project-tasks-dashboard'],
    queryFn: async () => {
      console.log('📋 Fetching tasks for dashboard...');
      const { data, error } = await supabase
        .from('project_tasks')
        .select(`
          *,
          project_companies (
            name,
            is_active
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching tasks for dashboard:', error);
        throw error;
      }
      console.log('✅ Tasks for dashboard loaded:', data?.length);
      return data as ProjectTask[];
    }
  });

  const toggleCompanyStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('project_companies')
        .update({ is_active } as any)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-companies-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['project-companies'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks-dashboard'] });
      toast.success('Status da empresa atualizado!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar status da empresa:', error);
      toast.error('Erro ao atualizar status da empresa');
    }
  });

  // Calcular métricas
  const activeCompanies = companies.filter(c => c.is_active !== false);
  const inactiveCompanies = companies.filter(c => c.is_active === false);
  
  // Tarefas por empresa ativa
  const activeTasks = tasks.filter(task => 
    task.project_companies?.is_active !== false
  );
  
  const pendingTasks = activeTasks.filter(task => 
    task.status === 'pending' || task.status === 'in_progress'
  );
  
  const completedTasks = activeTasks.filter(task => 
    task.status === 'completed'
  );

  // Empresas que precisam finalizar tarefas
  const companiesWithPendingTasks = companies.filter(company => {
    if (company.is_active === false) return false;
    return tasks.some(task => 
      task.company_id === company.id && 
      (task.status === 'pending' || task.status === 'in_progress')
    );
  });

  const handleToggleCompanyStatus = (company: ProjectCompany) => {
    const newStatus = !company.is_active;
    toggleCompanyStatusMutation.mutate({ 
      id: company.id, 
      is_active: newStatus 
    });
  };

  if (isLoadingCompanies || isLoadingTasks) {
    return <div className="text-center p-4">Carregando dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCompanies.length}</div>
            <p className="text-xs text-gray-500">
              {inactiveCompanies.length} inativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingTasks.length}</div>
            <p className="text-xs text-gray-500">
              Precisam de atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
            <p className="text-xs text-gray-500">
              Este período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precisam Finalizar</CardTitle>
            <Target className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{companiesWithPendingTasks.length}</div>
            <p className="text-xs text-gray-500">
              Empresas com pendências
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de empresas com controle de status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Gerenciar Status das Empresas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhuma empresa cadastrada ainda.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((company) => {
                const companyTasks = tasks.filter(task => task.company_id === company.id);
                const pendingCompanyTasks = companyTasks.filter(task => 
                  task.status === 'pending' || task.status === 'in_progress'
                );
                const completedCompanyTasks = companyTasks.filter(task => 
                  task.status === 'completed'
                );

                return (
                  <div 
                    key={company.id} 
                    className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-lg">{company.name}</h4>
                        <div className="flex gap-2 mt-2">
                          <Badge 
                            variant={company.is_active !== false ? "default" : "secondary"}
                            className={
                              company.is_active !== false 
                                ? "bg-green-100 text-green-800" 
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {company.is_active !== false ? "Ativo" : "Inativo"}
                          </Badge>
                          {pendingCompanyTasks.length > 0 && (
                            <Badge variant="destructive">
                              {pendingCompanyTasks.length} pendente{pendingCompanyTasks.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleCompanyStatus(company)}
                        className="flex items-center gap-1"
                      >
                        {company.is_active !== false ? (
                          <>
                            <ToggleRight className="h-4 w-4 text-green-600" />
                            <span className="text-xs">Desativar</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-4 w-4 text-gray-600" />
                            <span className="text-xs">Ativar</span>
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Tarefas concluídas:</span>
                        <span className="font-medium">{completedCompanyTasks.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tarefas pendentes:</span>
                        <span className="font-medium text-orange-600">{pendingCompanyTasks.length}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empresas que precisam finalizar tarefas */}
      {companiesWithPendingTasks.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Empresas com Tarefas Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {companiesWithPendingTasks.map((company) => {
                const pendingCount = tasks.filter(task => 
                  task.company_id === company.id && 
                  (task.status === 'pending' || task.status === 'in_progress')
                ).length;

                return (
                  <div key={company.id} className="flex justify-between items-center p-2 bg-white rounded border">
                    <span className="font-medium">{company.name}</span>
                    <Badge variant="destructive">
                      {pendingCount} tarefa{pendingCount !== 1 ? 's' : ''} pendente{pendingCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
