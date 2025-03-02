import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useClients } from "@/hooks/useClients";
import { ClientManager } from "./ClientManager";
import { Link2, Search, Pencil, Trash2, PlusCircle, BarChart3, PieChart as PieChartIcon, ChevronRight, CreditCard, Calendar, User } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Service {
  id: string;
  start_date: string;
  client_name: string;
  company_name: string;
  service_description: string;
  stage: string;
  status: string;
  amount: number;
  payment_status: string;
  reference_month: string;
  client_id: string;
  user_id: string;
}

interface NewService {
  start_date: string;
  client_name: string;
  company_name: string;
  service_description: string;
  stage: string;
  status: string;
  amount: number;
  payment_status: string;
  reference_month: string;
  client_id: string;
  user_id: string;
}

interface ServiceStats {
  totalServices: number;
  totalRevenue: number;
  averageRevenue: number;
  servicesByStatus: {
    paid: number;
    pending: number;
    canceled: number;
  };
}

const calculateStats = (services: Service[]): ServiceStats => {
  const totalServices = services.length;
  const totalRevenue = services.reduce((sum, service) => sum + service.amount, 0);
  const averageRevenue = totalServices > 0 ? totalRevenue / totalServices : 0;
  const servicesByStatus = services.reduce(
    (acc, service) => {
      if (service.payment_status === "paid") {
        acc.paid++;
      } else if (service.payment_status === "pending") {
        acc.pending++;
      } else {
        acc.canceled++;
      }
      return acc;
    },
    { paid: 0, pending: 0, canceled: 0 }
  );

  return {
    totalServices,
    totalRevenue,
    averageRevenue,
    servicesByStatus,
  };
};

const calculateDailyRevenue = (services: Service[]) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const dailyServices = services.filter((service) => service.start_date === today);
  const dailyRevenue = dailyServices.reduce((sum, service) => sum + service.amount, 0);
  return dailyRevenue;
};

