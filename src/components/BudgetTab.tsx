
import React, { useState } from 'react';
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
import { FilePlus, FileText, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BudgetItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export function BudgetTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clientData, setClientData] = useState({
    name: '',
    document: '',
    email: '',
    phone: '',
    address: '',
  });
  const [budgetDetails, setBudgetDetails] = useState({
    validUntil: '',
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

  const handleClientDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setClientData({
      ...clientData,
      [e.target.id]: e.target.value,
    });
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
        valid_until: budgetDetails.validUntil,
        payment_terms: budgetDetails.paymentTerms,
        delivery_time: budgetDetails.delivery,
        items: items,
        notes: budgetDetails.notes,
        total_amount: calculateTotal(),
      };

      const { error } = await supabase
        .from('budgets')
        .insert(budgetData);

      if (error) throw error;

      toast({
        title: "Orçamento salvo com sucesso!",
        description: "O orçamento foi cadastrado no sistema.",
      });

      // Reset form
      setClientData({
        name: '',
        document: '',
        email: '',
        phone: '',
        address: '',
      });
      setBudgetDetails({
        validUntil: '',
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

    } catch (error) {
      console.error('Error saving budget:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar orçamento",
        description: "Ocorreu um erro ao tentar salvar o orçamento. Tente novamente.",
      });
    } finally {
      setLoading(false);
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
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Visualizar
          </Button>
          <Button variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
          <Button>
            <FilePlus className="mr-2 h-4 w-4" />
            Novo Orçamento
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
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
    </div>
  );
}
