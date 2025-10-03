import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase, removeDuplicateTransactions } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CategorySelector } from "./finance/CategorySelector";
import { SmartCategorySelector } from "./finance/SmartCategorySelector";
import { BankAccountSelector } from "./finance/BankAccountSelector";
import { useCategories } from "@/hooks/useCategories";

interface Transaction {
  id: string;
  date: string;
  description: string;
  received_from: string;
  category: string;
  amount: number;
  payment_type: string;
  is_paid: boolean;
  recurring?: boolean;
  recurring_day?: number;
  installments?: number;
  bank_account_id?: string;
  recurrence_type?: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
}

interface NewTransactionFormProps {
  selectedFilter: string;
  onTransactionCreated: () => void;
  editingTransaction?: Transaction | null;
  onBankAccountUpdate?: () => void;
}

const getTransactionDefaults = (selectedFilter: string) => {
  switch (selectedFilter) {
    case "recebimentos":
      return { category: "income", isIncome: true };
    case "despesas-fixas":
      return { category: "fixed", isIncome: false };
    case "despesas-variaveis":
      return { category: "variable", isIncome: false };
    case "pessoas":
      return { category: "people", isIncome: false };
    case "impostos":
      return { category: "taxes", isIncome: false };
    case "transferencias":
      return { category: "transfer", isIncome: false };
    default:
      return { category: "income", isIncome: true };
  }
};

