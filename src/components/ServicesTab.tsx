
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useClients } from "@/hooks/useClients";
import { ClientManager } from "./ClientManager";
import { Link2, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Service {
  id: string;
  start_date: string;
  client_name: string;
  company_name: string;
  service_description: string;
  stage: string;
  status: string;
  amount: number;
  is_paid: boolean;
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
  is_paid: boolean;
  reference_month: string;
  client_id: string;
  user_id: string;
}

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
    is_paid: false,
    reference_month: format(new Date(), "yyyy-MM-dd"),
    client_id: "",
  });
  const [filterClient, setFilterClient] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterText, setFilterText] = useState("");

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

      const { error } = await supabase
        .from('services')
        .insert([{ ...newService, user_id: user.id }]);

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
        is_paid: false,
        reference_month: format(new Date(), "yyyy-MM-dd"),
        client_id: "",
      });
      fetchServices(); // Reload services after creating a new one
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

  const togglePaymentStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_paid: !currentStatus })
        .eq('id', serviceId);

      if (error) throw error;

      await fetchServices();
      toast.success("Status de pagamento atualizado!");
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error("Erro ao atualizar status de pagamento");
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
      (filterStatus === 'paid' && service.is_paid) || 
      (filterStatus === 'pending' && !service.is_paid);
    
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
            <Label htmlFor="is_paid">Status do Pagamento</Label>
            <select
              id="is_paid"
              className="w-full px-3 py-2 border rounded-md"
              value={newService.is_paid ? "true" : "false"}
              onChange={(e) => setNewService({ ...newService, is_paid: e.target.value === "true" })}
              required
            >
              <option value="false">Pendente</option>
              <option value="true">Pago</option>
            </select>
          </div>

          <div className="lg:col-span-4">
            <Button type="submit" className="w-full">
              Criar Serviço
            </Button>
          </div>
        </form>
      </div>

      <ClientManager />

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
                  <Button
                    variant="ghost"
                    className={`px-2 py-1 rounded text-sm ${
                      service.is_paid
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    }`}
                    onClick={() => togglePaymentStatus(service.id, service.is_paid)}
                  >
                    {service.is_paid ? 'Pago' : 'Pendente'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
