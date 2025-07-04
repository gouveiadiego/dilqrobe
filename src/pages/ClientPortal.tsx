import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Share, Check, Copy, Link, Calendar as CalendarIcon, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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

interface PaymentSummary {
  paid: number;
  pending: number;
  canceled: number;
  paidTotal: number;
  pendingTotal: number;
  canceledTotal: number;
}

export default function ClientPortal() {
  const [services, setServices] = useState<ClientService[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('client');
  const clientSlug = searchParams.get('name');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPublic] = useState(searchParams.get('public') === 'true');
  const shareUrlRef = useRef<HTMLInputElement>(null);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    paid: 0,
    pending: 0,
    canceled: 0,
    paidTotal: 0,
    pendingTotal: 0,
    canceledTotal: 0
  });
  const isMobile = useIsMobile();
  const [selectedMonth, setSelectedMonth] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      let effectiveClientId = clientId;
      
      if (!effectiveClientId && clientSlug) {
        const { data, error } = await supabase
          .from('clients')
          .select('id')
          .ilike('name', `%${decodeURIComponent(clientSlug)}%`)
          .limit(1)
          .single();
          
        if (!error && data) {
          effectiveClientId = data.id;
        }
      }
      
      if (!effectiveClientId) return;

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, name, email')
        .eq('id', effectiveClientId)
        .single();

      if (clientError) {
        console.error('Erro ao buscar informações do cliente:', clientError);
      } else {
        setClient(clientData as Client);
      }

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('client_id', effectiveClientId)
        .order('start_date', { ascending: false });

      if (servicesError) {
        console.error('Erro ao buscar serviços:', servicesError);
        return;
      }

      setServices(servicesData || []);
      
      const summary = calculatePaymentSummary(servicesData || []);
      setPaymentSummary(summary);
      
      setLoading(false);
    };

    fetchData();
  }, [clientId, clientSlug]);

  const calculatePaymentSummary = (services: ClientService[]): PaymentSummary => {
    const filteredServices = selectedMonth 
      ? services.filter(service => isSameMonth(new Date(service.start_date), selectedMonth))
      : services;
    
    const summary = {
      paid: 0,
      pending: 0,
      canceled: 0,
      paidTotal: 0,
      pendingTotal: 0,
      canceledTotal: 0
    };

    filteredServices.forEach(service => {
      switch (service.payment_status) {
        case 'paid':
          summary.paid++;
          summary.paidTotal += service.amount;
          break;
        case 'pending':
          summary.pending++;
          summary.pendingTotal += service.amount;
          break;
        case 'canceled':
          summary.canceled++;
          summary.canceledTotal += service.amount;
          break;
      }
    });

    return summary;
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleCopyLink = () => {
    if (shareUrlRef.current) {
      shareUrlRef.current.select();
      navigator.clipboard.writeText(shareUrlRef.current.value);
      setCopied(true);
      toast.success("Link copiado para a área de transferência!");
      
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    }
  };

  const getShareableUrl = () => {
    const baseUrl = window.location.origin;
    const clientNameSlug = client?.name 
      ? encodeURIComponent(client.name.toLowerCase().replace(/\s+/g, '-')) 
      : '';
      
    return `${baseUrl}/client-portal?client=${clientId}&public=true&name=${clientNameSlug}`;
  };

  const getFriendlyUrl = () => {
    const baseUrl = window.location.origin;
    const clientNameSlug = client?.name 
      ? encodeURIComponent(client.name.toLowerCase().replace(/\s+/g, '-')) 
      : '';
      
    return `${baseUrl}/client-portal?name=${clientNameSlug}&public=true`;
  };

  const ServiceCard = ({ service }: { service: ClientService }) => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4">
        <div className="flex justify-between items-start mb-2">
          <div className="font-medium">{service.company_name}</div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            service.payment_status === 'paid' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
              : service.payment_status === 'canceled'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
          }`}>
            {service.payment_status === 'paid' 
              ? 'Pago' 
              : service.payment_status === 'canceled'
              ? 'Cancelado'
              : 'Pendente'}
          </span>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {format(new Date(service.start_date), "dd/MM/yyyy")}
        </div>
        <div className="mb-2">{service.service_description}</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Etapa:</span> {service.stage}
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Situação:</span> {service.status}
          </div>
          <div className="col-span-2">
            <span className="text-gray-500 dark:text-gray-400">Valor:</span>{' '}
            <span className="font-semibold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(service.amount)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const handleMonthSelect = (date: Date | undefined) => {
    setSelectedMonth(date);
    setCalendarOpen(false);
  };

  const clearMonthFilter = () => {
    setSelectedMonth(undefined);
  };

  const filteredServices = selectedMonth
    ? services.filter(service => isSameMonth(new Date(service.start_date), selectedMonth))
    : services;

  useEffect(() => {
    const summary = calculatePaymentSummary(services);
    setPaymentSummary(summary);
  }, [selectedMonth, services]);

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 flex justify-center items-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center w-full">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded w-full max-w-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Portal do Cliente</h1>
          {!isPublic && (
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">
              Gerencie e compartilhe informações com seu cliente
            </p>
          )}
          {isPublic && (
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">
              Sistema para gerenciamento eficiente com produtividade e propósito
            </p>
          )}
        </div>
        {!isPublic && (
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        )}
      </div>
      
      <Card className="p-4 md:p-6 border shadow-sm dark:bg-gray-900/60 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-semibold">
              {client?.name || "Cliente"}
            </h2>
            <div className="flex flex-wrap gap-2 md:gap-3 mt-2 md:mt-3">
              <div className="bg-green-100 dark:bg-green-900/30 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs">
                <span className="text-xs text-green-800 dark:text-green-300 font-medium">Pagos:</span> 
                <span className="ml-1 text-xs md:text-sm font-bold text-green-800 dark:text-green-300">{paymentSummary.paid}</span>
                <span className="md:ml-2 ml-1 text-xs text-green-800 dark:text-green-300">
                  ({new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(paymentSummary.paidTotal)})
                </span>
              </div>
              <div className="bg-orange-100 dark:bg-orange-900/30 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs">
                <span className="text-xs text-orange-800 dark:text-orange-300 font-medium">Pendentes:</span> 
                <span className="ml-1 text-xs md:text-sm font-bold text-orange-800 dark:text-orange-300">{paymentSummary.pending}</span>
                <span className="md:ml-2 ml-1 text-xs text-orange-800 dark:text-orange-300">
                  ({new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(paymentSummary.pendingTotal)})
                </span>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs">
                <span className="text-xs text-yellow-800 dark:text-yellow-300 font-medium">Cancelados:</span> 
                <span className="ml-1 text-xs md:text-sm font-bold text-yellow-800 dark:text-yellow-300">{paymentSummary.canceled}</span>
                <span className="md:ml-2 ml-1 text-xs text-yellow-800 dark:text-yellow-300">
                  ({new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(paymentSummary.canceledTotal)})
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPublic && (
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                Visualização pública
              </div>
            )}
            
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn(
                    selectedMonth ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "",
                    "gap-2"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {selectedMonth 
                    ? format(selectedMonth, "MMMM yyyy", { locale: ptBR }) 
                    : "Filtrar por mês"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedMonth}
                  onSelect={handleMonthSelect}
                  initialFocus
                  className="pointer-events-auto"
                  locale={ptBR}
                  captionLayout="dropdown-buttons"
                  fromYear={2020}
                  toYear={2030}
                  modifiers={{ disabled: [{ before: new Date(2020, 0) }] }}
                  modifiersStyles={{ disabled: { display: 'none' } }}
                />
                {selectedMonth && (
                  <div className="p-2 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={clearMonthFilter}
                      className="text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Limpar filtro
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {selectedMonth && (
          <div className="mb-4 p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-md flex items-center justify-between">
            <div className="text-sm text-indigo-600 dark:text-indigo-300">
              Mostrando serviços de {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearMonthFilter}
              className="h-7 px-2 text-indigo-600 dark:text-indigo-300 hover:text-indigo-700"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          </div>
        )}
        
        {isMobile && (
          <div className="md:hidden space-y-4">
            {filteredServices.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                {selectedMonth 
                  ? `Nenhum serviço encontrado para ${format(selectedMonth, "MMMM yyyy", { locale: ptBR })}`
                  : "Nenhum serviço encontrado para este cliente"
                }
              </div>
            ) : (
              filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))
            )}
          </div>
        )}
        
        {!isMobile && (
          <div className="hidden md:block overflow-x-auto">
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
                {filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                      {selectedMonth 
                        ? `Nenhum serviço encontrado para ${format(selectedMonth, "MMMM yyyy", { locale: ptBR })}`
                        : "Nenhum serviço encontrado para este cliente"
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((service) => (
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.payment_status === 'paid' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : service.payment_status === 'canceled'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                        }`}>
                          {service.payment_status === 'paid' 
                            ? 'Pago' 
                            : service.payment_status === 'canceled'
                            ? 'Cancelado'
                            : 'Pendente'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
        
        {isPublic && (
          <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Esta é uma visualização pública compartilhada por {client?.email}. Quaisquer atualizações 
              feitas pelo profissional serão refletidas automaticamente nesta página.
            </p>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-2">
              DilQ Orbe - Sistema para gerenciamento eficiente com produtividade e propósito
            </p>
          </div>
        )}
      </Card>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md max-w-[90vw] rounded-lg">
          <DialogHeader>
            <DialogTitle>Compartilhar portal do cliente</DialogTitle>
            <DialogDescription>
              Qualquer pessoa com o link abaixo poderá visualizar os serviços deste cliente sem precisar fazer login.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Link com ID do cliente:</p>
              <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                  <Input
                    ref={shareUrlRef}
                    readOnly
                    className="w-full"
                    value={getShareableUrl()}
                  />
                </div>
                <Button size="sm" className="px-3" onClick={handleCopyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="sr-only">Copiar</span>
                </Button>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Link amigável (com nome do cliente):</p>
              <div className="flex items-center space-x-2">
                <div className="grid flex-1 gap-2">
                  <Input
                    readOnly
                    className="w-full"
                    value={getFriendlyUrl()}
                  />
                </div>
                <Button 
                  size="sm" 
                  className="px-3" 
                  onClick={() => {
                    navigator.clipboard.writeText(getFriendlyUrl());
                    toast.success("Link amigável copiado!");
                  }}
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copiar</span>
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Este link usa o nome do cliente em vez do ID, ficando mais amigável e legível.
              </p>
            </div>
          </div>
          <DialogFooter className="flex items-center border-t pt-4 mt-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <Link className="h-4 w-4 mr-2" />
              O link será atualizado automaticamente quando houver novas informações
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