export const NewTransactionForm = ({ selectedFilter, onTransactionCreated, editingTransaction, onBankAccountUpdate }: NewTransactionFormProps) => {
  const { categories, addCategory } = useCategories();
  
  useEffect(() => {
    console.log("NewTransactionForm - Available categories:", categories);
  }, [categories]);

  // Helper function to get local date in YYYY-MM-DD format
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    date: getLocalDateString(),
    description: '',
    received_from: '',
    amount: '',
    payment_type: '',
    category: getTransactionDefaults(selectedFilter).category,
    is_paid: false,
    recurring: false,
    recurring_day: '',
    installments: '12',
    bank_account_id: '',
    recurrence_type: 'monthly' as 'monthly' | 'quarterly' | 'semiannual' | 'annual',
  });

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        date: editingTransaction.date,
        description: editingTransaction.description,
        received_from: editingTransaction.received_from,
        amount: Math.abs(editingTransaction.amount).toString(),
        payment_type: editingTransaction.payment_type,
        category: editingTransaction.category,
        is_paid: editingTransaction.is_paid,
        recurring: false,
        recurring_day: '',
        installments: '12',
        bank_account_id: editingTransaction?.bank_account_id || '',
        recurrence_type: editingTransaction.recurrence_type || 'monthly',
      });
    } else {
      setFormData(prev => ({
        ...prev,
        category: getTransactionDefaults(selectedFilter).category
      }));
    }
  }, [editingTransaction, selectedFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado para criar uma transação.");
        return;
      }

      // Detectar automaticamente se é receita ou despesa baseado na categoria
      const categoryData = categories.find(c => c.name === formData.category);
      const isIncome = categoryData?.type === "income" || 
                      formData.category === "income" || 
                      selectedFilter === "recebimentos";
      
      const amount = isIncome 
        ? Math.abs(Number(formData.amount))
        : -Math.abs(Number(formData.amount));

      const transactionData = {
        date: formData.date,
        description: formData.description,
        received_from: formData.received_from,
        amount,
        category: formData.category,
        payment_type: formData.payment_type,
        is_paid: formData.is_paid,
        recurring: formData.recurring,
        recurring_day: formData.recurring ? Number(formData.recurring_day) : null,
        recurrence_type: formData.recurring ? formData.recurrence_type : null,
        user_id: user.id
      };

      if (editingTransaction) {
        const { error } = await supabase
          .from("transactions")
          .update(transactionData)
          .eq('id', editingTransaction.id);

        if (error) throw error;
        toast.success("Transação atualizada com sucesso.");
      } else {
        const transactionDate = new Date(formData.date);
        const startOfDay = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
        const endOfDay = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate(), 23, 59, 59);
        
        const { data: existingTransactions, error: checkError } = await supabase
          .from("transactions")
          .select("id, description, received_from, payment_type, amount, date")
          .eq("description", formData.description)
          .eq("received_from", formData.received_from)
          .eq("payment_type", formData.payment_type)
          .eq("user_id", user.id)
          .gte("date", startOfDay.toISOString())
          .lte("date", endOfDay.toISOString());
          
        if (checkError) throw checkError;
        
        const amountToCheck = amount;
        const exactMatch = existingTransactions?.some(t => 
          Math.abs(t.amount - amountToCheck) < 0.01 && 
          t.date.substring(0, 10) === formData.date
        );
        
        if (existingTransactions && existingTransactions.length > 0 && exactMatch) {
          toast.warning("Uma transação idêntica já existe nesta data.");
          return;
        }
        
        const { data: newTransaction, error } = await supabase
          .from("transactions")
          .insert([transactionData])
          .select('id')
          .single();

        if (error) throw error;

        // Se for recorrente, criar transações para os próximos meses
        if (formData.recurring && formData.installments) {
          const installmentsCount = Number(formData.installments);
          const recurringTransactions = [];
          const baseDate = new Date(formData.date);
          const recurrenceType = formData.recurrence_type || 'monthly';
          
          console.log('🔄 Criando transações recorrentes:', {
            installmentsCount,
            recurrenceType,
            baseDate: baseDate.toISOString(),
            recurringDay: formData.recurring_day
          });
          
          // Calcular o incremento de meses baseado no tipo de recorrência
          let monthIncrement = 1;
          switch (recurrenceType) {
            case 'quarterly':
              monthIncrement = 3;
              break;
            case 'semiannual':
              monthIncrement = 6;
              break;
            case 'annual':
              monthIncrement = 12;
              break;
            default:
              monthIncrement = 1;
          }
          
          // Criar transações para os próximos períodos
          // A primeira transação já foi criada acima, então criamos installmentsCount - 1 adicionais
          for (let i = 1; i < installmentsCount; i++) {
            const nextDate = new Date(baseDate);
            nextDate.setMonth(baseDate.getMonth() + (i * monthIncrement));
            
            // Ajustar para o dia específico da recorrência
            const targetDay = Number(formData.recurring_day);
            const originalMonth = nextDate.getMonth();
            nextDate.setDate(targetDay);
            
            // Se mudou de mês (dia não existe), usar último dia do mês anterior
            if (nextDate.getMonth() !== originalMonth) {
              nextDate.setMonth(originalMonth + 1);
              nextDate.setDate(0);
            }
            
            const dateStr = nextDate.toISOString().split('T')[0];
            console.log(`📅 Criando parcela ${i + 1}/${installmentsCount} para ${dateStr}`);
            
            recurringTransactions.push({
              ...transactionData,
              date: dateStr,
              is_paid: false,
            });
          }
          
          console.log('📝 Total de transações a criar:', recurringTransactions.length);
          
          if (recurringTransactions.length > 0) {
            const { error: recurringError } = await supabase
              .from("transactions")
              .insert(recurringTransactions);
              
            if (recurringError) {
              console.error("❌ Error creating recurring transactions:", recurringError);
              toast.error("Transação criada, mas houve erro ao criar as recorrências");
            } else {
              console.log(`✅ ${recurringTransactions.length + 1} transações criadas com sucesso!`);
              toast.success(`Transação criada com ${installmentsCount} repetições!`);
            }
          }
        } else {
          toast.success("Transação criada com sucesso.");
        }
        
        await removeDuplicateTransactions();
        
        // Atualizar saldo das contas bancárias
        if (onBankAccountUpdate) {
          console.log('🔄 Atualizando saldo das contas bancárias...');
          onBankAccountUpdate();
        }
      }
      
      setFormData({
        date: getLocalDateString(),
        description: '',
        received_from: '',
        amount: '',
        payment_type: '',
        category: getTransactionDefaults(selectedFilter).category,
        is_paid: false,
        recurring: false,
        recurring_day: '',
        installments: '12',
        bank_account_id: '',
        recurrence_type: 'monthly',
      });

      onTransactionCreated();
    } catch (error) {
      console.error("Error creating/updating transaction:", error);
      toast.error(editingTransaction 
        ? "Não foi possível atualizar a transação."
        : "Não foi possível criar a transação."
      );
    }
  };

  const getPaymentTypeLabel = (paymentType: string): string => {
    switch (paymentType) {
      case "pix": return "PIX";
      case "credit": return "Cartão de Crédito";
      case "debit": return "Cartão de Débito";
      case "cash": return "Dinheiro";
      case "transfer": return "Transferência";
      default: return paymentType;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold mb-4">
        {editingTransaction ? "Editar Transação" : "Nova Transação"}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="received_from">
            {selectedFilter === "recebimentos" ? "Recebido de" : "Pago para"}
          </Label>
          <Input
            id="received_from"
            value={formData.received_from}
            onChange={(e) => setFormData(prev => ({ ...prev, received_from: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Valor</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment_type">Forma de Pagamento</Label>
          <Select
            value={formData.payment_type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, payment_type: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a forma de pagamento">
                {formData.payment_type ? getPaymentTypeLabel(formData.payment_type) : ""}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="credit">Cartão de Crédito</SelectItem>
              <SelectItem value="debit">Cartão de Débito</SelectItem>
              <SelectItem value="cash">Dinheiro</SelectItem>
              <SelectItem value="transfer">Transferência</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <SmartCategorySelector 
          value={formData.category}
          onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          selectedFilter={selectedFilter}
        />

        <BankAccountSelector
          value={formData.bank_account_id}
          onValueChange={(value) => setFormData(prev => ({ ...prev, bank_account_id: value }))}
          required={true}
        />

        <div className="space-y-2 col-span-full">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="recurring"
              checked={formData.recurring}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ 
                  ...prev, 
                  recurring: checked as boolean,
                  recurring_day: checked ? prev.recurring_day : ''
                }))
              }
            />
            <Label htmlFor="recurring">Transação Recorrente</Label>
          </div>
        </div>

        {formData.recurring && (
          <>
            <div className="space-y-2">
              <Label htmlFor="recurring_day">Dia do mês para recorrência</Label>
              <Input
                id="recurring_day"
                type="number"
                min="1"
                max="31"
                value={formData.recurring_day}
                onChange={(e) => setFormData(prev => ({ ...prev, recurring_day: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurrence_type">Tipo de Recorrência</Label>
              <Select
                value={formData.recurrence_type}
                onValueChange={(value: 'monthly' | 'quarterly' | 'semiannual' | 'annual') => 
                  setFormData(prev => ({ ...prev, recurrence_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de recorrência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral (a cada 3 meses)</SelectItem>
                  <SelectItem value="semiannual">Semestral (a cada 6 meses)</SelectItem>
                  <SelectItem value="annual">Anual (a cada 12 meses)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="installments">Número de repetições</Label>
              <Input
                id="installments"
                type="number"
                min="2"
                max="60"
                value={formData.installments}
                onChange={(e) => setFormData(prev => ({ ...prev, installments: e.target.value }))}
                required
              />
            </div>
          </>
        )}
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full bg-black hover:bg-black/90 text-white">
          {editingTransaction ? "Atualizar" : "Salvar"}
        </Button>
      </div>
    </form>
  );
};
