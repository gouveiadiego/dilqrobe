import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, User, FileText, Settings, Save, X, Package, Wrench, Check } from "lucide-react";
import { BudgetItemsForm } from "./BudgetItemsForm";
import { ServiceItemsForm } from "./ServiceItemsForm";
import { BudgetItem, BudgetType, NewBudget, EMPTY_BUDGET } from "./types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BudgetFormProps {
  initialData?: Omit<NewBudget, 'user_id'>;
  onSubmit: (data: Omit<NewBudget, 'user_id'>) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export function BudgetForm({ initialData, onSubmit, onCancel, isEditing = false }: BudgetFormProps) {
  const [formData, setFormData] = useState<Omit<NewBudget, 'user_id'>>(initialData || EMPTY_BUDGET);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEditing) return;
    const hasCompanyData = !!(formData.company_name || formData.company_document || formData.company_address || formData.company_phone);
    if (hasCompanyData) return;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_name, company_cnpj, company_address, company_logo')
        .eq('id', user.id)
        .maybeSingle();
      if (!profile) return;
      setFormData((prev) => ({
        ...prev,
        company_name: prev.company_name || profile.company_name || "",
        company_document: prev.company_document || profile.company_cnpj || "",
        company_address: prev.company_address || profile.company_address || "",
        company_logo: prev.company_logo || profile.company_logo || "",
      }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { tab: string; message: string }[] = [];

    if (!formData.client_name.trim()) {
      errors.push({ tab: 'Cliente', message: 'Informe o nome do cliente' });
    }
    if (formData.items.length === 0) {
      errors.push({ tab: 'Itens', message: 'Adicione pelo menos um item ao orçamento' });
    } else {
      if (formData.budget_type === 'products') {
        const invalid = formData.items.some(
          (i) => !i.description?.trim() || !i.quantity || i.quantity <= 0 || i.unit_price === undefined || i.unit_price < 0
        );
        if (invalid) errors.push({ tab: 'Itens', message: 'Preencha descrição, quantidade e valor unitário de todos os itens' });
      } else {
        const invalid = formData.items.some((i) => !i.description?.trim());
        if (invalid) errors.push({ tab: 'Itens', message: 'Preencha a descrição de todos os serviços' });
      }
    }
    if (!formData.valid_until) {
      errors.push({ tab: 'Condições', message: 'Informe a data de validade do orçamento' });
    }

    if (errors.length > 0) {
      const first = errors[0];
      toast.error(first.message, {
        description: errors.length > 1
          ? `${errors.length - 1} outro(s) campo(s) pendente(s). Verifique a aba "${first.tab}".`
          : `Verifique a aba "${first.tab}".`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleItemsChange = (items: BudgetItem[]) => {
    const totalAmount = items.reduce((sum, item) => {
      if (formData.budget_type === 'services') {
        return sum + (item.has_value ? Number(item.total || 0) : 0);
      }
      return sum + Number(item.total || 0);
    }, 0);
    setFormData({ ...formData, items, total_amount: totalAmount });
  };

  const changeBudgetType = (type: BudgetType) => {
    if (type === formData.budget_type) return;
    if (formData.items.length > 0) {
      const ok = window.confirm('Trocar o tipo de orçamento removerá os itens já adicionados. Deseja continuar?');
      if (!ok) return;
      setFormData({ ...formData, budget_type: type, items: [], total_amount: 0 });
      toast.info('Itens removidos ao trocar o tipo de orçamento');
      return;
    }
    setFormData({ ...formData, budget_type: type });
  };

  const updateField = (field: keyof Omit<NewBudget, 'user_id'>, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Budget type selector */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Tipo de orçamento</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => changeBudgetType('products')}
            className={cn(
              "relative text-left border rounded-lg p-4 transition-all hover:shadow-md",
              formData.budget_type === 'products'
                ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                : "border-border bg-card"
            )}
          >
            {formData.budget_type === 'products' && (
              <Check className="absolute top-3 right-3 h-4 w-4 text-primary" />
            )}
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-5 w-5 text-primary" />
              <span className="font-semibold">Produtos / Itens</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Lista com Quantidade × Valor Unitário e total automático.
            </p>
          </button>
          <button
            type="button"
            onClick={() => changeBudgetType('services')}
            className={cn(
              "relative text-left border rounded-lg p-4 transition-all hover:shadow-md",
              formData.budget_type === 'services'
                ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                : "border-border bg-card"
            )}
          >
            {formData.budget_type === 'services' && (
              <Check className="absolute top-3 right-3 h-4 w-4 text-primary" />
            )}
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="h-5 w-5 text-primary" />
              <span className="font-semibold">Serviços</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Descrição livre de cada serviço, com valor opcional por item.
            </p>
          </button>
        </div>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="client" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Cliente</span>
          </TabsTrigger>
          <TabsTrigger value="items" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Itens</span>
          </TabsTrigger>
          <TabsTrigger value="conditions" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Condições</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dados da Sua Empresa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nome da Empresa</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => updateField('company_name', e.target.value)}
                    placeholder="Sua Empresa LTDA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_document">CNPJ</Label>
                  <Input
                    id="company_document"
                    value={formData.company_document}
                    onChange={(e) => updateField('company_document', e.target.value)}
                    placeholder="00.000.000/0001-00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_address">Endereço</Label>
                <Input
                  id="company_address"
                  value={formData.company_address}
                  onChange={(e) => updateField('company_address', e.target.value)}
                  placeholder="Rua, Número, Bairro - Cidade/UF"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_phone">Telefone</Label>
                <Input
                  id="company_phone"
                  value={formData.company_phone}
                  onChange={(e) => updateField('company_phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Tab */}
        <TabsContent value="client" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Nome do Cliente *</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => updateField('client_name', e.target.value)}
                    placeholder="Nome do cliente ou empresa"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_document">CPF/CNPJ</Label>
                  <Input
                    id="client_document"
                    value={formData.client_document}
                    onChange={(e) => updateField('client_document', e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_email">Email</Label>
                  <Input
                    id="client_email"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => updateField('client_email', e.target.value)}
                    placeholder="cliente@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_phone">Telefone</Label>
                  <Input
                    id="client_phone"
                    value={formData.client_phone}
                    onChange={(e) => updateField('client_phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_address">Endereço</Label>
                <Input
                  id="client_address"
                  value={formData.client_address}
                  onChange={(e) => updateField('client_address', e.target.value)}
                  placeholder="Endereço completo do cliente"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="mt-6">
          <Card>
            <CardContent className="pt-6">
              {formData.budget_type === 'services' ? (
                <ServiceItemsForm
                  items={formData.items}
                  onItemsChange={handleItemsChange}
                />
              ) : (
                <BudgetItemsForm
                  items={formData.items}
                  onItemsChange={handleItemsChange}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conditions Tab */}
        <TabsContent value="conditions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Condições Comerciais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery_time">Prazo de Entrega</Label>
                  <Input
                    id="delivery_time"
                    value={formData.delivery_time}
                    onChange={(e) => updateField('delivery_time', e.target.value)}
                    placeholder="Ex: 15 dias úteis"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Condições de Pagamento</Label>
                  <Input
                    id="payment_terms"
                    value={formData.payment_terms}
                    onChange={(e) => updateField('payment_terms', e.target.value)}
                    placeholder="Ex: 50% entrada + 50% entrega"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valid_until">Válido Até *</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => updateField('valid_until', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Informações adicionais, termos e condições, escopo detalhado..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="gap-2">
          <X className="h-4 w-4" />
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Orçamento' : 'Criar Orçamento'}
        </Button>
      </div>
    </form>
  );
}
