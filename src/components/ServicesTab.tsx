
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  user_id: string;
  reference_month: string;
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
  user_id: string;
  reference_month: string;
}

const COLORS = ['#10b981', '#ef4444'];

export function ServicesTab() {
  const queryClient = useQueryClient();
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filters, setFilters] = useState({
    startDate: "",
    client: "",
    company: "",
    service: "",
    stage: "",
    status: "",
  });
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState<Omit<NewService, 'user_id'>>({
    start_date: "",
    client_name: "",
    company_name: "",
    service_description: "",
    stage: "",
    status: "",
    amount: 0,
    is_paid: false,
    reference_month: format(new Date(), "yyyy-MM-dd"),
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ["services", format(currentMonth, "yyyy-MM")],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from("services")
        .select("*")
        .gte("reference_month", monthStart.toISOString().split('T')[0])
        .lte("reference_month", monthEnd.toISOString().split('T')[0])
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredServices = useMemo(() => {
    if (!services) return [];
    return services.filter(service => {
      const matchesPaymentFilter = 
        paymentFilter === "all" ? true :
        paymentFilter === "paid" ? service.is_paid :
        !service.is_paid;

      const matchesTextFilters =
        (!filters.startDate || service.start_date.includes(filters.startDate)) &&
        (!filters.client || service.client_name.toLowerCase().includes(filters.client.toLowerCase())) &&
        (!filters.company || service.company_name.toLowerCase().includes(filters.company.toLowerCase())) &&
        (!filters.service || service.service_description.toLowerCase().includes(filters.service.toLowerCase())) &&
        (!filters.stage || service.stage.toLowerCase().includes(filters.stage.toLowerCase())) &&
        (!filters.status || service.status.toLowerCase().includes(filters.status.toLowerCase()));

      return matchesPaymentFilter && matchesTextFilters;
    });
  }, [services, paymentFilter, filters]);

  const paymentSummary = useMemo(() => {
    if (!services) return [];
    
    const paidAmount = services
      .filter(service => service.is_paid)
      .reduce((sum, service) => sum + service.amount, 0);
    
    const unpaidAmount = services
      .filter(service => !service.is_paid)
      .reduce((sum, service) => sum + service.amount, 0);

    return [
      { name: 'Recebido', value: paidAmount },
      { name: 'A Receber', value: unpaidAmount }
    ];
  }, [services]);

  const addServiceMutation = useMutation({
    mutationFn: async (serviceData: Omit<NewService, 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("services")
        .insert([{ 
          ...serviceData, 
          user_id: user.id,
          start_date: serviceData.start_date,
          reference_month: format(currentMonth, "yyyy-MM-dd")
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setNewService({
        start_date: "",
        client_name: "",
        company_name: "",
        service_description: "",
        stage: "",
        status: "",
        amount: 0,
        is_paid: false,
        reference_month: format(new Date(), "yyyy-MM-dd"),
      });
      toast.success("Serviço adicionado com sucesso!");
    },
    onError: (error) => {
      console.error("Error adding service:", error);
      toast.error("Erro ao adicionar serviço");
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Service> }) => {
      const { error } = await supabase
        .from("services")
        .update({
          ...updates,
          start_date: updates.start_date,
          reference_month: updates.reference_month
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setEditingService(null);
      toast.success("Serviço atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating service:", error);
      toast.error("Erro ao atualizar serviço");
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting service:", error);
      toast.error("Erro ao excluir serviço");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addServiceMutation.mutate(newService);
  };

  const handleSaveEdit = () => {
    if (!editingService) return;
    updateServiceMutation.mutate({
      id: editingService.id,
      updates: editingService,
    });
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-bold mb-6">Novo Serviço</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">Data de Início</Label>
            <Input
              type="date"
              id="start_date"
              value={newService.start_date}
              onChange={(e) =>
                setNewService({ ...newService, start_date: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_name">Cliente</Label>
            <Input
              type="text"
              id="client_name"
              value={newService.client_name}
              onChange={(e) =>
                setNewService({ ...newService, client_name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Empresa</Label>
            <Input
              type="text"
              id="company_name"
              value={newService.company_name}
              onChange={(e) =>
                setNewService({ ...newService, company_name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_description">Serviço</Label>
            <Input
              type="text"
              id="service_description"
              value={newService.service_description}
              onChange={(e) =>
                setNewService({ ...newService, service_description: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Etapa</Label>
            <Input
              type="text"
              id="stage"
              value={newService.stage}
              onChange={(e) =>
                setNewService({ ...newService, stage: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Situação</Label>
            <Input
              type="text"
              id="status"
              value={newService.status}
              onChange={(e) =>
                setNewService({ ...newService, status: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input
              type="number"
              id="amount"
              value={newService.amount}
              onChange={(e) =>
                setNewService({ ...newService, amount: Number(e.target.value) })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference_month">Mês de Referência</Label>
            <Input
              type="date"
              id="reference_month"
              value={newService.reference_month}
              onChange={(e) =>
                setNewService({ ...newService, reference_month: e.target.value })
              }
              required
            />
          </div>

          <div className="flex items-center space-x-2 pt-8">
            <Switch
              id="is_paid"
              checked={newService.is_paid}
              onCheckedChange={(checked) =>
                setNewService({ ...newService, is_paid: checked })
              }
            />
            <Label htmlFor="is_paid">Pago</Label>
          </div>

          <div className="md:col-span-2 lg:col-span-4 flex justify-end">
            <Button type="submit">Adicionar Serviço</Button>
          </div>
        </form>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentSummary}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => 
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Totais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Total Recebido</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paymentSummary[0]?.value || 0)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Total a Receber</p>
                <p className="text-2xl font-bold text-rose-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paymentSummary[1]?.value || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Lista de Serviços</h2>
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleMonthChange('prev')}
              >
                ←
              </Button>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleMonthChange('next')}
              >
                →
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={paymentFilter === "all" ? "default" : "outline"}
              onClick={() => setPaymentFilter("all")}
            >
              Todos
            </Button>
            <Button
              variant={paymentFilter === "paid" ? "default" : "outline"}
              className={paymentFilter === "paid" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
              onClick={() => setPaymentFilter("paid")}
            >
              Pagos
            </Button>
            <Button
              variant={paymentFilter === "unpaid" ? "default" : "outline"}
              className={paymentFilter === "unpaid" ? "bg-rose-500 hover:bg-rose-600" : ""}
              onClick={() => setPaymentFilter("unpaid")}
            >
              Não Pagos
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4 mb-4">
          <Input
            placeholder="Filtrar Data"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <Input
            placeholder="Filtrar Cliente"
            value={filters.client}
            onChange={(e) => setFilters({ ...filters, client: e.target.value })}
          />
          <Input
            placeholder="Filtrar Empresa"
            value={filters.company}
            onChange={(e) => setFilters({ ...filters, company: e.target.value })}
          />
          <Input
            placeholder="Filtrar Serviço"
            value={filters.service}
            onChange={(e) => setFilters({ ...filters, service: e.target.value })}
          />
          <Input
            placeholder="Filtrar Etapa"
            value={filters.stage}
            onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
          />
          <Input
            placeholder="Filtrar Situação"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data de Início</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.map((service) => (
              <TableRow 
                key={service.id}
                className={service.is_paid ? "bg-emerald-50" : ""}
              >
                <TableCell>{formatDate(service.start_date)}</TableCell>
                <TableCell>{service.client_name}</TableCell>
                <TableCell>{service.company_name}</TableCell>
                <TableCell>{service.service_description}</TableCell>
                <TableCell>{service.stage}</TableCell>
                <TableCell>{service.status}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(service.amount)}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={service.is_paid}
                    onCheckedChange={(checked) =>
                      updateServiceMutation.mutate({
                        id: service.id,
                        updates: { is_paid: checked },
                      })
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setEditingService(service)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Serviço</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-date">Data</Label>
                            <Input
                              id="edit-date"
                              type="date"
                              value={editingService?.start_date.split('T')[0] || ""}
                              onChange={(e) =>
                                setEditingService(prev =>
                                  prev ? { ...prev, start_date: e.target.value } : null
                                )
                              }
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-reference-month">Mês de Referência</Label>
                            <Input
                              id="edit-reference-month"
                              type="date"
                              value={editingService?.reference_month.split('T')[0] || ""}
                              onChange={(e) =>
                                setEditingService(prev =>
                                  prev ? { ...prev, reference_month: e.target.value } : null
                                )
                              }
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-client">Cliente</Label>
                            <Input
                              id="edit-client"
                              value={editingService?.client_name || ""}
                              onChange={(e) =>
                                setEditingService(prev =>
                                  prev ? { ...prev, client_name: e.target.value } : null
                                )
                              }
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-company">Empresa</Label>
                            <Input
                              id="edit-company"
                              value={editingService?.company_name || ""}
                              onChange={(e) =>
                                setEditingService(prev =>
                                  prev ? { ...prev, company_name: e.target.value } : null
                                )
                              }
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-service">Serviço</Label>
                            <Input
                              id="edit-service"
                              value={editingService?.service_description || ""}
                              onChange={(e) =>
                                setEditingService(prev =>
                                  prev ? { ...prev, service_description: e.target.value } : null
                                )
                              }
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-stage">Etapa</Label>
                            <Input
                              id="edit-stage"
                              value={editingService?.stage || ""}
                              onChange={(e) =>
                                setEditingService(prev =>
                                  prev ? { ...prev, stage: e.target.value } : null
                                )
                              }
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-status">Situação</Label>
                            <Input
                              id="edit-status"
                              value={editingService?.status || ""}
                              onChange={(e) =>
                                setEditingService(prev =>
                                  prev ? { ...prev, status: e.target.value } : null
                                )
                              }
                              className="col-span-3"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-amount">Valor</Label>
                            <Input
                              id="edit-amount"
                              type="number"
                              value={editingService?.amount || 0}
                              onChange={(e) =>
                                setEditingService(prev =>
                                  prev ? { ...prev, amount: Number(e.target.value) } : null
                                )
                              }
                              className="col-span-3"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="edit-paid"
                              checked={editingService?.is_paid || false}
                              onCheckedChange={(checked) =>
                                setEditingService(prev =>
                                  prev ? { ...prev, is_paid: checked } : null
                                )
                              }
                            />
                            <Label htmlFor="edit-paid">Pago</Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                          </DialogClose>
                          <Button onClick={handleSaveEdit}>Salvar</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirmar Exclusão</DialogTitle>
                        </DialogHeader>
                        <p>Tem certeza que deseja excluir este serviço?</p>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                          </DialogClose>
                          <Button
                            variant="destructive"
                            onClick={() => deleteServiceMutation.mutate(service.id)}
                          >
                            Excluir
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
