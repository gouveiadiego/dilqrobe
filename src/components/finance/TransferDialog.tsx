import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useTransfers } from "@/hooks/useTransfers";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeftRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferComplete?: () => void;
}

export const TransferDialog = ({ open, onOpenChange, onTransferComplete }: TransferDialogProps) => {
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { bankAccounts, loading } = useBankAccounts();
  const { createTransfer } = useTransfers();

  const fromAccount = bankAccounts.find(acc => acc.id === fromAccountId);
  const toAccount = bankAccounts.find(acc => acc.id === toAccountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromAccountId || !toAccountId || !amount) {
      return;
    }

    setIsSubmitting(true);

    const result = await createTransfer({
      fromAccountId,
      fromAccountName: fromAccount?.bank_name || "",
      toAccountId,
      toAccountName: toAccount?.bank_name || "",
      amount: parseFloat(amount),
      description: description || "Transferência entre contas",
      date,
    });

    setIsSubmitting(false);

    if (result.success) {
      // Reset form
      setFromAccountId("");
      setToAccountId("");
      setAmount("");
      setDescription("");
      setDate(new Date());
      
      onOpenChange(false);
      onTransferComplete?.();
    }
  };

  const getAccountTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'corrente': 'Corrente',
      'poupanca': 'Poupança',
      'investimento': 'Investimento',
      'digital': 'Digital'
    };
    return types[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Transferência entre Contas
          </DialogTitle>
          <DialogDescription>
            Transfira dinheiro entre suas contas bancárias
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* From Account */}
          <div className="space-y-2">
            <Label htmlFor="from-account">Conta de Origem *</Label>
            <Select value={fromAccountId} onValueChange={setFromAccountId} disabled={loading}>
              <SelectTrigger id="from-account">
                <SelectValue placeholder="Selecione a conta de origem" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id} disabled={account.id === toAccountId}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{account.bank_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {getAccountTypeLabel(account.account_type)} • {formatCurrency(account.current_balance)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* To Account */}
          <div className="space-y-2">
            <Label htmlFor="to-account">Conta de Destino *</Label>
            <Select value={toAccountId} onValueChange={setToAccountId} disabled={loading}>
              <SelectTrigger id="to-account">
                <SelectValue placeholder="Selecione a conta de destino" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id} disabled={account.id === fromAccountId}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{account.bank_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {getAccountTypeLabel(account.account_type)} • {formatCurrency(account.current_balance)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {fromAccount && amount && parseFloat(amount) > fromAccount.current_balance && (
              <p className="text-sm text-destructive">
                Saldo insuficiente na conta de origem
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Data da Transferência *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              placeholder="Motivo da transferência"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Summary */}
          {fromAccount && toAccount && amount && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Resumo da Transferência</p>
              <div className="text-sm space-y-1">
                <p className="flex justify-between">
                  <span className="text-muted-foreground">De:</span>
                  <span className="font-medium">{fromAccount.bank_name}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Para:</span>
                  <span className="font-medium">{toAccount.bank_name}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium text-primary">{formatCurrency(parseFloat(amount))}</span>
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={
                isSubmitting || 
                !fromAccountId || 
                !toAccountId || 
                !amount || 
                fromAccountId === toAccountId ||
                (fromAccount && parseFloat(amount) > fromAccount.current_balance)
              }
            >
              {isSubmitting ? "Transferindo..." : "Confirmar Transferência"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
