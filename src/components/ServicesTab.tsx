import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parse, isValid, isSameMonth, getMonth, getYear } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useClients } from "@/hooks/useClients";
import { ClientManager } from "./ClientManager";
import { Link2, Search, Pencil, Trash2, PlusCircle, BarChart3, PieChart as PieChartIcon, ChevronRight, CreditCard, Calendar as CalendarIcon, User } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PortalButton } from "./stripe/PortalButton";

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
  const pendingRevenue = services.filter(s => s.payment_status === 'pending').reduce((sum, service) => sum + service.amount, 0);
  const paidRevenue = services.filter(s => s.payment_status === 'paid').reduce((sum, service) => sum + service.amount, 0);
  const canceledRevenue = services.filter(s => s.payment_status === 'canceled').reduce((sum, service) => sum + service.amount, 0);

  const revenueByMonth: { [month: string]: number } = {};
  services.forEach(service => {
    const month = format(new Date(service.start_date), 'MMMM');
    revenueByMonth[month] = (revenueByMonth[month] || 0) + service.amount;
  });

  const revenueByStatus: { [status: string]: number } = {
    pending: pendingRevenue,
    paid: paidRevenue,
    canceled: canceledRevenue,
  };

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

const calculateDailyRevenue = (services: Service[], date: Date): number => {
  const formattedDate = format(date, 'yyyy-MM-dd');
  return services.reduce((sum, service) => {
    const serviceDate = format(new Date(service.start_date), 'yyyy-MM-dd');
    return serviceDate === formattedDate ? sum + service.amount : sum;
  }, 0);
};

