import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parse, isValid, isSameMonth, getMonth, getYear, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useClients } from "@/hooks/useClients";
import { ClientManager } from "./ClientManager";
import { Link2, Search, Pencil, Trash2, PlusCircle, BarChart3, PieChart as PieChartIcon, ChevronRight, CreditCard, Calendar as CalendarIcon, Check, Users, ChevronLeft, ChevronDown, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

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
  revenueByMonth: {
    [month: string]: number;
  };
  revenueByStatus: {
    [status: string]: number;
  };
}

const calculateStats = (services: Service[]): ServiceStats => {
  const totalRevenue = services.reduce((sum, service) => sum + service.amount, 0);
  const servicesProvided = services.length;
  const pendingRevenue = services.filter(s => s.payment_status === 'pending').reduce((sum, service) => sum + service.amount, 0);
  const paidRevenue = services.filter(s => s.payment_status === 'paid').reduce((sum, service) => sum + service.amount, 0);
  const canceledRevenue = services.filter(s => s.payment_status === 'canceled').reduce((sum, service) => sum + service.amount, 0);
  const revenueByMonth: {
    [month: string]: number;
  } = {};
  services.forEach(service => {
    const month = format(new Date(service.start_date), 'MMMM', { locale: ptBR });
    revenueByMonth[month] = (revenueByMonth[month] || 0) + service.amount;
  });
  const revenueByStatus: {
    [status: string]: number;
  } = {
    pending: pendingRevenue,
    paid: paidRevenue,
    canceled: canceledRevenue
  };
  return {
    totalRevenue,
    servicesProvided,
    pendingRevenue,
    paidRevenue,
    canceledRevenue,
    revenueByMonth,
    revenueByStatus
  };
};

const calculateDailyRevenue = (services: Service[], date: Date): number => {
  const formattedDate = format(date, 'yyyy-MM-dd');
  return services.reduce((sum, service) => {
    const serviceDate = format(new Date(service.start_date), 'yyyy-MM-dd');
    return serviceDate === formattedDate ? sum + service.amount : sum;
  }, 0);
};

