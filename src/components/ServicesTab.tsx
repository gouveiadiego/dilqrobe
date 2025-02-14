
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useClients } from "@/hooks/useClients";
import { ClientManager } from "./ClientManager";
import { Link2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

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
    } catch (error) {
      console.error("Error creating service:", error);
      toast.error("Erro ao criar serviço");
    }
  };

  const handleSharePortalLink = async (clientId: string) => {
    // Aqui você pode implementar a lógica para enviar o link por email
    const portalUrl = `${window.location.origin}/client-portal?client=${clientId}`;
    
    // Por enquanto, vamos apenas copiar o link para a área de transferência
    await navigator.clipboard.writeText(portalUrl);
    toast.success("Link copiado para a área de transferência!");
    setShowShareDialog(false);
  };

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
    </div>
  );
}
