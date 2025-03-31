
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ClientService {
  id: string;
  start_date: string;
  service_description: string;
  company_name: string;
  stage: string;
  status: string;
  amount: number;
  payment_status: string;
  client_id: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
}

export default function ClientPortal() {
  const [services, setServices] = useState<ClientService[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('client');

  useEffect(() => {
    const fetchData = async () => {
      if (!clientId) return;

      // Fetch client information
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, name, email')
        .eq('id', clientId)
        .single();

      if (clientError) {
        console.error('Error fetching client info:', clientError);
      } else {
        setClient(clientData as Client);
      }

      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('client_id', clientId)
        .order('start_date', { ascending: false });

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
        return;
      }

      setServices(servicesData || []);
      setLoading(false);
    };

    fetchData();
  }, [clientId]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Portal do Cliente</h1>
      
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {client?.name}
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Nome da Empresa/Cliente</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell>
                  {format(new Date(service.start_date), "dd/MM/yyyy")}
                </TableCell>
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
                  <span className={`px-2 py-1 rounded text-sm ${
                    service.payment_status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : service.payment_status === 'canceled'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {service.payment_status === 'paid' 
                      ? 'Pago' 
                      : service.payment_status === 'canceled'
                      ? 'Cancelado'
                      : 'Pendente'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
