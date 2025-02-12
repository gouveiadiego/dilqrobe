
import { useState } from "react";
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

export function ServicesTab() {
  const queryClient = useQueryClient();
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

      <div className="bg-white p-6 rounded-lg shadow-sm border overflow-x-auto">
        <h2 className="text-2xl font-bold mb-6">Lista de Serviços</h2>
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
            {services?.map((service) => (
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
