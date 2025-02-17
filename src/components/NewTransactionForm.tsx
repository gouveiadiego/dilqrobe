import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewTransactionFormProps {
  selectedFilter: string;
  onTransactionCreated: () => void;
}

export const NewTransactionForm = ({ selectedFilter, onTransactionCreated }: NewTransactionFormProps) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    received_from: '',
    amount: '',
    payment_type: '',
    is_paid: true,
    recurring: false,
    recurring_day: '',
    installments: '12',
  });

  const createRecurringTransactions = async (originalTransaction: any) => {
    try {
      const startDate = new Date(originalTransaction.date);
      const numberOfMonths = parseInt(formData.installments) || 12;
      const transactions = [];

      for (let i = 1; i < numberOfMonths; i++) {
        const nextDate = new Date(startDate);
        nextDate.setMonth(startDate.getMonth() + i);
        
        if (originalTransaction.recurring_day) {
          nextDate.setDate(originalTransaction.recurring_day);
        }

        transactions.push({
          date: nextDate.toISOString().split('T')[0],
          description: originalTransaction.description,
          received_from: originalTransaction.received_from,
          amount: originalTransaction.amount,
          category: originalTransaction.category,
          payment_type: originalTransaction.payment_type,
          is_paid: originalTransaction.is_paid,
          recurring: originalTransaction.recurring,
          recurring_day: originalTransaction.recurring_day,
          user_id: originalTransaction.user_id,
          parent_transaction_id: originalTransaction.id
        });
      }

      if (transactions.length > 0) {
        const { error } = await supabase
          .from("transactions")
          .insert(transactions);

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error creating recurring transactions:", error);
      toast.error("Erro ao criar transações recorrentes");
    }
  };

  const getTransactionDefaults = () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado para criar uma transação.");
        return;
      }

      const { category } = getTransactionDefaults();
      const amount = selectedFilter === "recebimentos" 
        ? Math.abs(Number(formData.amount))
        : -Math.abs(Number(formData.amount));

      const transactionData = {
        date: formData.date,
        description: formData.description,
        received_from: formData.received_from,
        amount,
        category,
        payment_type: formData.payment_type,
        is_paid: formData.is_paid,
        recurring: formData.recurring,
        recurring_day: formData.recurring ? Number(formData.recurring_day) : null,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from("transactions")
        .insert([transactionData])
        .select('id, date, description, received_from, amount, category, payment_type, is_paid, recurring, recurring_day, user_id')
        .single();

      if (error) throw error;

      if (formData.recurring && data) {
        await createRecurringTransactions(data);
      }

      toast.success("Transação criada com sucesso.");
      
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        received_from: '',
        amount: '',
        payment_type: '',
        is_paid: true,
        recurring: false,
        recurring_day: '',
        installments: '12',
      });

      onTransactionCreated();
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error("Não foi possível criar a transação.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a forma de pagamento" />
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
          Salvar
        </Button>
      </div>
    </form>
  );
};
