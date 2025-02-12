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
}

const COLORS = ['#10b981', '#ef4444'];

export function ServicesTab() {
  const queryClient = useQueryClient();
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [newService, setNewService] = useState<Omit<NewService, 'user_id'>>({
    start_date: "",
    client_name: "",
    company_name: "",
    service_description: "",
    stage: "",
    status: "",
    amount: 0,
    is_paid: false,
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredServices = useMemo(() => {
    if (!services) return [];
    return services.filter(service => {
      if (paymentFilter === "paid") return service.is_paid;
      if (paymentFilter === "unpaid") return !service.is_paid;
      return true;
    });
  }, [services, paymentFilter]);

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
        .insert([{ ...serviceData, user_id: user.id }]);
      
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
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Serviço atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating service:", error);
      toast.error("Erro ao atualizar serviço");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addServiceMutation.mutate(newService);
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
          <h2 className="text-2xl font-bold">Lista de Serviços</h2>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.map((service) => (
              <TableRow key={service.id}>
                <TableCell>{new Date(service.start_date).toLocaleDateString()}</TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
