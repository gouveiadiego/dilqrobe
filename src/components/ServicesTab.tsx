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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
  total: number;
  pending: number;
  paid: number;
  canceled: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  canceledAmount: number;
}

const calculateStats = (services: Service[]): ServiceStats => {
  return services.reduce((acc: ServiceStats, service) => {
    acc.total++;
    acc.totalAmount += service.amount;
    switch (service.payment_status) {
      case 'paid':
        acc.paid++;
        acc.paidAmount += service.amount;
        break;
      case 'canceled':
        acc.canceled++;
        acc.canceledAmount += service.amount;
        break;
      default:
        acc.pending++;
        acc.pendingAmount += service.amount;
    }
    return acc;
  }, {
    total: 0,
    pending: 0,
    paid: 0,
    canceled: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    canceledAmount: 0
  });
};

const calculateDailyRevenue = (services: Service[]) => {
  if (services.length === 0) {
    return [];
  }
  
  const currentDate = services.length > 0 
    ? new Date(services[0].start_date) 
    : new Date();
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  const allDaysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const dailyRevenue = allDaysInMonth.reduce((acc: { [key: string]: number }, day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    acc[dateKey] = 0;
    return acc;
  }, {});
  
  services.forEach(service => {
    const date = format(new Date(service.start_date), 'yyyy-MM-dd');
    dailyRevenue[date] = (dailyRevenue[date] || 0) + service.amount;
  });

  return Object.entries(dailyRevenue)
    .map(([date, amount]) => ({
      date,
      amount
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const renderDashboard = (services: Service[]) => {
  const stats = calculateStats(services);
  const dailyRevenueData = calculateDailyRevenue(services);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="glass-card p-5 transition-all duration-300 hover:translate-y-[-5px]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500">Total de Serviços</h3>
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <BarChart3 size={16} />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-bold text-gradient">{stats.total}</p>
          <p className="text-sm text-gray-500 mb-1">{formatCurrency(stats.totalAmount)}</p>
        </div>
        <div className="w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mt-2 shimmer-effect"></div>
      </div>
      
      <div className="glass-card p-5 transition-all duration-300 hover:translate-y-[-5px]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500">Pagos</h3>
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-100 text-green-600">
            <CreditCard size={16} />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-bold text-green-600">{stats.paid}</p>
          <p className="text-sm text-gray-500 mb-1">{formatCurrency(stats.paidAmount)}</p>
        </div>
        <div className="w-full h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full mt-2 shimmer-effect"></div>
      </div>
      
      <div className="glass-card p-5 transition-all duration-300 hover:translate-y-[-5px]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500">Pendentes</h3>
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <Calendar size={16} />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
          <p className="text-sm text-gray-500 mb-1">{formatCurrency(stats.pendingAmount)}</p>
        </div>
        <div className="w-full h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full mt-2 shimmer-effect"></div>
      </div>
      
      <div className="glass-card p-5 transition-all duration-300 hover:translate-y-[-5px]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500">Cancelados</h3>
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600">
            <Trash2 size={16} />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-bold text-red-600">{stats.canceled}</p>
          <p className="text-sm text-gray-500 mb-1">{formatCurrency(stats.canceledAmount)}</p>
        </div>
        <div className="w-full h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-full mt-2 shimmer-effect"></div>
      </div>

      <div className="col-span-full">
        <div className="glass-card p-5">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-500" />
            <span>Faturamento Diário</span>
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyRevenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7B68EE" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#7B68EE" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'dd/MM')}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  formatter={(value) => formatCurrency(Number(value))}
                  labelFormatter={(label) => format(new Date(label), 'dd/MM/yyyy')}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    borderRadius: '8px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' 
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  name="Faturamento"
                  radius={[4, 4, 0, 0]}
                  fill="url(#colorRevenue)"
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="col-span-full">
        <div className="glass-card p-5">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-indigo-500" />
            <span>Valores por Status</span>
          </h3>
          <div className="h-[300px] flex flex-col md:flex-row items-center justify-center">
            <div className="w-full md:w-2/3 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={[{
                  name: 'Pagos',
                  value: stats.paidAmount
                }, {
                  name: 'Pendentes',
                  value: stats.pendingAmount
                }, {
                  name: 'Cancelados',
                  value: stats.canceledAmount
                }]}>
                  <defs>
                    <linearGradient id="colorPaid" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="colorPending" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="colorCanceled" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={value => formatCurrency(Number(value))} />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip formatter={value => formatCurrency(Number(value))} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={1500}>
                    {[{
                      name: 'Pagos',
                      fill: 'url(#colorPaid)'
                    }, {
                      name: 'Pendentes',
                      fill: 'url(#colorPending)'
                    }, {
                      name: 'Cancelados',
                      fill: 'url(#colorCanceled)'
                    }].map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/3 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{
                      name: 'Pagos',
                      value: stats.paidAmount
                    }, {
                      name: 'Pendentes',
                      value: stats.pendingAmount
                    }, {
                      name: 'Cancelados',
                      value: stats.canceledAmount
                    }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    <Cell key="paid" fill="#10b981" />
                    <Cell key="pending" fill="#f97316" />
                    <Cell key="canceled" fill="#ef4444" />
                  </Pie>
                  <Tooltip formatter={value => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('services').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Erro ao carregar serviços");
    }
  };

  const fetchCompanyLogo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('company_logo')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      if (data) {
        setCompanyLogo(data.company_logo);
      }
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
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }
      const serviceData = {
        ...newService,
        user_id: user.id
      };
      const {
        error
      } = await supabase.from('services').insert([serviceData]);
      if (error) throw error;
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
      fetchServices();
    } catch (error) {
      console.error("Error creating service:", error);
      toast.error("Erro ao criar serviço");
    }
  };

  const handleSharePortalLink = async (clientId: string) => {
    const portalUrl = `${window.location.origin}/client-portal?client=${clientId}${companyLogo ? `&logo=${encodeURIComponent(companyLogo)}` : ''}`;
    await navigator.clipboard.writeText(portalUrl);
    toast.success("Link copiado para a área de transferência!");
    setShowShareDialog(false);
  };

  const togglePaymentStatus = async (serviceId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
      const {
        error
      } = await supabase.from('services').update({
        payment_status: newStatus
      }).eq('id', serviceId);
      if (error) throw error;
      await fetchServices();
      toast.success("Status de pagamento atualizado!");
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Erro ao atualizar status de pagamento");
    }
  };

  const handleEdit = (service: Service) => {
    console.log("Editing service:", service); // Add this for debugging
    setEditingService(service);
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    try {
      const {
        error
      } = await supabase.from('services').delete().eq('id', serviceToDelete);
      if (error) throw error;
      toast.success("Serviço excluído com sucesso!");
      setShowDeleteDialog(false);
      setServiceToDelete(null);
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Erro ao excluir serviço");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      const {
        error
      } = await supabase.from('services').update({
        ...editingService
      }).eq('id', editingService.id);
      if (error) throw error;
      toast.success("Serviço atualizado com sucesso!");
      setEditingService(null);
      fetchServices();
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("Erro ao atualizar serviço");
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
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
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
                  <Label htmlFor="client" className="text-sm font-medium">Cliente</Label>
                  <div className="flex gap-2">
                    <select 
                      id="client" 
                      className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200" 
                      value={newService.client_id} 
                      onChange={e => {
                        const client = clients.find(c => c.id === e.target.value);
                        setNewService({
                          ...newService,
                          client_id: e.target.value,
                          client_name: client ? client.name : ""
                        });
                      }} 
                      required
                    >
                      <option value="">Selecione um cliente</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                    <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" type="button" disabled={!newService.client_id} onClick={() => setSelectedClientId(newService.client_id)}>
                          <Link2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card">
                        <DialogHeader>
                          <DialogTitle>Compartilhar Portal do Cliente</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          {companyLogo && (
                            <div className="mb-4 flex justify-center">
                              <img 
                                src={companyLogo} 
                                alt="Logo da empresa" 
                                className="h-16 w-auto object-contain"
                              />
                            </div>
                          )}
                          <p className="mb-4">
                            Compartilhe este link com seu cliente para que ele possa acompanhar os serviços:
                          </p>
                          <Input value={`${window.location.origin}/client-portal?client=${selectedClientId}${companyLogo ? `&logo=${encodeURIComponent(companyLogo)}` : ''}`} readOnly className="glass-card" />
                        </div>
                        <div className="flex justify-end gap-2">
                          <DialogClose asChild>
                            <Button variant="outline">Fechar</Button>
                          </DialogClose>
                          <Button onClick={() => handleSharePortalLink(selectedClientId)} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700">
                            Copiar Link
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date" className="text-sm font-medium">Data de Início</Label>
                  <Input 
                    id="start_date" 
                    type="date" 
                    value={newService.start_date} 
                    onChange={e => setNewService({
                      ...newService,
                      start_date: e.target.value
                    })} 
                    className="glass-card"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-sm font-medium">Nome da Empresa</Label>
                  <Input 
                    id="company_name" 
                    value={newService.company_name} 
                    onChange={e => setNewService({
                      ...newService,
                      company_name: e.target.value
                    })} 
                    className="glass-card"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_description" className="text-sm font-medium">Descrição do Serviço</Label>
                  <Input 
                    id="service_description" 
                    value={newService.service_description} 
                    onChange={e => setNewService({
                      ...newService,
                      service_description: e.target.value
                    })} 
                    className="glass-card"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stage" className="text-sm font-medium">Etapa</Label>
                  <Input 
                    id="stage" 
                    value={newService.stage} 
                    onChange={e => setNewService({
                      ...newService,
                      stage: e.target.value
                    })} 
                    className="glass-card"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                  <Input 
                    id="status" 
                    value={newService.status} 
                    onChange={e => setNewService({
                      ...newService,
                      status: e.target.value
                    })} 
                    className="glass-card"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-medium">Valor</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    value={newService.amount} 
                    onChange={e => setNewService({
                      ...newService,
                      amount: Number(e.target.value)
                    })} 
                    className="glass-card"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status do Pagamento</Label>
                  <Select 
                    value={newService.payment_status} 
                    onValueChange={value => setNewService({
                      ...newService,
                      payment_status: value
                    })}
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
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-xs"
                                onClick={() => handleSharePortalLink(clientId)}
