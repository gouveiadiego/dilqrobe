import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface NewTransactionFormProps {
  selectedFilter: string;
  onTransactionCreated: () => void;
}

export const NewTransactionForm = ({ selectedFilter, onTransactionCreated }: NewTransactionFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    received_from: '',
    amount: '',
    payment_type: '',
    is_paid: true
  });

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
        toast({
          variant: "destructive",
          title: "Erro!",
          description: "Você precisa estar logado para criar uma transação.",
        });
        return;
      }

      const { category } = getTransactionDefaults();
      const amount = selectedFilter === "recebimentos" 
        ? Math.abs(Number(formData.amount))
        : -Math.abs(Number(formData.amount));

      const { error } = await supabase
        .from("transactions")
        .insert([
          {
            ...formData,
            amount,
            category,
            user_id: user.id
          }
        ]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Transação criada com sucesso.",
      });
      
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        received_from: '',
        amount: '',
        payment_type: '',
        is_paid: true
      });

      onTransactionCreated();
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast({
        variant: "destructive",
        title: "Erro!",
        description: "Não foi possível criar a transação.",
      });
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
      </div>
      <div className="pt-4">
        <Button type="submit" className="w-full bg-black hover:bg-black/90 text-white">
          Salvar
        </Button>
      </div>
    </form>
  );
};