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
  installments_total?: number;
  bank_account_id?: string;
  series_id?: string;
  recurrence_type?: string;
  custom_interval_days?: number;
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
  
  const [showEditPrompt, setShowEditPrompt] = useState(false);
  const [pendingTransactionData, setPendingTransactionData] = useState<any>(null);
  
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

  // Helper function to safely parse YYYY-MM-DD into a localized Noon date 
  // ensuring we stay on the same day globally when converted to ISO
  const getSafeNoonDate = (dateStr: string) => {
    const [year, month, day] = dateStr.substring(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
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
    is_infinite: false,
    bank_account_id: '',
    recurrence_type: 'monthly' as string,
    custom_interval_days: '',
  });

  useEffect(() => {
    if (editingTransaction) {
      // safely extract YYYY-MM-DD for the date input
      let prefilledDate = getLocalDateString();
      if (editingTransaction.date) {
        if (editingTransaction.date.includes('T')) {
          const tDate = new Date(editingTransaction.date);
          if (!Number.isNaN(tDate.getTime())) {
            // Reconstruct local date format
            prefilledDate = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}-${String(tDate.getDate()).padStart(2, '0')}`;
          }
        } else {
          prefilledDate = editingTransaction.date.substring(0, 10);
        }
      }

      setFormData({
        date: prefilledDate,
        description: editingTransaction.description,
        received_from: editingTransaction.received_from,
        amount: Math.abs(editingTransaction.amount).toString(),
        payment_type: editingTransaction.payment_type,
        category: editingTransaction.category,
        is_paid: editingTransaction.is_paid,
        recurring: editingTransaction.recurring || false,
        recurring_day: editingTransaction.recurring_day?.toString() || '',
        installments: editingTransaction.installments_total?.toString() || '12',
        is_infinite: editingTransaction.recurring || false,
        bank_account_id: editingTransaction?.bank_account_id || '',
        recurrence_type: editingTransaction.recurrence_type || 'monthly',
        custom_interval_days: editingTransaction.custom_interval_days?.toString() || '',
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

      const safeNoonDate = getSafeNoonDate(formData.date);

      let series_id = editingTransaction ? (editingTransaction.series_id || undefined) : undefined;
      if (!editingTransaction && formData.recurring) {
        series_id = crypto.randomUUID();
      }

      const transactionData = {
        date: safeNoonDate.toISOString(),
        description: formData.description,
        received_from: formData.received_from,
        amount,
        category: formData.category,
        payment_type: formData.payment_type,
        is_paid: formData.is_paid,
        recurring: formData.recurring && formData.is_infinite,
        recurring_day: formData.recurring ? Number(formData.recurring_day) : null,
        recurrence_type: formData.recurring ? formData.recurrence_type : null,
        custom_interval_days: formData.recurrence_type === 'custom' && formData.custom_interval_days ? Number(formData.custom_interval_days) : null,
        bank_account_id: formData.bank_account_id || null,
        series_id,
        user_id: user.id
      };

      if (editingTransaction) {
        // Se a transação faz parte de uma série, perguntamos ao usuário se deseja afetar as futuras
        if (editingTransaction.series_id || editingTransaction.installments_total || editingTransaction.recurring) {
          setPendingTransactionData(transactionData);
          setShowEditPrompt(true);
          return;
        }

        // Se for transação avulsa, executa update direto
        await executeUpdate('single', transactionData);
      } else {
        const startOfDay = new Date(safeNoonDate.getFullYear(), safeNoonDate.getMonth(), safeNoonDate.getDate(), 0, 0, 0);
        const endOfDay = new Date(safeNoonDate.getFullYear(), safeNoonDate.getMonth(), safeNoonDate.getDate(), 23, 59, 59);
        
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
        const exactMatch = existingTransactions?.some(t => {
          if (Math.abs(t.amount - amountToCheck) >= 0.01) return false;
          // Compare localized string
          const tDate = new Date(t.date);
          if (Number.isNaN(tDate.getTime())) return false;
          const tLocalDateStr = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}-${String(tDate.getDate()).padStart(2, '0')}`;
          return tLocalDateStr === formData.date;
        });
        
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
        if (formData.recurring && !formData.is_infinite && formData.installments) {
          const installmentsCount = Number(formData.installments);
          const recurringTransactions = [];
          const baseDate = new Date(safeNoonDate.getTime());
          const recurrenceType = formData.recurrence_type || 'monthly';
          
          console.log('🔄 Criando transações recorrentes:', {
            installmentsCount,
            recurrenceType,
            baseDate: baseDate.toISOString(),
            recurringDay: formData.recurring_day
          });
          
          // Atualizar a primeira transação com os dados de parcela
          const { error: updateError } = await supabase
            .from("transactions")
            .update({
              installments_total: installmentsCount,
              installment_number: 1,
              recurring: false // Marcar como false pois é uma parcela fixa, não infinita
            })
            .eq('id', newTransaction.id);
            
          if (updateError) {
            console.error("❌ Erro ao atualizar primeira transação:", updateError);
          }
          
          // Criar transações para os próximos períodos
          // A primeira transação já foi criada acima, então criamos installmentsCount - 1 adicionais
          for (let i = 1; i < installmentsCount; i++) {
            const nextDate = new Date(baseDate);
            const customDays = Number(formData.custom_interval_days) || 0;
            
            // Adicionar períodos de acordo com o tipo de recorrência
            switch (recurrenceType) {
              case 'weekly':
                nextDate.setDate(baseDate.getDate() + (i * 7));
                break;
              case 'biweekly':
                nextDate.setDate(baseDate.getDate() + (i * 15));
                break;
              case 'monthly':
                nextDate.setMonth(baseDate.getMonth() + i);
                break;
              case 'bimonthly':
                nextDate.setMonth(baseDate.getMonth() + (i * 2));
                break;
              case 'quarterly':
                nextDate.setMonth(baseDate.getMonth() + (i * 3));
                break;
              case 'semiannual':
                nextDate.setMonth(baseDate.getMonth() + (i * 6));
                break;
              case 'annual':
                nextDate.setFullYear(baseDate.getFullYear() + i);
                break;
              case 'custom':
                nextDate.setDate(baseDate.getDate() + (i * customDays));
                break;
            }
            
            // Para recorrências baseadas em meses, ajustar o dia
            if (!['weekly', 'biweekly', 'custom'].includes(recurrenceType)) {
              const targetDay = Number(formData.recurring_day);
              nextDate.setDate(targetDay);
              if (nextDate.getDate() !== targetDay) {
                nextDate.setDate(0);
              }
            }
            
            nextDate.setHours(12, 0, 0, 0);
            const isoDateStr = nextDate.toISOString();
            console.log(`📅 Criando parcela ${i + 1}/${installmentsCount} para ${isoDateStr} (tipo: ${recurrenceType})`);
            
            recurringTransactions.push({
              ...transactionData,
              date: isoDateStr,
              is_paid: false,
              recurring: false,
              installments_total: installmentsCount,
              installment_number: i + 1,
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
        is_infinite: false,
        bank_account_id: '',
        recurrence_type: 'monthly',
        custom_interval_days: '',
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

  const executeUpdate = async (mode: 'single' | 'future', dataToSave: any) => {
    try {
      if (mode === 'single') {
        const { error } = await supabase
          .from("transactions")
          .update(dataToSave)
          .eq('id', editingTransaction!.id);
        if (error) throw error;
        toast.success("Transação atualizada com sucesso.");
      } else if (mode === 'future') {
        // Primeiro, garantir atualizar a parcela atual completamente (incluindo data)
        const { error: currentError } = await supabase
          .from("transactions")
          .update(dataToSave)
          .eq('id', editingTransaction!.id);
        if (currentError) throw currentError;

        // Segundo, atualizar as futuras com os campos compartilhados
        let query = supabase
          .from("transactions")
          .update({
            amount: dataToSave.amount,
            description: dataToSave.description,
            received_from: dataToSave.received_from,
            category: dataToSave.category,
            payment_type: dataToSave.payment_type,
            bank_account_id: dataToSave.bank_account_id
          })
          .gt('date', editingTransaction!.date);
        
        // Agrupar por series_id OU descrição e config de repetição (compatibilidade com as velhas)
        if (editingTransaction!.series_id) {
          query = query.eq('series_id', editingTransaction!.series_id);
        } else {
          query = query.eq('description', editingTransaction!.description);
          if (editingTransaction!.recurring) query = query.eq('recurring', true);
          if (editingTransaction!.installments_total) query = query.eq('installments_total', editingTransaction!.installments_total);
        }

        const { error: futureError } = await query;
        if (futureError) throw futureError;
        
        toast.success("Esta e as futuras transações foram atualizadas!");
      }

      setShowEditPrompt(false);
      setPendingTransactionData(null);
      
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
        is_infinite: false,
        bank_account_id: '',
        recurrence_type: 'monthly',
        custom_interval_days: '',
      });
      
      onTransactionCreated();
    } catch (error) {
      console.error("Erro no executeUpdate:", error);
      toast.error("Erro ao aplicar atualizações em lote.");
    }
  };

  const getPaymentTypeLabel = (paymentType: string): string => {
    switch (paymentType) {
      case "pix": return "PIX";
      case "credit": return "Cartão de Crédito";
      case "debit": return "Cartão de Débito";
      case "cash": return "Dinheiro";
      case "boleto": return "Boleto";
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
              <SelectItem value="boleto">Boleto</SelectItem>
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
          <div className="col-span-full space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100 dark:bg-gray-800/50 dark:border-gray-700">
            <div className="flex items-center space-x-2 pb-2">
              <Checkbox
                id="is_infinite"
                checked={formData.is_infinite}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_infinite: checked as boolean }))
                }
              />
              <Label htmlFor="is_infinite" className="font-semibold text-gray-700 dark:text-gray-300">
                Repetição Contínua (Infinito / Assinatura)
              </Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recurring_day">Dia do mês (vencimento)</Label>
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
                <Label htmlFor="recurrence_type">Tipo de Repetição</Label>
                <Select
                  value={formData.recurrence_type}
                  onValueChange={(value: 'monthly' | 'quarterly' | 'semiannual' | 'annual') => 
                    setFormData(prev => ({ ...prev, recurrence_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral (a cada 3 meses)</SelectItem>
                    <SelectItem value="semiannual">Semestral (a cada 6 meses)</SelectItem>
                    <SelectItem value="annual">Anual (a cada 12 meses)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!formData.is_infinite && (
                <div className="space-y-2">
                  <Label htmlFor="installments">Número de parcelas</Label>
                  <Input
                    id="installments"
                    type="number"
                    min="2"
                    max="60"
                    value={formData.installments}
                    onChange={(e) => setFormData(prev => ({ ...prev, installments: e.target.value }))}
                    required={!formData.is_infinite}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full bg-black hover:bg-black/90 text-white">
          {editingTransaction ? "Atualizar" : "Salvar"}
        </Button>
      </div>

      {/* Interceptador de Lote */}
      {showEditPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-sm w-full space-y-4 shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Atualizar Série</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Esta transação faz parte de uma repetição. Deseja aplicar as alterações nos valores/títulos a todas as futuras cobranças também?
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => executeUpdate('single', pendingTransactionData)}>
                Apenas Esta Parcela
              </Button>
              <Button type="button" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => executeUpdate('future', pendingTransactionData)}>
                Esta e as Futuras Parcelas
              </Button>
              <Button type="button" variant="ghost" className="text-gray-500" onClick={() => setShowEditPrompt(false)}>
                Cancelar Edição
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