const renderDashboard = (services: Service[], selectedMonth: Date | undefined) => {
  const stats = calculateStats(services);
  
  const today = selectedMonth || new Date();
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);
  
  const daysInMonth = eachDayOfInterval({
    start: currentMonthStart,
    end: currentMonthEnd
  });
  
  const dailyRevenueData = daysInMonth.map(day => ({
    date: format(day, 'dd/MM'),
    revenue: calculateDailyRevenue(services, day)
  }));
  
  const formattedMonth = format(today, "MMMM 'de' yyyy", { locale: ptBR })
    .replace(/^\w/, (c) => c.toUpperCase());
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#9cafff'];
  
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <Pie data={[{
            name: 'Pendente',
            value: stats.pendingRevenue
          }, {
            name: 'Pago',
            value: stats.paidRevenue
          }, {
            name: 'Cancelado',
            value: stats.canceledRevenue
          }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
              {[{
              name: 'Pendente',
              value: stats.pendingRevenue
            }, {
              name: 'Pago',
              value: stats.paidRevenue
            }, {
              name: 'Cancelado',
              value: stats.canceledRevenue
            }].map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-6 lg:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Receita Diária do Mês</h3>
          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            {formattedMonth}
          </span>
        </div>
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
    </div>;
};

export function ServicesTab() {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const {
    clients
  } = useClients();
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
  const [dashboardMonth, setDashboardMonth] = useState<Date | undefined>(new Date());
  const [dashboardCalendarOpen, setDashboardCalendarOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showCurrentMonth, setShowCurrentMonth] = useState(false);

  const fetchServices = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const {
        data,
        error
      } = await supabase.from('services').select('*').eq('user_id', user.id).order('start_date', {
        ascending: false
      });
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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const {
        data,
        error
      } = await supabase.from('profiles').select('company_logo').eq('id', user.id).single();
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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');
      const serviceToAdd: NewService = {
        ...newService,
        user_id: user.id
      };
      const {
        data,
        error
      } = await supabase.from('services').insert([serviceToAdd]).select().single();
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
      setNewService({
        ...newService,
        payment_status: value
      });
    }
  };

  const handleEditingPaymentStatusChange = (value: string) => {
    if (!editingService) return;
    if (value === 'pending' || value === 'paid' || value === 'canceled') {
      setEditingService({
        ...editingService,
        payment_status: value
      });
    }
  };

  const togglePaymentStatus = async (id: string, currentStatus: 'pending' | 'paid' | 'canceled') => {
    try {
      const newStatus = currentStatus === 'pending' ? 'paid' : 'pending';
      const {
        error
      } = await supabase.from('services').update({
        payment_status: newStatus
      }).eq('id', id);
      if (error) {
        toast.error('Erro ao atualizar status do pagamento');
        throw error;
      }
      setServices(services.map(service => service.id === id ? {
        ...service,
        payment_status: newStatus
      } : service));
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
      const {
        error
      } = await supabase.from('services').delete().eq('id', serviceToDelete);
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
      const {
        error
      } = await supabase.from('services').update(editingService).eq('id', editingService.id);
      if (error) {
        toast.error('Erro ao atualizar serviço');
        throw error;
      }
      setServices(services.map(service => service.id === editingService.id ? editingService : service));
      setEditingService(null);
      toast.success('Serviço atualizado com sucesso');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSharePortalLink = () => {
    if (selectedClientIds.length === 0) {
      toast.error("Selecione pelo menos um cliente para compartilhar");
      return;
    }
    setShowShareDialog(false);
    setShowLinkDialog(true);
  };

  const handleToggleClientSelection = (clientId: string) => {
    setSelectedClientIds(prevSelected => {
      if (prevSelected.includes(clientId)) {
        return prevSelected.filter(id => id !== clientId);
      } else {
        const client = clients.find(c => c.id === clientId);
        if (client) {
          setSelectedClient(client.name);
        }
        return [...prevSelected, clientId];
      }
    });
  };

  const handleSelectAllClients = () => {
    if (selectedClientIds.length === clients.length) {
      setSelectedClientIds([]);
      setSelectedClient("");
    } else {
      setSelectedClientIds(clients.map(client => client.id));
      if (clients.length > 0) {
        setSelectedClient("Todos os clientes");
      }
    }
  };

  const handleDashboardMonthSelect = (date: Date | undefined) => {
    setDashboardMonth(date);
    setDashboardCalendarOpen(false);
  };

  const toggleCurrentMonth = () => {
    setShowCurrentMonth(true);
    setFilterDate(undefined);
    setCalendarOpen(false);
  };

  const clearMonthFilter = () => {
    setFilterDate(undefined);
    setShowCurrentMonth(false);
    setCalendarOpen(false);
  };

  const handleMonthChange = (date: Date | undefined) => {
    setFilterDate(date);
    setShowCurrentMonth(false);
    setCalendarOpen(false);
  };

  const filteredServices = services.filter(service => {
    const searchText = filterText.toLowerCase();
    const matchesFilter = !filterText || service.client_name.toLowerCase().includes(searchText) || service.company_name.toLowerCase().includes(searchText) || service.service_description.toLowerCase().includes(searchText) || service.stage.toLowerCase().includes(searchText) || service.status.toLowerCase().includes(searchText);
    const matchesClient = !filterClient || service.client_name.toLowerCase().includes(filterClient.toLowerCase());
    const matchesSelectedMonth = !filterDate || isValid(filterDate) && isSameMonth(new Date(service.start_date), filterDate);
    const today = new Date();
    const isCurrentMonth = getMonth(new Date(service.start_date)) === getMonth(today) && getYear(new Date(service.start_date)) === getYear(today);
    const matchesCurrentMonth = !showCurrentMonth || isCurrentMonth;
    const matchesStatus = !filterStatus || filterStatus === 'paid' && service.payment_status === 'paid' || filterStatus === 'pending' && service.payment_status === 'pending';
    return matchesFilter && matchesClient && (showCurrentMonth && matchesCurrentMonth || !showCurrentMonth && matchesSelectedMonth) && matchesStatus;
  });

  const groupedServices = filteredServices.reduce((acc: {
    [key: string]: {
      clientName: string;
      services: Service[];
    };
  }, service) => {
    if (!acc[service.client_id]) {
      acc[service.client_id] = {
        clientName: service.client_name,
        services: []
      };
    }
    acc[service.client_id].services.push(service);
    return acc;
  }, {});

  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: ptBR });

  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Serviços</h1>
        
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex justify-center">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="new">Novo Serviço</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-0">
          <div className="mb-4 flex justify-end">
            <Popover open={dashboardCalendarOpen} onOpenChange={setDashboardCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dashboardMonth 
                    ? format(dashboardMonth, "MMMM yyyy", { locale: ptBR }) 
                    : "Selecione o mês"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="month"
                  selected={dashboardMonth}
                  onSelect={handleDashboardMonthSelect}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  locale={ptBR}
                  captionLayout="dropdown-buttons"
                  fromYear={2020}
                  toYear={2030}
                />
                <div className="p-3 border-t flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      const prevMonth = new Date(dashboardMonth || new Date());
                      prevMonth.setMonth(prevMonth.getMonth() - 1);
                      setDashboardMonth(prevMonth);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Mês anterior
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setDashboardMonth(new Date());
                      setDashboardCalendarOpen(false);
                    }}
                  >
                    Mês atual
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      const nextMonth = new Date(dashboardMonth || new Date());
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      setDashboardMonth(nextMonth);
                    }}
                  >
                    Próximo mês
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {renderDashboard(dashboardMonth 
            ? services.filter(service => {
                const serviceDate = parseISO(service.start_date);
                return isSameMonth(serviceDate, dashboardMonth);
              }) 
            : services, 
            dashboardMonth
          )}
        </TabsContent>
        
        <TabsContent value="new" className="mt-0">
          <div className="glass-card p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <PlusCircle className="h-6 w-6 text-indigo-600" />
              Adicionar Novo Serviço
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="new_start_date">Data de Início</Label>
                <Input id="new_start_date" type="date" value={newService.start_date} onChange={e => setNewService({
                ...newService,
                start_date: e.target.value
              })} className="glass-card" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new_company_name">Nome da Empresa/Cliente</Label>
                <Input id="new_company_name" value={newService.company_name} onChange={e => setNewService({
                ...newService,
                company_name: e.target.value
              })} className="glass-card" placeholder="Nome da Empresa/Cliente" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new_service_description">Descrição do Serviço</Label>
                <Input id="new_service_description" value={newService.service_description} onChange={e => setNewService({
                ...newService,
                service_description: e.target.value
              })} className="glass-card" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new_stage">Etapa</Label>
                <Input id="new_stage" value={newService.stage} onChange={e => setNewService({
                ...newService,
                stage: e.target.value
              })} className="glass-card" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new_status">Status</Label>
                <Input id="new_status" value={newService.status} onChange={e => setNewService({
                ...newService,
                status: e.target.value
              })} className="glass-card" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new_amount">Valor</Label>
                <Input id="new_amount" type="number" value={newService.amount} onChange={e => setNewService({
                ...newService,
                amount: Number(e.target.value)
              })} className="glass-card" />
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
                <Select value={newService.client_id} onValueChange={value => setNewService({
                ...newService,
                client_id: value
              })}>
                  <SelectTrigger className="glass-card">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
                <Button variant="outline" type="button">Cancelar</Button>
                <Button type="submit" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700">
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
              <div className="flex gap-4 items-center">
                {selectedClient && (
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Cliente: {selectedClient}
                  </div>
                )}
                <Button variant="outline" className="bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700" onClick={() => setShowShareDialog(true)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Compartilhar por Cliente
                </Button>
                <Button variant="outline" className="bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700" onClick={() => setShowStatsCard(!showStatsCard)}>
                  {showStatsCard ? "Ocultar estatísticas" : "Mostrar estatísticas"}
                </Button>
              </div>
            </div>
            
            {showStatsCard && <div className="mb-6">
                {renderDashboard(filteredServices, filterDate)}
              </div>}
            
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-2 flex-grow">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input placeholder="Pesquisar serviços..." className="pl-9 glass-card" value={filterText} onChange={e => setFilterText(e.target.value)} />
                </div>
                
                <div className="flex gap-2">
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant={showCurrentMonth ? "default" : "outline"} className={`gap-2 ${showCurrentMonth ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-800"}`}>
                        <CalendarIcon className="h-4 w-4" />
                        {showCurrentMonth ? currentMonth : filterDate ? format(filterDate, "MMMM yyyy", { locale: ptBR }) : "Selecione o mês"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 glass-card" align="start">
                      <Calendar 
                        mode="single" 
                        selected={filterDate} 
                        onSelect={handleMonthChange} 
                        initialFocus 
                        className="bg-white dark:bg-gray-800 pointer-events-auto" 
                        locale={ptBR}
                      />
                      <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                        <Button variant="ghost" onClick={toggleCurrentMonth} className="text-xs h-8">
                          Mês atual
                        </Button>
                        <Button variant="ghost" onClick={clearMonthFilter} className="text-xs h-8">
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
            
            <div className="space-y-6">
              {Object.entries(groupedServices).map(([clientId, {
              clientName,
              services
            }]) => <div key={clientId} className="border border-gray-200 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
                  <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{clientName}</h3>
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-indigo-600" onClick={() => {
                      handleToggleClientSelection(clientId);
                    }}>
                      <Link2 className="h-4 w-4 mr-1" />
                      Compartilhar
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-800">
                      <TableRow>
                        <TableHead className="w-[180px]">Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Nome da Empresa/Cliente</TableHead>
                        <TableHead>Etapa</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-center">Pagamento</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map(service => <TableRow key={service.id}>
                          <TableCell className="font-medium">
                            {format(new Date(service.start_date), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>{service.service_description}</TableCell>
                          <TableCell>{service.company_name}</TableCell>
                          <TableCell>{service.stage}</TableCell>
                          <TableCell>{service.status}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(service.amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="sm" onClick={() => togglePaymentStatus(service.id, service.payment_status)} className={`rounded-full px-3 py-1 text-xs font-medium ${service.payment_status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : service.payment_status === 'canceled' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'}`}>
                              {service.payment_status === 'paid' && 'Pago'}
                              {service.payment_status === 'pending' && 'Pendente'}
                              {service.payment_status === 'canceled' && 'Cancelado'}
                            </Button>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(service)} className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                        setServiceToDelete(service.id);
                        setShowDeleteDialog(true);
                      }} className="h-8 w-8 text-red-500 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>)}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Compartilhar com Clientes</DialogTitle>
            <DialogDescription>
              Selecione os clientes para compartilhar o portal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="selectAll" checked={selectedClientIds.length === clients.length && clients.length > 0} onCheckedChange={handleSelectAllClients} />
              <Label htmlFor="selectAll" className="text-sm font-medium">
                Selecionar todos
              </Label>
            </div>
            <div className="border rounded-md p-4 space-y-2 max-h-[200px] overflow-y-auto">
              {clients.map(client => <div key={client.id} className="flex items-center space-x-2">
                  <Checkbox id={`client-${client.id}`} checked={selectedClientIds.includes(client.id)} onCheckedChange={() => handleToggleClientSelection(client.id)} />
                  <Label htmlFor={`client-${client.id}`} className="text-sm font-medium">
                    {client.name}
                  </Label>
                </div>)}
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowShareDialog(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSharePortalLink}>
              <Link2 className="h-4 w-4 mr-2" />
              Gerar Links
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Links para Compartilhar</DialogTitle>
            <DialogDescription>
              Copie e compartilhe estes links com seus clientes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
            {selectedClientIds.map(clientId => {
            const client = clients.find(c => c.id === clientId);
            const portalUrl = `${window.location.origin}/client-portal?client=${clientId}`;
            return <div key={clientId} className="space-y-2">
                  <div className="font-medium">{client?.name}</div>
                  <div className="flex space-x-2">
                    <Input value={portalUrl} readOnly className="flex-1" />
                    <Button type="button" size="sm" onClick={() => {
                  navigator.clipboard.writeText(portalUrl);
                  toast.success(`Link para ${client?.name} copiado!`);
                }}>
                      Copiar
                    </Button>
                  </div>
                </div>;
          })}
          </div>
          <DialogFooter className="sm:justify-end">
            <Button type="button" onClick={() => setShowLinkDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {editingService && <Dialog open={!!editingService} onOpenChange={open => !open && setEditingService(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Serviço</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="edit_client_name">Cliente</Label>
                <Input id="edit_client_name" value={editingService.client_name} onChange={e => setEditingService({
              ...editingService,
              client_name: e.target.value
            })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_start_date">Data de Início</Label>
                <Input id="edit_start_date" type="date" value={editingService.start_date} onChange={e => setEditingService({
              ...editingService,
              start_date: e.target.value
            })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_company_name">Nome da Empresa/Cliente</Label>
                <Input id="edit_company_name" value={editingService.company_name} onChange={e => setEditingService({
              ...editingService,
              company_name: e.target.value
            })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_service_description">Descrição</Label>
                <Input id="edit_service_description" value={editingService.service_description} onChange={e => setEditingService({
              ...editingService,
              service_description: e.target.value
            })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_stage">Etapa</Label>
                <Input id="edit_stage" value={editingService.stage} onChange={e => setEditingService({
              ...editingService,
              stage: e.target.value
            })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status">Status</Label>
                <Input id="edit_status" value={editingService.status} onChange={e => setEditingService({
              ...editingService,
              status: e.target.value
            })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_amount">Valor</Label>
                <Input id="edit_amount" type="number" value={editingService.amount} onChange={e => setEditingService({
              ...editingService,
              amount: Number(e.target.value)
            })} />
              </div>
              <div className="space-y-2">
                <Label>Status do Pagamento</Label>
                <Select value={editingService.payment_status} onValueChange={handleEditingPaymentStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status do pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
            <DialogFooter className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-4">
              <Button type="button" variant="secondary" onClick={() => setEditingService(null)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleUpdate}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>}
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
}
