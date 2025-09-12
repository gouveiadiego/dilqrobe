import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { useBankAccounts } from "@/hooks/useBankAccounts";

export const AccountSummaryCards = () => {
  const { bankAccounts, loading, getTotalBalance } = useBankAccounts();

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

  const getAccountTypeColor = (type: string) => {
    const colors = {
      corrente: "default",
      poupanca: "secondary", 
      investimento: "outline"
    };
    return colors[type as keyof typeof colors] || "default";
  };

  const getAccountsByType = () => {
    return bankAccounts.reduce((acc, account) => {
      const type = account.account_type;
      if (!acc[type]) {
        acc[type] = { count: 0, total: 0 };
      }
      acc[type].count++;
      acc[type].total += Number(account.current_balance);
      return acc;
    }, {} as Record<string, { count: number; total: number }>);
  };

  const accountsByType = getAccountsByType();
  const totalBalance = getTotalBalance();
  const totalPositiveBalance = bankAccounts
    .filter(acc => Number(acc.current_balance) > 0)
    .reduce((sum, acc) => sum + Number(acc.current_balance), 0);
  const totalNegativeBalance = bankAccounts
    .filter(acc => Number(acc.current_balance) < 0)
    .reduce((sum, acc) => sum + Number(acc.current_balance), 0);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Saldo Total */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
          <p className="text-xs text-muted-foreground">
            {bankAccounts.length} conta{bankAccounts.length !== 1 ? 's' : ''} ativa{bankAccounts.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Saldos Positivos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldos Positivos</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalPositiveBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            {bankAccounts.filter(acc => Number(acc.current_balance) > 0).length} contas
          </p>
        </CardContent>
      </Card>

      {/* Saldos Negativos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldos Negativos</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totalNegativeBalance)}
          </div>
          <p className="text-xs text-muted-foreground">
            {bankAccounts.filter(acc => Number(acc.current_balance) < 0).length} contas
          </p>
        </CardContent>
      </Card>

      {/* Contas por Tipo */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Por Tipo</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(accountsByType).map(([type, data]) => (
              <div key={type} className="flex items-center justify-between">
                <Badge variant={getAccountTypeColor(type) as any} className="text-xs">
                  {getAccountTypeLabel(type)}
                </Badge>
                <div className="text-sm">
                  <span className="font-medium">{data.count}</span>
                  <span className="text-muted-foreground ml-1">
                    • {formatCurrency(data.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};