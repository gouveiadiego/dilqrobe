import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building, AlertCircle } from "lucide-react";
import { useBankAccounts } from "@/hooks/useBankAccounts";

interface BankAccountSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  required?: boolean;
}

export const BankAccountSelector = ({ value, onValueChange, required = false }: BankAccountSelectorProps) => {
  const { bankAccounts, loading } = useBankAccounts();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      corrente: "Corrente",
      poupanca: "Poupança", 
      investimento: "Investimento"
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Conta Bancária</Label>
        <div className="h-10 bg-muted animate-pulse rounded-md"></div>
      </div>
    );
  }

  if (bankAccounts.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Conta Bancária</Label>
        <div className="flex items-center space-x-2 p-3 border rounded-md bg-muted/50">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-muted-foreground">
            Nenhuma conta cadastrada. Cadastre uma conta na aba de gerenciamento.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="bank_account">
        Conta Bancária
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onValueChange} required={required}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione a conta bancária" />
        </SelectTrigger>
        <SelectContent>
          {bankAccounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{account.bank_name}</div>
                    {account.account_number && (
                      <div className="text-xs text-muted-foreground">
                        {account.account_number}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {getAccountTypeLabel(account.account_type)}
                  </Badge>
                  <span className="text-sm font-medium">
                    {formatCurrency(Number(account.current_balance))}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};