const renderDashboard = (services: Service[]) => {
  const stats = calculateStats(services);
  const dailyRevenue = calculateDailyRevenue(services);

  const pieChartData = [
    { name: "Paid", value: stats.servicesByStatus.paid },
    { name: "Pending", value: stats.servicesByStatus.pending },
    { name: "Canceled", value: stats.servicesByStatus.canceled },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  const dailyRevenueData = eachDayOfInterval({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  }).map((date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    const revenue = services
      .filter((service) => service.start_date === formattedDate)
      .reduce((sum, service) => sum + service.amount, 0);
    return {
      date: format(date, "dd/MM"),
      revenue,
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="stat-card">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
          Receita Total
        </h3>
        <p className="stat-value">
          {formatCurrency(stats.totalRevenue)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {stats.totalServices} serviços
        </p>
      </div>

      <div className="stat-card">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
          Receita Média por Serviço
        </h3>
        <p className="stat-value">
          {formatCurrency(stats.averageRevenue)}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Baseado em todos os serviços
        </p>
      </div>

      <div className="stat-card">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
          Receita Diária
        </h3>
        <p className="stat-value">{formatCurrency(dailyRevenue)}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Receita de hoje
        </p>
      </div>

      <div className="lg:col-span-2 chart-container">
        <h3 className="text-lg font-medium mb-4 p-4">Receita Mensal</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyRevenueData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h3 className="text-lg font-medium mb-4 p-4">Status de Pagamento</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {pieChartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export function ServicesTab() {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const { clients } = useClients();
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState<Omit<NewService, 'user_id'>>({
    start_date: format(new Date(), "yyyy-MM-dd"),
    client_name: "",
    company_name: "",
    service_description: "",
    stage: "",
    status: "",
    amount: 0,
    payment_status: "pending",
    reference_month: format(new Date(), "yyyy-MM-dd"),
    client_id: ""
  });
  const [filterClient, setFilterClient] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterText, setFilterText] = useState("");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [showStatsCard, setShowStatsCard] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        setServices(data);
      }
    } catch (error: any) {
      toast.error(`Erro ao buscar serviços: ${error.message}`);
    }
  };

  const fetchCompanyLogo = async (companyName: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('logo_url')
        .eq('name', companyName)
        .single();

      if (error) {
        throw error;
      }

      if (data && data.logo_url) {
        setCompanyLogo(data.logo_url);
      } else {
        setCompanyLogo(null);
      }
    } catch (error: any) {
      console.error("Erro ao buscar logo da empresa:", error);
      setCompanyLogo(null);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('services')
        .insert([{ ...newService, user_id: supabase.auth.user()?.id }]);

      if (error) {
        throw error;
      }

      fetchServices();
      toast.success("Serviço criado com sucesso!");
      setNewService({
        start_date: format(new Date(), "yyyy-MM-dd"),
        client_name: "",
        company_name: "",
        service_description: "",
        stage: "",
        status: "",
        amount: 0,
        payment_status: "pending",
        reference_month: format(new Date(), "yyyy-MM-dd"),
        client_id: ""
      });
    } catch (error: any) {
      toast.error(`Erro ao criar serviço: ${error.message}`);
    }
  };

  const handleSharePortalLink = async (clientId: string) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('share_id')
        .eq('id', clientId)
        .single();

      if (error) {
        throw error;
      }

      if (data && data.share_id) {
        const portalLink = `${window.location.origin}/client-portal?shareId=${data.share_id}`;
        navigator.clipboard.writeText(portalLink);
        toast.success("Link do portal copiado para a área de transferência!");
      } else {
        toast.error("Cliente não encontrado ou share_id não definido.");
      }
    } catch (error: any) {
      toast.error(`Erro ao obter link do portal: ${error.message}`);
    }
  };

  const togglePaymentStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
      const { data, error } = await supabase
        .from('services')
        .update({ payment_status: newStatus })
        .eq('id', id);

      if (error) {
        throw error;
      }

      fetchServices();
      toast.success(`Status de pagamento alterado para ${newStatus === 'paid' ? 'Pago' : 'Pendente'}!`);
    } catch (error: any) {
      toast.error(`Erro ao alterar status de pagamento: ${error.message}`);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
  };

  const handleDelete = async () => {
    try {
      if (!serviceToDelete) {
        toast.error("ID do serviço para deletar não definido.");
        return;
      }

      const { data, error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceToDelete);

      if (error) {
        throw error;
      }

      fetchServices();
      toast.success("Serviço deletado com sucesso!");
      setShowDeleteDialog(false);
    } catch (error: any) {
      toast.error(`Erro ao deletar serviço: ${error.message}`);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!editingService) {
        toast.error("Nenhum serviço selecionado para editar.");
        return;
      }

      const { data, error } = await supabase
        .from('services')
        .update(editingService)
        .eq('id', editingService.id);

      if (error) {
        throw error;
      }

      fetchServices();
      toast.success("Serviço atualizado com sucesso!");
      setEditingService(null);
    } catch (error: any) {
      toast.error(`Erro ao atualizar serviço: ${error.message}`);
    }
  };

  const filteredServices = services.filter(service => {
    const searchText = filterText.toLowerCase();
    const matchesFilter = !filterText || service.client_name.toLowerCase().includes(searchText) || service.company_name.toLowerCase().includes(searchText) || service.service_description.toLowerCase().includes(searchText) || service.stage.toLowerCase().includes(searchText) || service.status.toLowerCase().includes(searchText);
    const matchesClient = !filterClient || service.client_name.toLowerCase().includes(filterClient.toLowerCase());
    const matchesMonth = !filterMonth || format(new Date(service.start_date), "yyyy-MM") === filterMonth;
    const matchesStatus = !filterStatus || (filterStatus === 'paid' && service.payment_status === 'paid') || (filterStatus === 'pending' && service.payment_status === 'pending');
    return matchesFilter && matchesClient && matchesMonth && matchesStatus;
  });

  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.client_id]) {
      acc[service.client_id] = {
        clientName: service.client_name,
        services: []
      };
    }
    acc[service.client_id].services.push(service);
    return acc;
  }, {} as Record<string, {
    clientName: string;
    services: Service[];
  }>);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-950 rounded-lg p-6 shadow-sm border border-indigo-100 dark:border-indigo-950 mb-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gradient bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Gerenciamento de Serviços
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Gerencie seus serviços, acompanhe pagamentos e compartilhe com seus clientes
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 bg-white dark:bg-gray-800 p-1 rounded-full border border-gray-100 dark:border-gray-700 shadow-inner">
            <TabsTrigger value="overview" className="rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="new" className="rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              Novo Serviço
            </TabsTrigger>
            <TabsTrigger value="clients" className="rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              Clientes
            </TabsTrigger>
            <TabsTrigger value="services" className="rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
              Lista de Serviços
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-0">
            {renderDashboard(services)}
          </TabsContent>
          
          <TabsContent value="new" className="mt-0">
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <PlusCircle className="h-6 w-6 text-indigo-600" />
                Novo Serviço
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-sm font-medium">Data de Início</Label>
                  <Input
                    type="date"
                    id="start_date"
                    value={newService.start_date}
                    onChange={e => setNewService({
                      ...newService,
                      start_date: e.target.value
                    })}
                    className="glass-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_name" className="text-sm font-medium">Nome do Cliente</Label>
                  <Input
                    type="text"
                    id="client_name"
                    value={newService.client_name}
                    onChange={e => setNewService({
                      ...newService,
                      client_name: e.target.value
                    })}
                    className="glass-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-sm font-medium">Nome da Empresa</Label>
                  <Input
                    type="text"
                    id="company_name"
                    value={newService.company_name}
                    onChange={e => setNewService({
                      ...newService,
                      company_name: e.target.value
                    })}
                    className="glass-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_description" className="text-sm font-medium">Descrição do Serviço</Label>
                  <Input
                    type="text"
                    id="service_description"
                    value={newService.service_description}
                    onChange={e => setNewService({
                      ...newService,
                      service_description: e.target.value
                    })}
                    className="glass-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage" className="text-sm font-medium">Etapa</Label>
                  <Input
                    type="text"
                    id="stage"
                    value={newService.stage}
                    onChange={e => setNewService({
                      ...newService,
                      stage: e.target.value
                    })}
                    className="glass-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                  <Input
                    type="text"
                    id="status"
                    value={newService.status}
                    onChange={e => setNewService({
                      ...newService,
                      status: e.target.value
                    })}
                    className="glass-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">Valor</Label>
                  <Input
                    type="number"
                    id="amount"
                    value={newService.amount}
                    onChange={e => setNewService({
                      ...newService,
                      amount: Number(e.target.value)
                    })}
                    className="glass-card"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference_month" className="text-sm font-medium">Mês de Referência</Label>
                  <Input
                    type="date"
                    id="reference_month"
                    value={newService.reference_month}
                    onChange={e => setNewService({
                      ...newService,
                      reference_month: e.target.value
                    })}
                    className="glass-card"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status do Pagamento</Label>
                  <Select 
                    value={newService.payment_status} 
                    onValueChange={value => setNewService({
                      ...newService,
                      payment_status: value
                    })}
                  >
                    <SelectTrigger className="glass-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="canceled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all duration-300"
                  >
                    Criar Serviço
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>
          
          <TabsContent value="clients" className="mt-0">
            <ClientManager />
          </TabsContent>
          
          <TabsContent value="services" className="mt-0">
            <div className="glass-card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                  Serviços
                </h2>
                <div className="flex gap-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700">
                        <Link2 className="h-4 w-4 mr-2" />
                        Compartilhar por Cliente
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl glass-card">
                      <DialogHeader>
                        <DialogTitle>Compartilhar Serviços por Cliente</DialogTitle>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        {Object.entries(groupedServices).map(([clientId, {
                          clientName,
                          services
                        }]) => (
                          <div key={clientId} className="glass-card p-4 transition-all duration-300 hover:translate-y-[-2px]">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-medium">{clientName}</h3>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-xs"
                                onClick={() => handleSharePortalLink(clientId)}
                              >
                                <Link2 className="h-3 w-3 mr-1" />
                                Compartilhar
                              </Button>
                            </div>
                            <p className="text-sm text-gray-500">{services.length} serviços</p>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    placeholder="Buscar serviços..." 
                    value={filterText} 
                    onChange={e => setFilterText(e.target.value)} 
                    className="pl-9 glass-card" 
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px] glass-card">
                    <SelectValue placeholder="Status de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="paid">Pagos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="canceled">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-800">
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Nenhum serviço encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredServices.map(service => (
                        <TableRow key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                          <TableCell>{service.client_name}</TableCell>
                          <TableCell>{service.company_name}</TableCell>
                          <TableCell>{service.service_description}</TableCell>
                          <TableCell>{formatCurrency(service.amount)}</TableCell>
                          <TableCell>
                            <div 
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                service.payment_status === 'paid' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : service.payment_status === 'canceled'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}
                            >
                              {service.payment_status === 'paid' ? 'Pago' : service.payment_status === 'canceled' ? 'Cancelado' : 'Pendente'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0" 
                                onClick={() => handleEdit(service)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 hover:text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  setServiceToDelete(service.id);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 px-2 text-xs ${
                                  service.payment_status === 'paid'
                                    ? 'text-orange-600 hover:bg-orange-50 hover:text-orange-700'
                                    : 'text-green-600 hover:bg-green-50 hover:text-green-700'
                                }`}
                                onClick={() => togglePaymentStatus(service.id, service.payment_status)}
                              >
                                {service.payment_status === 'paid' ? 'Marcar como Pendente' : 'Marcar como Pago'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit Service Dialog */}
      {editingService && (
        <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Editar Serviço</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_client_name">Cliente</Label>
                  <Input 
                    id="edit_client_name" 
                    value={editingService.client_name} 
                    onChange={e => setEditingService({
                      ...editingService,
                      client_name: e.target.value
                    })} 
                    className="glass-card"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_company_name">Empresa</Label>
                  <Input 
                    id="edit_company_name" 
                    value={editingService.company_name} 
                    onChange={e => setEditingService({
                      ...editingService,
                      company_name: e.target.value
                    })} 
                    className="glass-card"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_service_description">Descrição</Label>
                  <Input 
                    id="edit_service_description" 
                    value={editingService.service_description} 
                    onChange={e => setEditingService({
                      ...editingService,
                      service_description: e.target.value
                    })} 
                    className="glass-card"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_amount">Valor</Label>
                  <Input 
                    id="edit_amount" 
                    type="number" 
                    value={editingService.amount} 
                    onChange={e => setEditingService({
                      ...editingService,
                      amount: Number(e.target.value)
                    })} 
                    className="glass-card"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_stage">Etapa</Label>
                  <Input 
                    id="edit_stage" 
                    value={editingService.stage} 
                    onChange={e => setEditingService({
                      ...editingService,
                      stage: e.target.value
                    })} 
                    className="glass-card"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_status">Status</Label>
                  <Input 
                    id="edit_status" 
                    value={editingService.status} 
                    onChange={e => setEditingService({
                      ...editingService,
                      status: e.target.value
                    })} 
                    className="glass-card"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Status do Pagamento</Label>
                  <Select 
                    value={editingService.payment_status} 
                    onValueChange={value => setEditingService({
                      ...editingService,
                      payment_status: value
                    })}
                  >
                    <SelectTrigger className="glass-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="canceled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingService(null)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-
