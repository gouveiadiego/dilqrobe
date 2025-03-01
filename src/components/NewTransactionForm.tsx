import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase, removeDuplicateTransactions } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CategorySelector } from "./finance/CategorySelector";

interface Transaction {
  id: string;
  date: string;
  description: string;
  received_from: string;
  category: string;
  amount: number;
  payment_type: string;
  is_paid: boolean;
}

interface NewTransactionFormProps {
  selectedFilter: string;
  onTransactionCreated: () => void;
  editingTransaction?: Transaction | null;
}

const getTransactionDefaults = (selectedFilter: string) => {
  switch (selectedFilter) {
    case "recebimentos":
      return { category: "income" };
    case "despesas-fixas":
      return { category: "fixed" };
    case "despesas-variaveis":
      return { category: "variable" };
    case "pessoas":
      return { category: "people" };
    case "impostos":
      return { category: "taxes" };
    case "transferencias":
      return { category: "transfer" };
    default:
      return { category: "income" };
  }
};

export const NewTransactionForm = ({ selectedFilter, onTransactionCreated, editingTransaction }: NewTransactionFormProps) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    received_from: '',
    amount: '',
    payment_type: '',
    category: getTransactionDefaults(selectedFilter).category,
    is_paid: false,
    recurring: false,
    recurring_day: '',
    installments: '12',
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
      });
    } else {
      setFormData(prev => ({
        ...prev,
        category: getTransactionDefaults(selectedFilter).category
      }));
    }
  }, [editingTransaction, selectedFilter]);

  const createRecurringTransactions = async (parentId: string, transactionData: any) => {
    try {
      const startDate = new Date(transactionData.date);
      const numberOfMonths = parseInt(formData.installments) || 12;
      
      console.log(`Preparing to create recurring transactions for ${numberOfMonths} months`);
      
      const transactionsByMonth: Record<string, any[]> = {};
      
      for (let i = 1; i < numberOfMonths; i++) {
        const nextDate = new Date(startDate);
        nextDate.setMonth(startDate.getMonth() + i);
        
        if (transactionData.recurring_day) {
          nextDate.setDate(transactionData.recurring_day);
        }

        if (nextDate.getMonth() !== (startDate.getMonth() + i) % 12) {
          nextDate.setDate(0);
        }
        
        if (nextDate < new Date(2025, 1, 1)) {
          continue;
        }
        
        const monthKey = `${nextDate.getFullYear()}-${nextDate.getMonth() + 1}`;
        
        if (!transactionsByMonth[monthKey]) {
          transactionsByMonth[monthKey] = [];
        }
        
        transactionsByMonth[monthKey].push({
          date: nextDate.toISOString().split('T')[0],
          description: transactionData.description,
          received_from: transactionData.received_from,
          amount: transactionData.amount,
          category: transactionData.category,
          payment_type: transactionData.payment_type,
          is_paid: false,
          recurring: true,
          recurring_day: transactionData.recurring_day,
          user_id: transactionData.user_id
        });
      }
      
      for (const [monthKey, monthTransactions] of Object.entries(transactionsByMonth)) {
        if (!monthTransactions.length) continue;
        
        const sampleDate = new Date(monthTransactions[0].date);
        const startOfMonth = new Date(sampleDate.getFullYear(), sampleDate.getMonth(), 1);
        const endOfMonth = new Date(sampleDate.getFullYear(), sampleDate.getMonth() + 1, 0);
        
        const { data: existingTransactions, error: fetchError } = await supabase
          .from("transactions")
          .select("description, received_from, category, payment_type, date, amount")
          .gte("date", startOfMonth.toISOString())
          .lte("date", endOfMonth.toISOString());
        
        if (fetchError) {
          console.error("Error checking existing transactions:", fetchError);
          continue;
        }
        
        const existingKeys = new Set();
        existingTransactions?.forEach(t => {
          const key = `${t.date}|${t.description}|${t.received_from}|${t.payment_type}|${t.amount}`;
          existingKeys.add(key);
        });
        
        const uniqueTransactions = monthTransactions.filter(t => {
          const key = `${t.date}|${t.description}|${t.received_from}|${t.payment_type}|${t.amount}`;
          return !existingKeys.has(key);
        });
        
        console.log(`Month ${monthKey}: Found ${monthTransactions.length} transactions, ${uniqueTransactions.length} are unique`);
        
        if (uniqueTransactions.length > 0) {
          const { error } = await supabase
            .from("transactions")
            .insert(uniqueTransactions);
          
          if (error) {
            console.error(`Error creating transactions for month ${monthKey}:`, error);
          } else {
            console.log(`Created ${uniqueTransactions.length} transactions for month ${monthKey}`);
          }
        }
      }
    } catch (error) {
      console.error("Error creating recurring transactions:", error);
      toast.error("Erro ao criar transações recorrentes");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado para criar uma transação.");
        return;
      }

      const isIncome = formData.category === "income";
      
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

        if (formData.recurring && newTransaction?.id) {
          await createRecurringTransactions(newTransaction.id, transactionData);
        }

        toast.success("Transação criada com sucesso.");
        
        await removeDuplicateTransactions();
      }
      
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        received_from: '',
        amount: '',
        payment_type: '',
        category: getTransactionDefaults(selectedFilter).category,
        is_paid: false,
        recurring: false,
        recurring_day: '',
        installments: '12',
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
        
        <CategorySelector 
          value={formData.category}
          onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          selectedFilter={selectedFilter}
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
              <Label htmlFor="installments">Número de meses</Label>
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
