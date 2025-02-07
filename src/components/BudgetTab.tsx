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
import { FilePlus, FileText, Printer, Eye, Trash2, Upload } from "lucide-react";
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

  useEffect(() => {
    fetchBudgets();
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
          <title>Orçamento - ${budget.client_name || 'Sem nome'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-info { margin-bottom: 20px; }
            .company-logo { max-width: 200px; max-height: 100px; }
            .section { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .total { font-weight: bold; text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            ${budget.company_logo ? `<img src="${budget.company_logo}" class="company-logo" alt="Logo da empresa"/>` : ''}
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

      const blob = new Blob([content], { type: 'text/html' });
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orçamentos</h2>
          <p className="text-muted-foreground">
            Gerencie seus orçamentos e propostas comerciais
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowForm(false)}>
            <FileText className="mr-2 h-4 w-4" />
            Ver Lista
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <FilePlus className="mr-2 h-4 w-4" />
            Novo Orçamento
          </Button>
        </div>
      </div>

      {!showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Orçamentos</CardTitle>
            <CardDescription>
              Visualize e gerencie todos os seus orçamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {budgets.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum orçamento encontrado. Clique em "Novo Orçamento" para criar um.
                </p>
              ) : (
                budgets.map((budget) => (
                  <Card key={budget.id}>
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
                            {new Date(budget.valid_until).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Valor Total</Label>
                          <p className="font-medium">{formatCurrency(budget.total_amount)}</p>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4 space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewBudget(budget)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar/PDF
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
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
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>
                Configure as informações da sua empresa que aparecerão no orçamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input 
                    id="name" 
                    placeholder="Nome ou razão social" 
                    value={companyData.name}
                    onChange={handleCompanyDataChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document">CNPJ</Label>
                  <Input 
                    id="document" 
                    placeholder="Digite o CNPJ" 
                    value={companyData.document}
                    onChange={handleCompanyDataChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone" 
                    placeholder="(00) 00000-0000" 
                    value={companyData.phone}
                    onChange={handleCompanyDataChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input 
                    id="address" 
                    placeholder="Endereço completo" 
                    value={companyData.address}
                    onChange={handleCompanyDataChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Logo da Empresa</Label>
                <div className="flex items-center gap-4">
                  {companyData.logo && (
                    <img 
                      src={companyData.logo} 
                      alt="Logo da empresa" 
                      className="h-12 w-auto object-contain"
                    />
                  )}
                  <Label 
                    htmlFor="logo-upload" 
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
              <CardDescription>
                Preencha os dados do cliente para o orçamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Cliente</Label>
                  <Input 
                    id="name" 
                    placeholder="Nome completo ou razão social" 
                    value={clientData.name}
                    onChange={handleClientDataChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document">CPF/CNPJ</Label>
                  <Input 
                    id="document" 
                    placeholder="Digite o documento" 
                    value={clientData.document}
                    onChange={handleClientDataChange}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input 
                    id="phone" 
                    placeholder="(00) 00000-0000" 
                    value={clientData.phone}
                    onChange={handleClientDataChange}
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
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Orçamento</CardTitle>
              <CardDescription>
                Configure os itens e condições do orçamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Validade</Label>
                  <Input 
                    id="validUntil" 
                    type="date" 
                    value={budgetDetails.validUntil}
                    onChange={handleBudgetDetailsChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Condição de Pagamento</Label>
                  <Select value={budgetDetails.paymentTerms} onValueChange={handlePaymentTermsChange}>
                    <SelectTrigger>
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
                  <Label htmlFor="delivery">Prazo de Entrega</Label>
                  <Input 
                    id="delivery" 
                    placeholder="Ex: 30 dias úteis" 
                    value={budgetDetails.delivery}
                    onChange={handleBudgetDetailsChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Itens do Orçamento</Label>
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-4 mb-4 font-semibold">
                      <div className="col-span-5">Descrição</div>
                      <div className="col-span-2">Quantidade</div>
                      <div className="col-span-2">Valor Unit.</div>
                      <div className="col-span-2">Valor Total</div>
                      <div className="col-span-1"></div>
                    </div>
                    {items.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-4 items-center mb-2">
                        <div className="col-span-5">
                          <Input 
                            placeholder="Descrição do item"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input 
                            type="number" 
                            min="1" 
                            placeholder="Qtd"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
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
                          />
                        </div>
                        <div className="col-span-2">
                          <Input 
                            type="number" 
                            value={item.totalPrice.toFixed(2)} 
                            readOnly
                          />
                        </div>
                        <div className="col-span-1">
                          <Button variant="ghost" size="sm" onClick={addItem}>+</Button>
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 text-right">
                      <p className="font-semibold">Total: R$ {calculateTotal().toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Adicione informações importantes, termos e condições"
                  className="min-h-[100px]"
                  value={budgetDetails.notes}
                  onChange={handleBudgetDetailsChange}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                * Todos os campos são obrigatórios
              </div>
              <div className="space-x-2">
                <Button variant="outline">Cancelar</Button>
                <Button 
                  onClick={handleSaveBudget}
                  disabled={loading}
                >
                  {loading ? "Salvando..." : "Salvar Orçamento"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
