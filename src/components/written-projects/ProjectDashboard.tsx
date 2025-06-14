import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Building2,
  CheckCircle,
  AlertCircle,
  Users,
  Target,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
  Filter,
  ArrowDownUp
} from "lucide-react";
import { ProjectCompany } from "@/hooks/useProjectCompanies";

type ProjectTask = {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  company_id: string;
};

type ChecklistItem = {
  id: string;
  company_id: string;
  title: string;
  completed: boolean;
};

export function ProjectDashboard() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'pending' | 'progress'>('name');

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
        .select(`*`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching tasks for dashboard:', error);
        throw error;
      }
      console.log('✅ Tasks for dashboard loaded:', data?.length);
      return data as ProjectTask[];
    }
  });

  const { data: checklistItems = [], isLoading: isLoadingChecklist } = useQuery({
    queryKey: ['project-checklist-dashboard'],
    queryFn: async () => {
      console.log('📋 Fetching checklist items for dashboard...');
      const { data, error } = await supabase
        .from('project_checklist')
        .select('id, company_id, title, completed');
      
      if (error) {
        console.error('❌ Error fetching checklist items:', error);
        throw error;
      }
      console.log('✅ Checklist items for dashboard loaded:', data?.length);
      return data as ChecklistItem[];
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
  
  const companiesById = new Map(companies.map(c => [c.id, c]));
  
  // Itens por empresa ativa
  const activeTasks = tasks.filter(task => {
    const company = companiesById.get(task.company_id);
    return company?.is_active !== false;
  });
  
  const activeChecklistItems = checklistItems.filter(item => {
    const company = companiesById.get(item.company_id);
    return company?.is_active !== false;
  });

  const pendingItemsCount = activeTasks.filter(task => 
    task.status === 'pending' || task.status === 'in_progress'
  ).length + activeChecklistItems.filter(item => !item.completed).length;
  
  const completedItemsCount = activeTasks.filter(task => 
    task.status === 'completed'
  ).length + activeChecklistItems.filter(item => item.completed).length;

  const totalItemsCount = pendingItemsCount + completedItemsCount;
  const completionPercentage = totalItemsCount > 0 ? Math.round((completedItemsCount / totalItemsCount) * 100) : 0;

  // Empresas que precisam finalizar itens
  const companiesWithPendingItems = companies.filter(company => {
    if (company.is_active === false) return false;
    const hasPendingTask = tasks.some(task => 
      task.company_id === company.id && 
      (task.status === 'pending' || task.status === 'in_progress')
    );
    const hasPendingChecklistItem = checklistItems.some(item =>
      item.company_id === company.id && !item.completed
    );
    return hasPendingTask || hasPendingChecklistItem;
  });

  const displayedCompanies = useMemo(() => {
    let filtered = companies;
    if (statusFilter === 'active') {
      filtered = companies.filter(c => c.is_active !== false);
    } else if (statusFilter === 'inactive') {
      filtered = companies.filter(c => c.is_active === false);
    }

    const companyMetrics = filtered.map(company => {
      const pendingCompanyTasks = tasks.filter(task => 
        task.company_id === company.id && (task.status === 'pending' || task.status === 'in_progress')
      ).length;
      const completedCompanyTasks = tasks.filter(task => 
        task.company_id === company.id && task.status === 'completed'
      ).length;
      const pendingCompanyChecklistItems = checklistItems.filter(item =>
        item.company_id === company.id && !item.completed
      ).length;
      const completedCompanyChecklistItems = checklistItems.filter(item =>
        item.company_id === company.id && item.completed
      ).length;

      const totalPending = pendingCompanyTasks + pendingCompanyChecklistItems;
      const totalCompleted = completedCompanyTasks + completedCompanyChecklistItems;
      const totalItems = totalPending + totalCompleted;
      const progress = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
      
      return { 
        ...company, 
        totalPendingForCompany: totalPending,
        totalCompletedForCompany: totalCompleted,
        progressPercentage: progress 
      };
    });

    switch (sortBy) {
      case 'pending':
        return companyMetrics.sort((a, b) => b.totalPendingForCompany - a.totalPendingForCompany);
      case 'progress':
        return companyMetrics.sort((a, b) => a.progressPercentage - b.progressPercentage);
      case 'name':
      default:
        return companyMetrics.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [companies, tasks, checklistItems, statusFilter, sortBy]);

  const handleToggleCompanyStatus = (company: ProjectCompany) => {
    const newStatus = !company.is_active;
    toggleCompanyStatusMutation.mutate({ 
      id: company.id, 
      is_active: newStatus 
    });
  };

  if (isLoadingCompanies || isLoadingTasks || isLoadingChecklist) {
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
            <div className="text-2xl font-bold text-orange-600">{pendingItemsCount}</div>
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
            <div className="text-2xl font-bold text-green-600">{completedItemsCount}</div>
            <p className="text-xs text-gray-500">
              {completionPercentage}% de progresso total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precisam Finalizar</CardTitle>
            <Target className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{companiesWithPendingItems.length}</div>
            <p className="text-xs text-gray-500">
              Empresas com pendências
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de empresas com controle de status */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Gerenciar Status das Empresas
            </CardTitle>
            <div className="flex items-center gap-2 md:gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="inactive">Inativas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDownUp className="h-4 w-4 text-gray-500" />
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nome (A-Z)</SelectItem>
                    <SelectItem value="pending">Mais Pendentes</SelectItem>
                    <SelectItem value="progress">Menor Progresso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {displayedCompanies.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhuma empresa encontrada para os filtros selecionados.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedCompanies.map((company) => {
                const hasManyPending = company.totalPendingForCompany > 5;
                const companyCardClass = `p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-300 flex flex-col ${hasManyPending ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-200'}`;
                
                return (
                  <div 
                    key={company.id} 
                    className={companyCardClass}
                  >
                    <div className="flex-grow">
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
                            {company.totalPendingForCompany > 0 && (
                              <Badge variant="destructive">
                                {company.totalPendingForCompany} pendente{company.totalPendingForCompany !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleCompanyStatus(company)}
                          className="flex items-center gap-1 text-xs"
                        >
                          {company.is_active !== false ? (
                            <>
                              <ToggleRight className="h-4 w-4 text-green-600" />
                              <span>Desativar</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-4 w-4 text-gray-600" />
                              <span>Ativar</span>
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                          <span>Progresso</span>
                          <span className="font-semibold">{company.progressPercentage}%</span>
                        </div>
                        <Progress 
                          value={company.progressPercentage} 
                          className="h-2" 
                          indicatorClassName={
                            company.progressPercentage < 30 ? 'bg-red-500' : 
                            company.progressPercentage < 70 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }
                        />
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Concluídas:</span>
                          <span className="font-medium text-green-600">{company.totalCompletedForCompany}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pendentes:</span>
                          <span className="font-medium text-orange-600">{company.totalPendingForCompany}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t">
                      <Link to={`/company-details/${company.id}`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full">
                          Ver Detalhes
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empresas que precisam finalizar tarefas */}
      {companiesWithPendingItems.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Empresas com Tarefas Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {companiesWithPendingItems.map((company) => {
                const pendingTaskCount = tasks.filter(task => 
                  task.company_id === company.id && 
                  (task.status === 'pending' || task.status === 'in_progress')
                ).length;
                const pendingChecklistItemCount = checklistItems.filter(item =>
                  item.company_id === company.id && !item.completed
                ).length;
                const totalPendingCount = pendingTaskCount + pendingChecklistItemCount;

                return (
                  <div key={company.id} className="flex justify-between items-center p-2 bg-white rounded border">
                    <span className="font-medium">{company.name}</span>
                    <Badge variant="destructive">
                      {totalPendingCount} tarefa{totalPendingCount !== 1 ? 's' : ''} pendente{totalPendingCount !== 1 ? 's' : ''}
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
