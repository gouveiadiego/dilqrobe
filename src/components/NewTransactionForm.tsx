
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
    installments: '',
    recurring_infinite: false
  });

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
        ...formData,
        amount,
        category,
        user_id: user.id,
        recurring_day: formData.recurring ? Number(formData.recurring_day) : null,
        installments: formData.recurring && !formData.recurring_infinite ? Number(formData.installments) : null
      };

      const { error } = await supabase
        .from("transactions")
        .insert([transactionData]);

      if (error) throw error;

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
        installments: '',
        recurring_infinite: false
      });

      onTransactionCreated();
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error("Não foi possível criar a transação.");
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
                  recurring_day: checked ? prev.recurring_day : '',
                  installments: checked ? prev.installments : '',
                  recurring_infinite: checked ? prev.recurring_infinite : false
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
              <div className="flex items-center space-x-2 mb-2">
                <Checkbox
                  id="recurring_infinite"
                  checked={formData.recurring_infinite}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      recurring_infinite: checked as boolean,
                      installments: checked ? '' : prev.installments
                    }))
                  }
                />
                <Label htmlFor="recurring_infinite">Recorrência por tempo indeterminado</Label>
              </div>

              {!formData.recurring_infinite && (
                <div className="space-y-2">
                  <Label htmlFor="installments">Número de parcelas</Label>
                  <Input
                    id="installments"
                    type="number"
                    min="2"
                    value={formData.installments}
                    onChange={(e) => setFormData(prev => ({ ...prev, installments: e.target.value }))}
                    required
                  />
                </div>
              )}
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
