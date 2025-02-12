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
import { FileDown, Filter } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [filters, setFilters] = useState({
    startDate: "",
    client: "",
    company: "",
    service: "",
    stage: "",
    status: "",
  });
  const [selectedClientForExport, setSelectedClientForExport] = useState<string>("");

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

  const generatePDF = (clientName: string) => {
    const clientServices = services?.filter(s => s.client_name === clientName) || [];
    if (clientServices.length === 0) {
      toast.error("Nenhum serviço encontrado para este cliente");
      return;
    }

    const doc = new jsPDF();
    
    // Adiciona cabeçalho
    doc.setFontSize(20);
    doc.text("Relatório de Serviços", 105, 15, { align: "center" });
    doc.setFontSize(16);
    doc.text(`Cliente: ${clientName}`, 105, 25, { align: "center" });
    
    // Adiciona resumo financeiro
    const totalAmount = clientServices.reduce((sum, s) => sum + s.amount, 0);
    const paidAmount = clientServices.filter(s => s.is_paid).reduce((sum, s) => sum + s.amount, 0);
    const unpaidAmount = totalAmount - paidAmount;
    
    doc.setFontSize(12);
    doc.text("Resumo Financeiro:", 14, 40);
    doc.text(`Total em Serviços: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAmount)}`, 14, 48);
    doc.text(`Total Pago: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paidAmount)}`, 14, 56);
    doc.text(`Total a Receber: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(unpaidAmount)}`, 14, 64);

    // Adiciona tabela de serviços
    autoTable(doc, {
      startY: 75,
      head: [["Data", "Serviço", "Etapa", "Situação", "Valor", "Status"]],
      body: clientServices.map(service => [
        new Date(service.start_date).toLocaleDateString(),
        service.service_description,
        service.stage,
        service.status,
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.amount),
        service.is_paid ? "Pago" : "Pendente"
      ]),
      styles: { fontSize: 10, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`relatorio-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    toast.success("Relatório gerado com sucesso!");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add service mutation logic here
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Lista de Serviços</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar Relatório
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Exportar Relatório de Cliente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Selecione o Cliente</Label>
                    <Select
                      value={selectedClientForExport}
                      onValueChange={setSelectedClientForExport}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set(services?.map(s => s.client_name) || [])).map(client => (
                          <SelectItem key={client} value={client}>
                            {client}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    className="w-full"
                    onClick={() => generatePDF(selectedClientForExport)}
                    disabled={!selectedClientForExport}
                  >
                    Gerar PDF
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                      // Update service mutation logic here
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
