import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Building, Plus, Wallet } from "lucide-react";
import { useBankAccounts, BankAccount } from "@/hooks/useBankAccounts";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface BankAccountFormProps {
  account?: BankAccount;
  onSubmit: (data: any) => Promise<any>;
  onClose: () => void;
}

const BankAccountForm = ({ account, onSubmit, onClose }: BankAccountFormProps) => {
  const [formData, setFormData] = useState({
    bank_name: account?.bank_name || "",
    account_type: account?.account_type || "corrente" as const,
    account_number: account?.account_number || "",
    initial_balance: account?.initial_balance || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bank_name">Nome do Banco</Label>
        <Input
          id="bank_name"
          value={formData.bank_name}
          onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
          placeholder="Ex: Banco do Brasil, Itaú, Nubank..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_type">Tipo da Conta</Label>
        <Select 
          value={formData.account_type} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, account_type: value as any }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo da conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="corrente">Conta Corrente</SelectItem>
            <SelectItem value="poupanca">Poupança</SelectItem>
            <SelectItem value="investimento">Investimento</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account_number">Número da Conta (Opcional)</Label>
        <Input
          id="account_number"
          value={formData.account_number}
          onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
          placeholder="Ex: 12345-6"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="initial_balance">
          {account ? "Saldo Inicial" : "Saldo Atual"}
        </Label>
        <Input
          id="initial_balance"
          type="number"
          step="0.01"
          value={formData.initial_balance}
          onChange={(e) => setFormData(prev => ({ ...prev, initial_balance: parseFloat(e.target.value) || 0 }))}
          placeholder="0,00"
          required
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit">
          {account ? "Atualizar" : "Criar"} Conta
        </Button>
      </div>
    </form>
  );
};

interface BankAccountManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BankAccountManager = ({ open, onOpenChange }: BankAccountManagerProps) => {
  const { bankAccounts, loading, createBankAccount, updateBankAccount, deleteBankAccount, getTotalBalance } = useBankAccounts();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      corrente: "Corrente",
      poupanca: "Poupança",
      investimento: "Investimento"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      corrente: "default",
      poupanca: "secondary",
      investimento: "outline"
    };
    return colors[type as keyof typeof colors] || "default";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  if (loading) {
    return <div>Carregando contas bancárias...</div>;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Contas Bancárias</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Header com Resumo */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-muted-foreground">
                {bankAccounts.length} contas • Saldo total: {formatCurrency(getTotalBalance())}
              </p>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Conta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Conta Bancária</DialogTitle>
                </DialogHeader>
                <BankAccountForm
                  onSubmit={createBankAccount}
                  onClose={() => setShowCreateDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Lista de Contas */}
          {loading ? (
            <div>Carregando contas bancárias...</div>
          ) : bankAccounts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma conta cadastrada</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Adicione suas contas bancárias para controlar melhor suas finanças
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Conta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bankAccounts.map((account) => (
                <Card key={account.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">{account.bank_name}</CardTitle>
                      </div>
                      <Badge variant={getAccountTypeColor(account.account_type) as any}>
                        {getAccountTypeLabel(account.account_type)}
                      </Badge>
                    </div>
                    {account.account_number && (
                      <CardDescription>Conta: {account.account_number}</CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {formatCurrency(Number(account.current_balance))}
                      </p>
                      <p className="text-sm text-muted-foreground">Saldo Atual</p>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Saldo Inicial:</span>
                      <span>{formatCurrency(Number(account.initial_balance))}</span>
                    </div>

                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => setEditingAccount(account)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Conta Bancária</DialogTitle>
                          </DialogHeader>
                          {editingAccount && (
                            <BankAccountForm
                              account={editingAccount}
                              onSubmit={(data) => updateBankAccount(editingAccount.id, data)}
                              onClose={() => setEditingAccount(null)}
                            />
                          )}
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover Conta</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover a conta "{account.bank_name}"? 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteBankAccount(account.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};