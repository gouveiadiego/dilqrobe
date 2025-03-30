import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parse, isValid, isSameMonth, getMonth, getYear } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useClients } from "@/hooks/useClients";
import { ClientManager } from "./ClientManager";
import { Link2, Search, Pencil, Trash2, PlusCircle, BarChart3, PieChart as PieChartIcon, ChevronRight, CreditCard, Calendar as CalendarIcon, User, Check, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Service {
  id: string;
  start_date: string;
  client_name: string;
  company_name: string;
  service_description: string;
  stage: string;
  status: string;
  amount: number;
  payment_status: 'pending' | 'paid' | 'canceled';
  user_id: string;
  reference_month: string;
  client_id: string;
}

interface NewService {
  start_date: string;
  client_name: string;
  company_name: string;
  service_description: string;
  stage: string;
  status: string;
  amount: number;
  payment_status: 'pending' | 'paid' | 'canceled';
  user_id: string;
  reference_month: string;
  client_id: string;
}

interface ServiceStats {
  totalRevenue: number;
  servicesProvided: number;
  pendingRevenue: number;
  paidRevenue: number;
  canceledRevenue: number;
  revenueByMonth: { [month: string]: number };
  revenueByStatus: { [status: string]: number };
}

const calculateStats = (services: Service[]): ServiceStats => {
  const totalRevenue = services.reduce((sum, service) => sum + service.amount, 0);
  const servicesProvided = services.length;
  const pendingRevenue = services.filter(service => service.payment_status === 'pending').reduce((sum, service) => sum + service.amount, 0);
  const paidRevenue = services.filter(service => service.payment_status === 'paid').reduce((sum, service) => sum + service.amount, 0);
  const canceledRevenue = services.filter(service => service.payment_status === 'canceled').reduce((sum, service) => sum + service.amount, 0);

  const revenueByMonth: { [month: string]: number } = services.reduce((acc: { [month: string]: number }, service) => {
    const month = format(new Date(service.start_date), 'MMMM yyyy');
    acc[month] = (acc[month] || 0) + service.amount;
    return acc;
  }, {});

  const revenueByStatus: { [status: string]: number } = services.reduce((acc: { [status: string]: number }, service) => {
    acc[service.payment_status] = (acc[service.payment_status] || 0) + service.amount;
    return acc;
  }, {});

  return {
    totalRevenue,
    servicesProvided,
    pendingRevenue,
    paidRevenue,
    canceledRevenue,
    revenueByMonth,
    revenueByStatus,
  };
};

const calculateDailyRevenue = (services: Service[]) => {
  const dailyRevenue: { [date: string]: number } = {};
  services.forEach(service => {
    const date = format(new Date(service.start_date), 'yyyy-MM-dd');
    dailyRevenue[date] = (dailyRevenue[date] || 0) + service.amount;
  });

  const chartData = Object.entries(dailyRevenue).map(([date, revenue]) => ({
    date,
    revenue,
  }));

  return chartData;
};

const renderDashboard = (services: Service[]) => {
  const stats = calculateStats(services);
  const dailyRevenue = calculateDailyRevenue(services);

  const pieChartData = Object.entries(stats.revenueByStatus).map(([status, revenue]) => ({
    name: status,
    value: revenue,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="glass-card p-4">
        <h3 className="font-semibold text-lg">Receita Total</h3>
        <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
      </div>
      <div className="glass-card p-4">
        <h3 className="font-semibold text-lg">Serviços Prestados</h3>
        <p className="text-2xl font-bold">{stats.servicesProvided}</p>
      </div>
      <div className="glass-card p-4">
        <h3 className="font-semibold text-lg">Receita Pendente</h3>
        <p className="text-2xl font-bold">{formatCurrency(stats.pendingRevenue)}</p>
      </div>

      <div className="glass-card p-4 col-span-2">
        <h3 className="font-semibold text-lg">Receita por Mês</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-4">
        <h3 className="font-semibold text-lg">Receita por Status</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export function ServicesTab() {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareableUrl, setShareableUrl] = useState("");
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
  const [filterDate, setFilterDate] = useState<Date | undefined>(new Date());
  const [filterStatus, setFilterStatus] = useState("");
  const [filterText, setFilterText] = useState("");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [showStatsCard, setShowStatsCard] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showCurrentMonth, setShowCurrentMonth] = useState(false);

  const fetchServices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching services:', error);
        toast.error('Erro ao carregar serviços');
        return;
      }

      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Erro ao carregar serviços');
    }
  };

  const fetchCompanyLogo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('companies')
        .select('logo_url')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching company logo:', error);
        return;
      }

      setCompanyLogo(data?.logo_url || null);
    } catch (error) {
      console.error('Error fetching company logo:', error);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchCompanyLogo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('services')
        .insert({
          ...newService,
          user_id: user.id,
        });

      if (error) {
        console.error('Error adding service:', error);
        toast.error('Erro ao adicionar serviço');
        return;
      }

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
      fetchServices();
      toast.success('Serviço adicionado com sucesso!');
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Erro ao adicionar serviço');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      const { error } = await supabase
        .from('services')
        .update({
          start_date: editingService.start_date,
          client_name: editingService.client_name,
          company_name: editingService.company_name,
          service_description: editingService.service_description,
          stage: editingService.stage,
          status: editingService.status,
          amount: editingService.amount,
          payment_status: editingService.payment_status,
          reference_month: editingService.reference_month,
          client_id: editingService.client_id
        })
        .eq('id', editingService.id);

      if (error) {
        console.error('Error updating service:', error);
        toast.error('Erro ao atualizar serviço');
        return;
      }

      setEditingService(null);
      fetchServices();
      toast.success('Serviço atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Erro ao atualizar serviço');
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceToDelete);

      if (error) {
        console.error('Error deleting service:', error);
        toast.error('Erro ao excluir serviço');
        return;
      }

      setServiceToDelete(null);
      setShowDeleteDialog(false);
      fetchServices();
      toast.success('Serviço excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Erro ao excluir serviço');
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
  };

  const handlePaymentStatusChange = async (id: string, currentStatus: 'pending' | 'paid' | 'canceled') => {
    const newStatus =
      currentStatus === 'pending' ? 'paid' :
        currentStatus === 'paid' ? 'canceled' :
          'pending';

    try {
      const { error } = await supabase
        .from('services')
        .update({ payment_status: newStatus })
        .eq('id', id);

      if (error) {
        console.error('Error updating payment status:', error);
        toast.error('Erro ao atualizar status de pagamento');
        return;
      }

      fetchServices();
      toast.success('Status de pagamento atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Erro ao atualizar status de pagamento');
    }
  };

  const handleSharePortalLink = (clientId: string) => {
    const baseUrl = window.location.origin;
    const portalUrl = `${baseUrl}/client-portal?client=${clientId}`;
    setShareableUrl(portalUrl);
    setSelectedClientId(clientId);
    setShowShareDialog(true);
  };

  const filteredServices = services.filter(service => {
    const searchText = filterText.toLowerCase();
    const matchesFilter = !filterText || 
      service.client_name.toLowerCase().includes(searchText) || 
      service.company_name.toLowerCase().includes(searchText) || 
      service.service_description.toLowerCase().includes(searchText) || 
      service.stage.toLowerCase().includes(searchText) || 
      service.status.toLowerCase().includes(searchText);
    
    const matchesClient = !filterClient || 
      service.client_name.toLowerCase().includes(filterClient.toLowerCase());
    
    const matchesSelectedMonth = !filterDate || 
      (isValid(filterDate) && isSameMonth(new Date(service.start_date), filterDate));
    
    const today = new Date();
    const isCurrentMonth = getMonth(new Date(service.start_date)) === getMonth(today) && 
                          getYear(new Date(service.start_date)) === getYear(today);
    const matchesCurrentMonth = !showCurrentMonth || isCurrentMonth;
    
    const matchesStatus = !filterStatus || 
      (filterStatus === 'paid' && service.payment_status === 'paid') || 
      (filterStatus === 'pending' && service.payment_status === 'pending');
    
    return matchesFilter && matchesClient && 
           ((showCurrentMonth && matchesCurrentMonth) || (!showCurrentMonth && matchesSelectedMonth)) && 
           matchesStatus;
  });

  const groupedServices = filteredServices.reduce((acc: { [key: string]: { clientName: string; services: Service[] } }, service) => {
    if (!acc[service.client_id]) {
      acc[service.client_id] = {
        clientName: service.client_name,
        services: [],
      };
    }
    acc[service.client_id].services.push(service);
    return acc;
  }, {});

  const currentMonth = format(new Date(), 'MMMM yyyy');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Serviços</h1>
        <div className="flex items-center gap-2">
          {companyLogo && (
            <img src={companyLogo} alt="Logo da Empresa" className="h-8 w-auto rounded-full" />
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700">
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-3xl p-6">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Serviço</DialogTitle>
                <DialogDescription>Preencha o formulário abaixo para adicionar um novo serviço</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input
                    type="date"
                    id="start_date"
                    value={newService.start_date}
                    onChange={(e) => setNewService({ ...newService, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_name">Nome do Cliente</Label>
                  <Input
                    type="text"
                    id="client_name"
                    value={newService.client_name}
                    onChange={(e) => setNewService({ ...newService, client_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nome da Empresa</Label>
                  <Input
                    type="text"
                    id="company_name"
                    value={newService.company_name}
                    onChange={(e) => setNewService({ ...newService, company_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_description">Descrição do Serviço</Label>
                  <Input
                    type="text"
                    id="service_description"
                    value={newService.service_description}
                    onChange={(e) => setNewService({ ...newService, service_description: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">Etapa</Label>
                  <Input
                    type="text"
                    id="stage"
                    value={newService.stage}
                    onChange={(e) => setNewService({ ...newService, stage: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Situação</Label>
                  <Input
                    type="text"
                    id="status"
                    value={newService.status}
                    onChange={(e) => setNewService({ ...newService, status: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor</Label>
                  <Input
                    type="number"
                    id="amount"
                    value={newService.amount}
                    onChange={(e) => setNewService({ ...newService, amount: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_status">Status do Pagamento</Label>
                  <Select value={newService.payment_status} onValueChange={(value) => setNewService({ ...newService, payment_status: value as "pending" | "paid" | "canceled" })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="canceled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference_month">Mês de Referência</Label>
                  <Input
                    type="date"
                    id="reference_month"
                    value={newService.reference_month}
                    onChange={(e) => setNewService({ ...newService, reference_month: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_id">ID do Cliente</Label>
                  <Input
                    type="text"
                    id="client_id"
                    value={newService.client_id}
                    onChange={(e) => setNewService({ ...newService, client_id: e.target.value })}
                    required
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit">Adicionar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex justify-center">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="new">Novo Serviço</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-0">
          {renderDashboard(services)}
        </TabsContent>
        
        <TabsContent value="new" className="mt-0">
          <div className="glass-card p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <PlusCircle className="h-6 w-6 text-indigo-600" />
              Adicionar Novo Serviço
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data de Início</Label>
                <Input
                  type="date"
                  id="start_date"
                  value={newService.start_date}
                  onChange={(e) => setNewService({ ...newService, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_name">Nome do Cliente</Label>
                <Input
                  type="text"
                  id="client_name"
                  value={newService.client_name}
                  onChange={(e) => setNewService({ ...newService, client_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_name">Nome da Empresa</Label>
                <Input
                  type="text"
                  id="company_name"
                  value={newService.company_name}
                  onChange={(e) => setNewService({ ...newService, company_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="service_description">Descrição do Serviço</Label>
                <Input
                  type="text"
                  id="service_description"
                  value={newService.service_description}
                  onChange={(e) => setNewService({ ...newService, service_description: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stage">Etapa</Label>
                <Input
                  type="text"
                  id="stage"
                  value={newService.stage}
                  onChange={(e) => setNewService({ ...newService, stage: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Situação</Label>
                <Input
                  type="text"
                  id="status"
                  value={newService.status}
                  onChange={(e) => setNewService({ ...newService, status: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  type="number"
                  id="amount"
                  value={newService.amount}
                  onChange={(e) => setNewService({ ...newService, amount: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_status">Status do Pagamento</Label>
                <Select value={newService.payment_status} onValueChange={(value) => setNewService({ ...newService, payment_status: value as "pending" | "paid" | "canceled" })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference_month">Mês de Referência</Label>
                <Input
                  type="date"
                  id="reference_month"
                  value={newService.reference_month}
                  onChange={(e) => setNewService({ ...newService, reference_month: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_id">ID do Cliente</Label>
                <Input
                  type="text"
                  id="client_id"
                  value={newService.client_id}
                  onChange={(e) => setNewService({ ...newService, client_id: e.target.value })}
                  required
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit">Adicionar</Button>
              </DialogFooter>
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
                <Button 
                  variant="outline" 
                  className="bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700"
                  onClick={() => setShowStatsCard(!showStatsCard)}
                >
                  {showStatsCard ? "Ocultar estatísticas" : "Mostrar estatísticas"}
                </Button>
              </div>
            </div>
            
            {showStatsCard && (
              <div className="mb-6">
                {renderDashboard(filteredServices)}
              </div>
            )}
            
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-2 flex-grow">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input 
                    placeholder="Pesquisar serviços..." 
                    className="pl-9 glass-card" 
                    value={filterText} 
                    onChange={e => setFilterText(e.target.value)} 
                  />
                </div>
                
                <div className="flex gap-2">
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={showCurrentMonth ? "default" : "outline"}
                        className={`gap-2 ${showCurrentMonth ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-800"}`}
                      >
                        <CalendarIcon className="h-4 w-4" />
                        {showCurrentMonth ? currentMonth : (filterDate ? format(filterDate, "MMMM yyyy") : "Selecione o mês")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 glass-card" align="start">
                      <Calendar
                        mode="single"
                        selected={filterDate}
                        onSelect={(date) => {
                          if (date) {
                            setFilterDate(date);
                            setShowCurrentMonth(false);
                          } else {
                            setShowCurrentMonth(true);
                          }
                          setCalendarOpen(false);
                        }}
                        initialFocus
                        className="bg-white dark:bg-gray-800 pointer-events-auto"
                      />
                      <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            setShowCurrentMonth(true);
                            setFilterDate(undefined);
                            setCalendarOpen(false);
                          }}
                          className="text-xs h-8"
                        >
                          Mês atual
                        </Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            setFilterDate(undefined);
                            setShowCurrentMonth(false);
                            setCalendarOpen(false);
                          }}
                          className="text-xs h-8"
                        >
                          Limpar filtro
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="glass-card w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="paid">Pagos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Client grouped services */}
            <div className="space-y-6">
              {Object.entries(groupedServices).map(([clientId, { clientName, services }]) => (
                <div key={clientId} className="border border-gray-200 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
                  <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="font-medium">{clientName}</h3>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-500 hover:text-indigo-600"
                      onClick={() => handleSharePortalLink(clientId)}
                    >
                      <Link2 className="h-4 w-4 mr-1" />
                      Compartilhar
                    </Button>
                  </div>
                  
                  <Table
