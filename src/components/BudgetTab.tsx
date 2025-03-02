
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  FilePlus, 
  FileText, 
  Printer, 
  Eye, 
  Trash2, 
  Upload, 
  Building2, 
  User, 
  ClipboardList,
  Calendar,
  CreditCard,
  Clock,
  PanelRight,
  Plus,
  Sparkles 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { formatCurrency } from "@/lib/utils";

interface BudgetItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Budget {
  id: string;
  client_name?: string;
  client_document?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  company_logo?: string;
  company_name?: string;
  company_phone?: string;
  company_address?: string;
  company_document?: string;
  total_amount: number;
  created_at: string;
  valid_until?: string;
  payment_terms?: string;
  delivery_time?: string;
  items: string | Database['public']['Tables']['budgets']['Row']['items'];
  notes?: string;
}

export function BudgetTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [clientData, setClientData] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    address: '',
  });
  const [companyData, setCompanyData] = useState({
    name: '',
    document: '',
    phone: '',
    address: '',
    logo: '',
  });
  const [budgetDetails, setBudgetDetails] = useState({
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentTerms: '',
    delivery: '',
    notes: '',
  });
  const [items, setItems] = useState<BudgetItem[]>([{
    description: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0,
  }]);
  const [formTab, setFormTab] = useState('company');

  useEffect(() => {
    fetchBudgets();
    fetchCompanyLogo();
  }, []);

  const fetchBudgets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar orçamentos",
        description: "Não foi possível carregar a lista de orçamentos.",
        duration: 5000,
      });
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
        setCompanyData(prev => ({
          ...prev,
          logo: data.company_logo || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching company logo:', error);
    }
  };

  const handleClientDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setClientData({
      ...clientData,
      [e.target.id]: e.target.value,
    });
  };

  const handleCompanyDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCompanyData({
      ...companyData,
      [e.target.id]: e.target.value,
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          variant: "destructive",
          title: "Erro de autenticação",
          description: "Você precisa estar logado para fazer upload de arquivos.",
          duration: 5000,
        });
        return;
      }
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      setCompanyData(prev => ({
        ...prev,
        logo: publicUrl,
      }));

      toast({
        title: "Logo enviada com sucesso!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar logo",
        description: "Não foi possível enviar a imagem. Tente novamente.",
        duration: 5000,
      });
    }
  };

  const handleItemChange = (index: number, field: keyof BudgetItem, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index] };
    
    if (field === 'quantity' || field === 'unitPrice') {
      item[field] = Number(value);
      item.totalPrice = item.quantity * item.unitPrice;
    } else {
      item[field as 'description'] = value as string;
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    }]);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleBudgetDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBudgetDetails({
      ...budgetDetails,
      [e.target.id]: e.target.value,
    });
  };

  const handlePaymentTermsChange = (value: string) => {
    setBudgetDetails({
      ...budgetDetails,
      paymentTerms: value,
    });
  };

  const handleSaveBudget = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const budgetData = {
        user_id: user.id,
        client_name: clientData.name,
        client_document: clientData.document,
        client_email: clientData.email,
        client_phone: clientData.phone,
        client_address: clientData.address,
        company_name: companyData.name,
        company_document: companyData.document,
        company_phone: companyData.phone,
        company_address: companyData.address,
        company_logo: companyData.logo,
        valid_until: budgetDetails.validUntil,
        payment_terms: budgetDetails.paymentTerms,
        delivery_time: budgetDetails.delivery,
        items: JSON.stringify(items),
        notes: budgetDetails.notes,
        total_amount: calculateTotal(),
      };

      const { error } = await supabase
        .from('budgets')
        .insert(budgetData);

      if (error) throw error;

      toast({
        title: "Orçamento salvo com sucesso!",
        description: "O orçamento foi salvo e pode ser visualizado na lista abaixo.",
        duration: 5000,
      });

      // Reset form
      setClientData({
        name: '',
        document: '',
        email: '',
        phone: '',
        address: '',
      });
      setCompanyData({
        name: '',
        document: '',
        phone: '',
        address: '',
        logo: '',
      });
      setBudgetDetails({
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentTerms: '',
        delivery: '',
        notes: '',
      });
      setItems([{
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      }]);
      setShowForm(false);
      fetchBudgets();

    } catch (error) {
      console.error('Error saving budget:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar orçamento",
        description: "Ocorreu um erro ao tentar salvar o orçamento. Tente novamente.",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);

      if (error) throw error;

      toast({
        title: "Orçamento excluído com sucesso!",
        description: "O orçamento foi removido da sua lista.",
        duration: 5000,
      });

      fetchBudgets(); // Refresh the list
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir orçamento",
        description: "Não foi possível excluir o orçamento. Tente novamente.",
        duration: 5000,
      });
    }
  };

  const handleViewBudget = async (budget: Budget) => {
    try {
      const items = typeof budget.items === 'string' ? JSON.parse(budget.items) : budget.items;
      
      const content = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Orçamento - ${budget.client_name || 'Sem nome'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-info { margin-bottom: 20px; }
            .company-logo { max-width: 200px; max-height: 100px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .total { font-weight: bold; text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            ${companyLogo ? `<img src="${companyLogo}" class="company-logo" alt="Logo da empresa"/>` : ''}
            <h1>Orçamento</h1>
            <p>Data: ${new Date(budget.created_at).toLocaleDateString('pt-BR')}</p>
          </div>
          
          <div class="company-info">
            <h2>Dados da Empresa</h2>
            ${budget.company_name ? `<p><strong>Nome:</strong> ${budget.company_name}</p>` : ''}
            ${budget.company_document ? `<p><strong>CNPJ:</strong> ${budget.company_document}</p>` : ''}
            ${budget.company_phone ? `<p><strong>Telefone:</strong> ${budget.company_phone}</p>` : ''}
            ${budget.company_address ? `<p><strong>Endereço:</strong> ${budget.company_address}</p>` : ''}
          </div>

          <div class="section">
            <h2>Dados do Cliente</h2>
            ${budget.client_name ? `<p><strong>Nome:</strong> ${budget.client_name}</p>` : ''}
            ${budget.client_document ? `<p><strong>Documento:</strong> ${budget.client_document}</p>` : ''}
            ${budget.client_email ? `<p><strong>Email:</strong> ${budget.client_email}</p>` : ''}
            ${budget.client_phone ? `<p><strong>Telefone:</strong> ${budget.client_phone}</p>` : ''}
            ${budget.client_address ? `<p><strong>Endereço:</strong> ${budget.client_address}</p>` : ''}
          </div>

          <div class="section">
            <h2>Itens do Orçamento</h2>
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Quantidade</th>
                  <th>Valor Unitário</th>
                  <th>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                ${Array.isArray(items) ? items.map((item: BudgetItem) => `
                  <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.unitPrice)}</td>
                    <td>${formatCurrency(item.totalPrice)}</td>
                  </tr>
                `).join('') : ''}
              </tbody>
            </table>
            <div class="total">
              <p>Total: ${formatCurrency(budget.total_amount)}</p>
            </div>
          </div>

          <div class="section">
            <h2>Condições</h2>
            ${budget.valid_until ? `<p><strong>Validade:</strong> ${new Date(budget.valid_until).toLocaleDateString('pt-BR')}</p>` : ''}
            ${budget.payment_terms ? `<p><strong>Forma de Pagamento:</strong> ${budget.payment_terms}</p>` : ''}
            ${budget.delivery_time ? `<p><strong>Prazo de Entrega:</strong> ${budget.delivery_time}</p>` : ''}
            ${budget.notes ? `<p><strong>Observações:</strong> ${budget.notes}</p>` : ''}
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error('Error viewing budget:', error);
      toast({
        variant: "destructive",
        title: "Erro ao visualizar orçamento",
        description: "Não foi possível gerar a visualização do orçamento.",
        duration: 5000,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 backdrop-blur-sm">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-purple-500/10 filter blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/10 filter blur-3xl"></div>
        
        <div className="relative flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ClipboardList className="h-7 w-7 text-dilq-purple animate-float" />
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-dilq-indigo to-dilq-purple bg-clip-text text-transparent">
                Orçamentos
              </h2>
            </div>
            <p className="text-muted-foreground">
              Gerencie seus orçamentos e propostas comerciais
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowForm(false)}
              className="border-indigo-200 hover:border-indigo-400 transition-all duration-300"
            >
              <FileText className="mr-2 h-4 w-4" />
              Ver Lista
            </Button>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-dilq-indigo to-dilq-purple hover:from-dilq-indigo/90 hover:to-dilq-purple/90 text-white transition-all duration-300"
            >
              <FilePlus className="mr-2 h-4 w-4" />
              Novo Orçamento
            </Button>
          </div>
        </div>
      </div>

      {!showForm ? (
        <Card className="border border-gray-100 shadow-sm overflow-hidden backdrop-blur-sm transition-all duration-300 hover:shadow-md">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              Lista de Orçamentos
            </CardTitle>
            <CardDescription>
              Visualize e gerencie todos os seus orçamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4">
              {budgets.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 border border-dashed border-gray-200 rounded-xl">
                  <div className="flex justify-center mb-3">
                    <ClipboardList className="h-12 w-12 text-gray-300" />
                  </div>
                  <p className="mb-2">Nenhum orçamento encontrado.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowForm(true)}
                    className="mt-2"
                  >
                    <FilePlus className="mr-2 h-4 w-4" />
                    Criar Orçamento
                  </Button>
                </div>
              ) : (
                budgets.map((budget) => (
                  <Card key={budget.id} className="group overflow-hidden border-gray-100 hover:border-indigo-200 transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-5 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">Cliente</Label>
                          <p className="font-medium">{budget.client_name}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">CPF/CNPJ</Label>
                          <p className="font-medium">{budget.client_document}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Data</Label>
                          <p className="font-medium">
                            {new Date(budget.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Validade</Label>
                          <p className="font-medium">
                            {budget.valid_until ? new Date(budget.valid_until).toLocaleDateString('pt-BR') : '-'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Valor Total</Label>
                          <p className="font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {formatCurrency(budget.total_amount)}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4 space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewBudget(budget)}
                          className="border-indigo-200 hover:border-indigo-400 text-indigo-600 transition-all duration-300"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar/Imprimir
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-red-200 hover:border-red-400 text-red-600 transition-all duration-300"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteBudget(budget.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="border border-indigo-100/50 shadow-sm overflow-hidden transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-100/50">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                Novo Orçamento
              </CardTitle>
              <CardDescription>
                Preencha os dados para gerar um novo orçamento
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={formTab} onValueChange={setFormTab} className="w-full">
                <TabsList className="mb-6 grid grid-cols-4 w-full bg-indigo-50/50">
                  <TabsTrigger
                    value="company"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Empresa
                  </TabsTrigger>
                  <TabsTrigger
                    value="client"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Cliente
                  </TabsTrigger>
                  <TabsTrigger
                    value="items"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Itens
                  </TabsTrigger>
                  <TabsTrigger
                    value="terms"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                  >
                    <PanelRight className="mr-2 h-4 w-4" />
                    Condições
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="company" className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Empresa</Label>
                    <Input 
                      id="name" 
                      placeholder="Nome ou razão social" 
                      value={companyData.name}
                      onChange={handleCompanyDataChange}
                      className="focus:border-indigo-300 focus:ring-indigo-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="document">CNPJ</Label>
                      <Input 
                        id="document" 
                        placeholder="Digite o CNPJ" 
                        value={companyData.document}
                        onChange={handleCompanyDataChange}
                        className="focus:border-indigo-300 focus:ring-indigo-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input 
                        id="phone" 
                        placeholder="(00) 00000-0000" 
                        value={companyData.phone}
                        onChange={handleCompanyDataChange}
                        className="focus:border-indigo-300 focus:ring-indigo-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input 
                      id="address" 
                      placeholder="Endereço completo" 
                      value={companyData.address}
                      onChange={handleCompanyDataChange}
                      className="focus:border-indigo-300 focus:ring-indigo-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Logo da Empresa</Label>
                    <div className="flex items-center gap-4">
                      {companyData.logo && (
                        <div className="relative h-16 w-24 overflow-hidden rounded-md border">
                          <img 
                            src={companyData.logo} 
                            alt="Logo da empresa" 
                            className="h-full w-full object-contain"
                          />
                        </div>
                      )}
                      <Label 
                        htmlFor="logo-upload" 
                        className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        <Upload className="h-4 w-4" />
                        Enviar Logo
                      </Label>
                      <Input 
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between pt-4">
                    <div></div>
                    <Button 
                      onClick={() => setFormTab('client')}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      Próximo
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="client" className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Cliente</Label>
                      <Input 
                        id="name" 
                        placeholder="Nome completo ou razão social" 
                        value={clientData.name}
                        onChange={handleClientDataChange}
                        className="focus:border-indigo-300 focus:ring-indigo-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="document">CPF/CNPJ</Label>
                      <Input 
                        id="document" 
                        placeholder="Digite o documento" 
                        value={clientData.document}
                        onChange={handleClientDataChange}
                        className="focus:border-indigo-300 focus:ring-indigo-200"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="email@exemplo.com" 
                        value={clientData.email}
                        onChange={handleClientDataChange}
                        className="focus:border-indigo-300 focus:ring-indigo-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input 
                        id="phone" 
                        placeholder="(00) 00000-0000" 
                        value={clientData.phone}
                        onChange={handleClientDataChange}
                        className="focus:border-indigo-300 focus:ring-indigo-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço Completo</Label>
                    <Textarea 
                      id="address" 
                      placeholder="Digite o endereço completo" 
                      value={clientData.address}
                      onChange={handleClientDataChange}
                      className="focus:border-indigo-300 focus:ring-indigo-200"
                    />
                  </div>
                  <div className="flex justify-between pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setFormTab('company')}
                      className="border-indigo-200 hover:border-indigo-400"
                    >
                      Anterior
                    </Button>
                    <Button 
                      onClick={() => setFormTab('items')}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      Próximo
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="items" className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-lg font-semibold">Itens do Orçamento</Label>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={addItem}
                        className="border-indigo-200 hover:border-indigo-400 text-indigo-600"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Item
                      </Button>
                    </div>
                    
                    <div className="rounded-lg border overflow-hidden">
                      <div className="bg-indigo-50/50 p-4 grid grid-cols-12 gap-4 font-medium text-sm text-indigo-900">
                        <div className="col-span-5">Descrição</div>
                        <div className="col-span-2">Quantidade</div>
                        <div className="col-span-2">Valor Unitário</div>
                        <div className="col-span-2">Valor Total</div>
                        <div className="col-span-1"></div>
                      </div>
                      
                      <div className="p-4 space-y-3">
                        {items.map((item, index) => (
                          <div key={index} className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-5">
                              <Input 
                                placeholder="Descrição do item"
                                value={item.description}
                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                className="focus:border-indigo-300 focus:ring-indigo-200"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input 
                                type="number" 
                                min="1" 
                                placeholder="Qtd"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                className="focus:border-indigo-300 focus:ring-indigo-200"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input 
                                type="number" 
                                step="0.01" 
                                min="0" 
                                placeholder="R$ 0,00"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                className="focus:border-indigo-300 focus:ring-indigo-200"
                              />
                            </div>
                            <div className="col-span-2">
                              <Input 
                                type="text" 
                                value={formatCurrency(item.totalPrice)} 
                                readOnly
                                className="bg-gray-50"
                              />
                            </div>
                            <div className="col-span-1 text-center">
                              {index === items.length - 1 && items.length > 1 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => {
                                    const newItems = [...items];
                                    newItems.splice(index, 1);
                                    setItems(newItems);
                                  }}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 flex justify-end">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-500 mb-1">Total do Orçamento</div>
                          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            {formatCurrency(calculateTotal())}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setFormTab('client')}
                      className="border-indigo-200 hover:border-indigo-400"
                    >
                      Anterior
                    </Button>
                    <Button 
                      onClick={() => setFormTab('terms')}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    >
                      Próximo
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="terms" className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="validUntil" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-500" />
                        Validade
                      </Label>
                      <Input 
                        id="validUntil" 
                        type="date" 
                        value={budgetDetails.validUntil}
                        onChange={handleBudgetDetailsChange}
                        className="focus:border-indigo-300 focus:ring-indigo-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentTerms" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-indigo-500" />
                        Condição de Pagamento
                      </Label>
                      <Select value={budgetDetails.paymentTerms} onValueChange={handlePaymentTermsChange}>
                        <SelectTrigger className="focus:ring-indigo-200">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vista">À Vista</SelectItem>
                          <SelectItem value="30dias">30 Dias</SelectItem>
                          <SelectItem value="2x">2x Sem Juros</SelectItem>
                          <SelectItem value="3x">3x Sem Juros</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delivery" className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-indigo-500" />
                        Prazo de Entrega
                      </Label>
                      <Input 
                        id="delivery" 
                        placeholder="Ex: 30 dias úteis" 
                        value={budgetDetails.delivery}
                        onChange={handleBudgetDetailsChange}
                        className="focus:border-indigo-300 focus:ring-indigo-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="flex items-center gap-2">
                      <PanelRight className="h-4 w-4 text-indigo-500" />
                      Observações
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Adicione informações importantes, termos e condições"
                      className="min-h-[150px] focus:border-indigo-300 focus:ring-indigo-200"
                      value={budgetDetails.notes}
                      onChange={handleBudgetDetailsChange}
                    />
                  </div>
                  
                  <div className="flex justify-between pt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setFormTab('items')}
                      className="border-indigo-200 hover:border-indigo-400"
                    >
                      Anterior
                    </Button>
                    <div className="space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowForm(false)}
                        className="border-indigo-200 hover:border-indigo-400"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleSaveBudget}
                        disabled={loading}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Salvar Orçamento
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