const renderDashboard = (services: Service[]) => {
  const stats = calculateStats(services);
  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd });

  const dailyRevenueData = daysInMonth.map(day => ({
    date: format(day, 'dd/MM'),
    revenue: calculateDailyRevenue(services, day),
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#9cafff'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-2">Receita Total</h3>
        <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-2">Serviços Prestados</h3>
        <p className="text-3xl font-bold">{stats.servicesProvided}</p>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-2">Receita Pendente</h3>
        <p className="text-3xl font-bold">{formatCurrency(stats.pendingRevenue)}</p>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-2">Receita por Status</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={[
                { name: 'Pendente', value: stats.pendingRevenue },
                { name: 'Pago', value: stats.paidRevenue },
                { name: 'Cancelado', value: stats.canceledRevenue },
              ]}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label
            >
              {[{ name: 'Pendente', value: stats.pendingRevenue },
                { name: 'Pago', value: stats.paidRevenue },
                { name: 'Cancelado', value: stats.canceledRevenue }].map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold mb-2">Receita Diária do Mês</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyRevenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={(value: number) => formatCurrency(value)} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Receita" />
          </LineChart>
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
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (error) {
        toast.error('Erro ao carregar serviços');
        throw error;
      }

      setServices(data as Service[]);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const fetchCompanyLogo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('company_logo')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao carregar logo da empresa:', error);
        return;
      }

      setCompanyLogo(data?.company_logo || null);
    } catch (error: any) {
      console.error('Erro ao carregar logo da empresa:', error);
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
      if (!user) throw new Error('User not authenticated');

      const serviceToAdd: NewService = {
        ...newService,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('services')
        .insert([serviceToAdd])
        .select()
        .single();

      if (error) {
        toast.error('Erro ao adicionar serviço');
        throw error;
      }

      setServices([...services, data as Service]);
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
      toast.success('Serviço adicionado com sucesso');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handlePaymentStatusChange = (value: string) => {
    if (value === 'pending' || value === 'paid' || value === 'canceled') {
      setNewService({ ...newService, payment_status: value });
    }
  };

  const handleEditingPaymentStatusChange = (value: string) => {
    if (!editingService) return;
    if (value === 'pending' || value === 'paid' || value === 'canceled') {
      setEditingService({ ...editingService, payment_status: value });
    }
  };

  const handleSharePortalLink = async (clientId: string) => {
    setSelectedClientId(clientId);
    setShowShareDialog(true);
  };

  const togglePaymentStatus = async (id: string, currentStatus: 'pending' | 'paid' | 'canceled') => {
    try {
      const newStatus = currentStatus === 'pending' ? 'paid' : 'pending';
      const { error } = await supabase
        .from('services')
        .update({ payment_status: newStatus })
        .eq('id', id);

      if (error) {
        toast.error('Erro ao atualizar status do pagamento');
        throw error;
      }

      setServices(services.map(service =>
        service.id === id ? { ...service, payment_status: newStatus } : service
      ));
      toast.success('Status do pagamento atualizado com sucesso');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceToDelete);

      if (error) {
        toast.error('Erro ao deletar serviço');
        throw error;
      }

      setServices(services.filter(service => service.id !== serviceToDelete));
      setServiceToDelete(null);
      setShowDeleteDialog(false);
      toast.success('Serviço removido com sucesso');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      const { error } = await supabase
        .from('services')
        .update(editingService)
        .eq('id', editingService.id);

      if (error) {
        toast.error('Erro ao atualizar serviço');
        throw error;
      }

      setServices(services.map(service =>
        service.id === editingService.id ? editingService : service
      ));
      setEditingService(null);
      toast.success('Serviço atualizado com sucesso');
    } catch (error: any) {
      toast.error(error.message);
    }
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
            <DialogContent className="max-w-3xl glass-card">
              <DialogHeader>
                <DialogTitle>Adicionar Novo Serviço</DialogTitle>
                <DialogDescription>Preencha o formulário abaixo para adicionar um novo serviço</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Cliente</Label>
                  <Input 
                    id="client_name" 
                    value={newService.client_name} 
                    onChange={e => setNewService({ ...newService, client_name: e.target.value })} 
                    className="glass-card"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input 
                    id="start_date" 
                    type="date" 
                    value={newService.start_date} 
                    onChange={e => setNewService({ ...newService, start_date: e.target.value })} 
                    className="glass-card"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nome da Empresa</Label>
                  <Input 
                    id="company_name" 
                    value={newService.company_name} 
                    onChange={e => setNewService({ ...newService, company_name: e.target.value })} 
                    className="glass-card"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="service_description">Descrição do Serviço</Label>
                  <Input 
                    id="service_description" 
                    value={newService.service_description} 
                    onChange={e => setNewService({ ...newService, service_description: e.target.value })} 
                    className="glass-card"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stage">Etapa</Label>
                  <Input 
                    id="stage" 
                    value={newService.stage} 
                    onChange={e => setNewService({ ...newService, stage: e.target.value })} 
                    className="glass-card"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input 
                    id="status" 
                    value={newService.status} 
                    onChange={e => setNewService({ ...newService, status: e.target.value })} 
                    className="glass-card"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    value={newService.amount} 
                    onChange={e => setNewService({ ...newService, amount: Number(e.target.value) })} 
                    className="glass-card"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Status do Pagamento</Label>
                  <Select value={newService.payment_status} onValueChange={handlePaymentStatusChange}>
                    <SelectTrigger className="glass-card">
                      <SelectValue placeholder="Status do pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="canceled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_id">Cliente</Label>
                  <Select value={newService.client_id} onValueChange={value => setNewService({ ...newService, client_id: value })}>
                    <SelectTrigger className="glass-card">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" type="button">Cancelar</Button>
                  </DialogClose>
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                  >
                    Adicionar Serviço
                  </Button>
                </div>
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
                <Label htmlFor="new_client_name">Cliente</Label>
                <Input 
                  id="new_client_name" 
                  value={newService.client_name} 
                  onChange={e => setNewService({ ...newService, client_name: e.target.value })} 
                  className="glass-card"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new_start_date">Data de Início</Label>
                <Input 
                  id="new_start_date" 
                  type="date" 
                  value={newService.start_date} 
                  onChange={e => setNewService({ ...newService, start_date: e.target.value })} 
                  className="glass-card"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new_company_name">Nome da Empresa</Label>
                <Input 
                  id="new_company_name" 
                  value={newService.company_name} 
                  onChange={e => setNewService({ ...newService, company_name: e.target.value })} 
                  className="glass-card"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new_service_description">Descrição do Serviço</Label>
                <Input 
                  id="new_service_description" 
                  value={newService.service_description} 
                  onChange={e => setNewService({ ...newService, service_description: e.target.value })} 
                  className="glass-card"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new_stage">Etapa</Label>
                <Input 
                  id="new_stage" 
                  value={newService.stage} 
                  onChange={e => setNewService({ ...newService, stage: e.target.value })} 
                  className="glass-card"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new_status">Status</Label>
                <Input 
                  id="new_status" 
                  value={newService.status} 
                  onChange={e => setNewService({ ...newService, status: e.target.value })} 
                  className="glass-card"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new_amount">Valor</Label>
                <Input 
                  id="new_amount" 
                  type="number" 
                  value={newService.amount} 
                  onChange={e => setNewService({ ...newService, amount: Number(e.target.value) })} 
                  className="glass-card"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Status do Pagamento</Label>
                <Select value={newService.payment_status} onValueChange={handlePaymentStatusChange}>
                  <SelectTrigger className="glass-card">
                    <SelectValue placeholder="Status do pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_client_id">Cliente</Label>
                <Select value={newService.client_id} onValueChange={value => setNewService({ ...newService, client_id: value })}>
                  <SelectTrigger className="glass-card">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
                <Button variant="outline" type="button">Cancelar</Button>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                >
                  Adicionar Serviço
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
                      <DialogDescription>Selecione um cliente para compartilhar os serviços</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      {Object.entries(groupedServices).map(([clientId, {
                        clientName,
                        services
                      }]) => (
                        <div key={clientId} className="glass-card p-4 transition-all duration-300 hover:translate-y-[-2px]">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium">{clientName}</h3>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-xs"
                                onClick={() => handleSharePortalLink(clientId)}
                              >
                                <Link2 className="h-3 w-3 mr-1" /> Compartilhar
                              </Button>
                              {clients.find(client => client.id === clientId)?.stripe_customer_id && (
                                <PortalButton 
                                  customerId={clients.find(client => client.id === clientId)?.stripe_customer_id} 
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                >
                                  <CreditCard className="h-3 w-3 mr-1" /> Portal
                                </PortalButton>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">{services.length} serviços</p>
                        </div>
                      ))}
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Fechar</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
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
                  <Button
                    variant={showCurrentMonth ? "default" : "outline"}
                    className={`gap-2 ${showCurrentMonth ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-800"}`}
                    onClick={() => {
                      setShowCurrentMonth(!showCurrentMonth);
                      if (!showCurrentMonth) {
                        setFilterDate(undefined);
                        setCalendarOpen(false);
                      }
                    }}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {currentMonth}
                  </Button>
                  
                  {!showCurrentMonth && (
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="justify-start text-left font-normal glass-card"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filterDate ? (
                            format(filterDate, "MMMM yyyy")
                          ) : (
                            <span>Selecione o mês</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 glass-card" align="start">
                        <Calendar
                          mode="single"
                          selected={filterDate}
                          onSelect={(date) => {
                            setFilterDate(date);
                            setCalendarOpen(false);
                          }}
                          initialFocus
                          className="bg-white dark:bg-gray-800"
                        />
                        <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                          <Button 
                            variant="ghost" 
                            onClick={() => {
                              setFilterDate(undefined);
                              setCalendarOpen(false);
                            }}
                            className="text-xs h-8"
                          >
                            Limpar filtro
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="glass-card w-[180px]">
                    <SelectValue placeholder="Status de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="paid">Pagos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-800">
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                        Nenhum serviço encontrado para os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredServices.map(service => (
                      <TableRow key={service.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <TableCell className="font-medium">{service.client_name}</TableCell>
                        <TableCell>{service.company_name}</TableCell>
                        <TableCell>{service.service_description}</TableCell>
                        <TableCell>{format(new Date(service.start_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {service.status}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(service.amount)}</TableCell>
                        <TableCell>
                          <button 
                            onClick={() => togglePaymentStatus(service.id, service.payment_status)}
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              service.payment_status === 'paid' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                                : service.payment_status === 'canceled'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                            }`}
                          >
                            {service.payment_status === 'paid' ? 'Pago' : service.payment_status === 'canceled' ? 'Cancelado' : 'Pendente'}
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleEdit(service)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                setServiceToDelete(service.id);
                                setShowDeleteDialog(true);
                              }}
                              className="h-8 w-8 p-0 text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Excluir</span>
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
      
      {/* Edit Service Dialog */}
      <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
        <DialogContent className="max-w-3xl glass-card">
          <DialogHeader>
            <DialogTitle>Editar Serviço</DialogTitle>
          </DialogHeader>
          {editingService && (
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_client_name">Cliente</Label>
                <Input 
                  id="edit_client_name" 
                  value={editingService.client_name} 
                  onChange={e => setEditingService({ ...editingService, client_name: e.target.value })} 
                  className="glass-card"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_start_date">Data de Início</Label>
                <Input 
                  id="edit_start_date" 
                  type="date" 
                  value={editingService.start_date.substring(0, 10)} 
                  onChange={e => setEditingService({ ...editingService, start_date: e.target.value })} 
                  className="glass-card"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_company_name">Nome da Empresa</Label>
                <Input 
                  id="edit_company_name" 
                  value={editingService.company_name} 
                  onChange={e => setEditingService({ ...editingService, company_name: e.target.value })} 
                  className="glass-card"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_service_description">Descrição do Servi��o</Label>
                <Input 
                  id="edit_service_description" 
                  value={editingService.service_description} 
                  onChange={e => setEditingService({ ...editingService, service_description: e.target.value })} 
                  className="glass-card"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_stage">Etapa</Label>
                <Input 
                  id="edit_stage" 
                  value={editingService.stage} 
                  onChange={e => setEditingService({ ...editingService, stage: e.target.value })} 
                  className="glass-card"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_status">Status</Label>
                <Input 
                  id="edit_status" 
                  value={editingService.status} 
                  onChange={e => setEditingService({ ...editingService, status: e.target.value })} 
                  className="glass-card"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_amount">Valor</Label>
                <Input 
                  id="edit_amount" 
                  type="number" 
                  value={editingService.amount} 
                  onChange={e => setEditingService({ ...editingService, amount: Number(e.target.value) })} 
                  className="glass-card"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Status do Pagamento</Label>
                <Select 
                  value={editingService.payment_status} 
                  onValueChange={handleEditingPaymentStatusChange}
                >
                  <SelectTrigger className="glass-card">
                    <SelectValue placeholder="Status do pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline" type="button">Cancelar</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                >
                  Atualizar Serviço
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Compartilhar com cliente</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Compartilhar os serviços com este cliente?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowShareDialog(false)}>
              Compartilhar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
