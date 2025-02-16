import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useClients } from "@/hooks/useClients";
import { ClientManager } from "./ClientManager";
import { Link2, Search, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

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

const renderDashboard = () => {
  const stats = calculateStats(services);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-sm font-medium text-gray-500">Total de Serviços</h3>
        <p className="text-2xl font-bold">{stats.total}</p>
        <p className="text-sm text-gray-500">{formatCurrency(stats.totalAmount)}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-sm font-medium text-gray-500">Pagos</h3>
        <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
        <p className="text-sm text-gray-500">{formatCurrency(stats.paidAmount)}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-sm font-medium text-gray-500">Pendentes</h3>
        <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
        <p className="text-sm text-gray-500">{formatCurrency(stats.pendingAmount)}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-sm font-medium text-gray-500">Cancelados</h3>
        <p className="text-2xl font-bold text-red-600">{stats.canceled}</p>
        <p className="text-sm text-gray-500">{formatCurrency(stats.canceledAmount)}</p>
      </div>

      <div className="col-span-full">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium mb-4">Distribuição de Status</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Pagos', value: stats.paid, color: '#22c55e' },
                    { name: 'Pendentes', value: stats.pending, color: '#f97316' },
                    { name: 'Cancelados', value: stats.canceled, color: '#ef4444' },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Pagos', color: '#22c55e' },
                    { name: 'Pendentes', color: '#f97316' },
                    { name: 'Cancelados', color: '#ef4444' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="col-span-full">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium mb-4">Valores por Status</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Pagos', value: stats.paidAmount },
                  { name: 'Pendentes', value: stats.pendingAmount },
                  { name: 'Cancelados', value: stats.canceledAmount },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="value">
                  {[
                    { name: 'Pagos', color: '#22c55e' },
                    { name: 'Pendentes', color: '#f97316' },
                    { name: 'Cancelados', color: '#ef4444' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export function ServicesTab() {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
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
    client_id: "",
  });
  const [filterClient, setFilterClient] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterText, setFilterText] = useState("");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [showStatsCard, setShowStatsCard] = useState(true);

  const fetchServices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Erro ao carregar serviços");
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const serviceData = {
        ...newService,
        user_id: user.id,
      };

      const { error } = await supabase
        .from('services')
        .insert([serviceData]);

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
        client_id: "",
      });
      fetchServices();
    } catch (error) {
      console.error("Error creating service:", error);
      toast.error("Erro ao criar serviço");
    }
  };

  const handleSharePortalLink = async (clientId: string) => {
    const portalUrl = `${window.location.origin}/client-portal?client=${clientId}`;
    await navigator.clipboard.writeText(portalUrl);
    toast.success("Link copiado para a área de transferência!");
    setShowShareDialog(false);
  };

  const togglePaymentStatus = async (serviceId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
      const { error } = await supabase
        .from('services')
        .update({ payment_status: newStatus })
        .eq('id', serviceId);

      if (error) throw error;

      await fetchServices();
      toast.success("Status de pagamento atualizado!");
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Erro ao atualizar status de pagamento");
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
      const { error } = await supabase
        .from('services')
        .update({
          ...editingService,
        })
        .eq('id', editingService.id);

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
    const matchesFilter = !filterText || 
      service.client_name.toLowerCase().includes(searchText) ||
      service.company_name.toLowerCase().includes(searchText) ||
      service.service_description.toLowerCase().includes(searchText) ||
      service.stage.toLowerCase().includes(searchText) ||
      service.status.toLowerCase().includes(searchText);
    
    const matchesClient = !filterClient || service.client_name.toLowerCase().includes(filterClient.toLowerCase());
    const matchesMonth = !filterMonth || format(new Date(service.start_date), "yyyy-MM") === filterMonth;
    const matchesStatus = !filterStatus || 
      (filterStatus === 'paid' && service.payment_status === 'paid') || 
      (filterStatus === 'pending' && service.payment_status === 'pending');
    
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
  }, {} as Record<string, { clientName: string; services: Service[] }>);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-bold mb-6">Novo Serviço</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <div className="flex gap-2">
              <select
                id="client"
                className="flex-1 px-3 py-2 border rounded-md"
                value={newService.client_id}
                onChange={(e) => {
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
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    disabled={!newService.client_id}
                    onClick={() => setSelectedClientId(newService.client_id)}
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Compartilhar Portal do Cliente</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="mb-4">
                      Compartilhe este link com seu cliente para que ele possa acompanhar os serviços:
                    </p>
                    <Input
                      value={`${window.location.origin}/client-portal?client=${selectedClientId}`}
                      readOnly
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="outline">Fechar</Button>
                    </DialogClose>
                    <Button onClick={() => handleSharePortalLink(selectedClientId)}>
                      Copiar Link
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Data de Início</Label>
            <Input
              id="start_date"
              type="date"
              value={newService.start_date}
              onChange={(e) => setNewService({ ...newService, start_date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Nome da Empresa</Label>
            <Input
              id="company_name"
              value={newService.company_name}
              onChange={(e) => setNewService({ ...newService, company_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_description">Descrição do Serviço</Label>
            <Input
              id="service_description"
              value={newService.service_description}
              onChange={(e) => setNewService({ ...newService, service_description: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Etapa</Label>
            <Input
              id="stage"
              value={newService.stage}
              onChange={(e) => setNewService({ ...newService, stage: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Input
              id="status"
              value={newService.status}
              onChange={(e) => setNewService({ ...newService, status: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input
              id="amount"
              type="number"
              value={newService.amount}
              onChange={(e) => setNewService({ ...newService, amount: Number(e.target.value) })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Status do Pagamento</Label>
            <Select
              value={newService.payment_status}
              onValueChange={(value) => setNewService({ ...newService, payment_status: value })}
            >
              <SelectTrigger>
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
            <Button type="submit" className="w-full">
              Criar Serviço
            </Button>
          </div>
        </form>
      </div>

      <ClientManager />

      {showStatsCard && renderDashboard()}

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Serviços</h2>
          <div className="flex gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Link2 className="h-4 w-4 mr-2" />
                  Compartilhar por Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Compartilhar Serviços por Cliente</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  {Object.entries(groupedServices).map(([clientId, { clientName, services }]) => (
                    <div key={clientId} className="border p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{clientName}</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSharePortalLink(clientId)}
                        >
                          Copiar Link
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {services.length} serviço(s) cadastrado(s)
                      </p>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar em todas as colunas..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-40"
          />
          <select
            className="border rounded-md px-3"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="paid">Pagos</option>
            <option value="pending">Pendentes</option>
          </select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.map((service) => (
              <TableRow key={service.id}>
                <TableCell>
                  {format(new Date(service.start_date), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>{service.client_name}</TableCell>
                <TableCell>{service.company_name}</TableCell>
                <TableCell>{service.service_description}</TableCell>
                <TableCell>{service.stage}</TableCell>
                <TableCell>{service.status}</TableCell>
                <TableCell>{formatCurrency(service.amount)}</TableCell>
              <TableCell>
                  <Select
                    value={service.payment_status}
                    onValueChange={async (value) => {
                      try {
                        const { error } = await supabase
                          .from('services')
                          .update({ payment_status: value })
                          .eq('id', service.id);

                        if (error) throw error;

                        await fetchServices();
                        toast.success("Status de pagamento atualizado");
                      } catch (error) {
                        console.error('Error updating payment status:', error);
                        toast.error("Erro ao atualizar status");
                      }
                    }}
                  >
                    <SelectTrigger 
                      className={`w-[110px] ${
                        service.payment_status === 'paid' 
                          ? 'text-green-600' 
                          : service.payment_status === 'canceled'
                          ? 'text-red-600'
                          : 'text-orange-600'
                      }`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="canceled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(service)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setServiceToDelete(service.id);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingService} onOpenChange={() => setEditingService(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Serviço</DialogTitle>
          </DialogHeader>
          {editingService && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start_date">Data</Label>
                  <Input
                    id="edit-start_date"
                    type="date"
                    value={format(new Date(editingService.start_date), "yyyy-MM-dd")}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        start_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-client_name">Cliente</Label>
                  <Input
                    id="edit-client_name"
                    value={editingService.client_name}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        client_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-company_name">Empresa</Label>
                  <Input
                    id="edit-company_name"
                    value={editingService.company_name}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        company_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-service_description">Serviço</Label>
                  <Input
                    id="edit-service_description"
                    value={editingService.service_description}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        service_description: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-stage">Etapa</Label>
                  <Input
                    id="edit-stage"
                    value={editingService.stage}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        stage: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Input
                    id="edit-status"
                    value={editingService.status}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        status: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-amount">Valor</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    value={editingService.amount}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        amount: Number(e.target.value),
                      })
                    }
                  />
                </div>
               <div>
                  <Label>Status de Pagamento</Label>
                  <Select
                    value={editingService.payment_status}
                    onValueChange={(value) =>
                      setEditingService({
                        ...editingService,
                        payment_status: value,
                      })
                    }
                  >
                    <SelectTrigger>
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
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja excluir este serviço?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
