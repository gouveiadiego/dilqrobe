import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowDownUp,
  Trophy,
  Rocket,
  Edit
} from "lucide-react";
import confetti from "canvas-confetti";
import { ProjectCompany } from "@/hooks/useProjectCompanies";

type ProjectTask = {
  id: string;
  title: string;
  completed: boolean;
  project_company_id: string;
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

  // Edit State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<ProjectCompany & { project_type?: 'fixed_monthly' | 'parallel' | null | string }>({
    id: "",
    name: "",
    description: "",
    contact_person: "",
    contact_email: "",
    contact_phone: "",
    created_at: "",
    updated_at: "",
    is_active: true,
    user_id: "",
    project_type: "fixed_monthly"
  });

  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['project-companies-dashboard'],
    queryFn: async () => {
      console.log('🏢 Fetching companies for dashboard...');
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.log('⚠️ No session found, returning empty array');
        return [];
      }

      const { data, error } = await supabase
        .from('project_companies')
        .select('*')
        .eq('user_id', sessionData.session.user.id)
        .order('name');

      if (error) {
        console.error('❌ Error fetching companies:', error);
        return [];
      }
      console.log('✅ Companies for dashboard loaded:', data?.length);
      return data as ProjectCompany[];
    }
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ['project-tasks-dashboard'],
    queryFn: async () => {
      console.log('📋 Fetching tasks for dashboard...');
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.log('⚠️ No session found, returning empty array');
        return [];
      }

      // Buscar apenas tarefas de empresas do usuário logado
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          completed,
          project_company_id,
          project_companies!inner(user_id)
        `)
        .eq('project_companies.user_id', sessionData.session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching tasks for dashboard:', error);
        return [];
      }
      console.log('✅ Tasks for dashboard loaded:', data?.length);
      return data as ProjectTask[];
    }
  });

  const { data: checklistItems = [], isLoading: isLoadingChecklist } = useQuery({
    queryKey: ['project-checklist-dashboard'],
    queryFn: async () => {
      console.log('📋 Fetching checklist items for dashboard...');
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.log('⚠️ No session found, returning empty array');
        return [];
      }

      const { data, error } = await supabase
        .from('project_checklist')
        .select('id, company_id, title, completed, user_id')
        .eq('user_id', sessionData.session.user.id);

      if (error) {
        console.error('❌ Error fetching checklist items:', error);
        return [];
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

  const updateCompanyMutation = useMutation({
    mutationFn: async (company: ProjectCompany & { project_type?: 'fixed_monthly' | 'parallel' | null | string }) => {
      const { id, ...updateData } = company;
      const { data, error } = await supabase
        .from('project_companies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        toast.error('Erro ao atualizar empresa');
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['project-companies-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['project-companies'] });
      toast.success('Empresa atualizada com sucesso');
    }
  });

  const activeCompanies = companies.filter(c => c.is_active !== false);
  const inactiveCompanies = companies.filter(c => c.is_active === false);

  const companiesById = new Map(companies.map(c => [c.id, c]));

  // Itens por empresa ativa
  const activeTasks = tasks.filter(task => {
    const company = companiesById.get(task.project_company_id);
    return company?.is_active !== false;
  });

  const activeChecklistItems = checklistItems.filter(item => {
    const company = companiesById.get(item.company_id);
    return company?.is_active !== false;
  });

  const pendingItemsCount = activeTasks.filter(task =>
    !task.completed
  ).length + activeChecklistItems.filter(item => !item.completed).length;

  const completedItemsCount = activeTasks.filter(task =>
    task.completed
  ).length + activeChecklistItems.filter(item => item.completed).length;

  const totalItemsCount = pendingItemsCount + completedItemsCount;
  const completionPercentage = totalItemsCount > 0 ? Math.round((completedItemsCount / totalItemsCount) * 100) : 0;

  // Empresas que precisam finalizar itens
  const companiesWithPendingItems = companies.filter(company => {
    if (company.is_active === false) return false;
    const hasPendingTask = tasks.some(task =>
      task.project_company_id === company.id && !task.completed
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
        task.project_company_id === company.id && !task.completed
      ).length;
      const completedCompanyTasks = tasks.filter(task =>
        task.project_company_id === company.id && task.completed
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

  const fixedClients = displayedCompanies.filter(c => !c.project_type || c.project_type === 'fixed_monthly');
  const parallelProjects = displayedCompanies.filter(c => c.project_type === 'parallel');

  const handleToggleCompanyStatus = (company: ProjectCompany) => {
    const newStatus = !company.is_active;
    toggleCompanyStatusMutation.mutate({
      id: company.id,
      is_active: newStatus
    });
  };

  const handleEditCompany = (company: ProjectCompany) => {
    setEditingCompany({
      ...company,
      project_type: company.project_type || "fixed_monthly"
    });
    setIsEditDialogOpen(true);
  };

  const submitEditCompany = async () => {
    if (!editingCompany.name.trim()) {
      toast.error('O nome da empresa é obrigatório');
      return;
    }
    updateCompanyMutation.mutate(editingCompany);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditingCompany(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditProjectTypeChange = (value: string) => {
    setEditingCompany(prev => ({
      ...prev,
      project_type: value as 'fixed_monthly' | 'parallel'
    }));
  };

  if (isLoadingCompanies || isLoadingTasks || isLoadingChecklist) {
    return <div className="text-center p-4">Carregando dashboard...</div>;
  }

  const handleCelebrate = (e: React.MouseEvent) => {
    e.preventDefault();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#9b87f5', '#33C3F0', '#10B981']
    });
  };

  const renderCompanyCard = (company: any) => {
    const isPremium = !company.project_type || company.project_type === 'fixed_monthly';
    const hasManyPending = company.totalPendingForCompany > 5;

    const premiumStyles = "bg-gradient-to-br from-white to-purple-50/50 border-purple-200 shadow-md";
    const standardStyles = "bg-white border-gray-200 shadow-sm";
    const errorStyles = hasManyPending ? "border-red-200 ring-2 ring-red-100" : "";

    // Top border accent for premium
    const premiumAccent = isPremium ? "before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-[#9b87f5] before:to-[#33C3F0]" : "";

    const companyCardClass = `p-4 border rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden ${isPremium ? premiumStyles : standardStyles} ${premiumAccent} ${errorStyles}`;

    return (
      <div key={company.id} className={companyCardClass}>
        <div className="flex-grow">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className={`font-medium text-lg ${isPremium ? 'text-gray-900' : 'text-gray-800'}`}>
                {company.name}
              </h4>
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
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  handleEditCompany(company);
                }}
                className="text-gray-400 hover:text-blue-600 h-8 w-8"
                title="Editar projeto"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  handleToggleCompanyStatus(company);
                }}
                className="text-gray-400 hover:text-gray-600 h-8 w-8"
                title={company.is_active !== false ? "Desativar" : "Ativar"}
              >
                {company.is_active !== false ? (
                  <ToggleRight className="h-5 w-5 text-green-600" />
                ) : (
                  <ToggleLeft className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          <div className="mb-3 mt-4">
            <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
              <span>Progresso Realizado</span>
              <span className={`font-bold ${isPremium ? 'text-purple-600' : ''}`}>{company.progressPercentage}%</span>
            </div>
            <Progress
              value={company.progressPercentage}
              className="h-2.5"
              indicatorClassName={
                company.progressPercentage < 30 ? 'bg-red-500' :
                  company.progressPercentage < 70 ? 'bg-yellow-500' :
                    company.progressPercentage === 100 && isPremium ? 'bg-gradient-to-r from-[#9b87f5] to-[#33C3F0]' : 'bg-green-500'
              }
            />
          </div>

          <div className="text-sm text-gray-600 space-y-2 mt-4 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-green-500" /> Concluídas:</span>
              <span className="font-semibold text-green-600">{company.totalCompletedForCompany}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5 text-orange-500" /> Pendentes:</span>
              <span className="font-semibold text-orange-600">{company.totalPendingForCompany}</span>
            </div>
          </div>

          {isPremium && company.progressPercentage === 100 && company.totalCompletedForCompany > 0 && (
            <div className="mt-3">
              <Button onClick={handleCelebrate} variant="outline" size="sm" className="w-full bg-gradient-to-r from-green-50 to-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                🎉 Tudo Concluído! Comemorar
              </Button>
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100">
          <Link to={`/company/${company.id}`} className="w-full h-full block">
            <Button variant={isPremium ? "default" : "outline"} className={`w-full ${isPremium ? 'bg-[#9b87f5] hover:bg-[#8B75E5] text-white shadow-sm' : ''}`}>
              Acessar Painel
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  };

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
            <div className="space-y-8">
              {/* Clientes Fixos */}
              {fixedClients.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-[#9b87f5] to-[#33C3F0] px-1">
                    <Trophy className="h-6 w-6 text-[#9b87f5]" />
                    Clientes Mensais Premium
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {fixedClients.map(renderCompanyCard)}
                  </div>
                </div>
              )}

              {/* Projetos Paralelos */}
              {parallelProjects.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-xl font-bold flex items-center gap-2 text-gray-700 px-1">
                    <Target className="h-6 w-6 text-gray-500" />
                    Projetos Paralelos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {parallelProjects.map(renderCompanyCard)}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Company Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empresa / Projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="edit_name" className="block text-sm font-medium mb-1">Nome da Empresa*</label>
              <Input
                id="edit_name"
                name="name"
                value={editingCompany.name}
                onChange={handleEditInputChange}
                placeholder="Nome da empresa"
              />
            </div>
            <div>
              <label htmlFor="edit_description" className="block text-sm font-medium mb-1">Descrição</label>
              <Textarea
                id="edit_description"
                name="description"
                value={editingCompany.description || ""}
                onChange={handleEditInputChange}
                placeholder="Descrição da empresa ou projeto"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Projeto</label>
              <Select
                value={editingCompany.project_type || "fixed_monthly"}
                onValueChange={handleEditProjectTypeChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed_monthly">Cliente Mensal Premium</SelectItem>
                  <SelectItem value="parallel">Projeto Paralelo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={submitEditCompany}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  task.project_company_id === company.id && !task.completed
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
