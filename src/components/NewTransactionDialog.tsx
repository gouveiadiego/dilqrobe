import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface NewTransactionDialogProps {
  selectedFilter: string;
}

export const NewTransactionDialog = ({ selectedFilter }: NewTransactionDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
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

  const getDialogTitle = () => {
    switch (selectedFilter) {
      case "recebimentos":
        return "Novo Recebimento";
      case "despesas-fixas":
        return "Nova Despesa Fixa";
      case "despesas-variaveis":
        return "Nova Despesa Variável";
      case "pessoas":
        return "Nova Despesa com Pessoas";
      case "impostos":
        return "Novo Imposto";
      case "transferencias":
        return "Nova Transferência";
      default:
        return "Nova Transação";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
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
          }
        ]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Transação criada com sucesso.",
      });
      
      setOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        received_from: '',
        amount: '',
        payment_type: '',
        is_paid: true
      });
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-black hover:bg-black/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="pt-4">
            <Button type="submit" className="w-full">
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};