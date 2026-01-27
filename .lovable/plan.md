
# Plano: Corrigir Saldo Financeiro na Aba Financeiro

## Problema Identificado

O sistema atual tem dois conceitos de saldo que estão causando confusão:

1. **Saldo do Período** (o que está sendo mostrado atualmente): Calcula apenas `receitas - despesas` do mês selecionado. Por isso, ao navegar para janeiro/2026, o saldo aparece zerado porque não há transações nesse mês.

2. **Saldo Total das Contas Bancárias** (o que o usuário espera ver): O valor acumulado real das contas bancárias, que soma todas as transações pagas de todos os meses.

O componente `AccountSummaryCards` já existe e mostra corretamente o saldo total das contas bancárias, mas **não está sendo renderizado** na `FinanceTab`.

## Solução

Adicionar o `AccountSummaryCards` no topo da aba Financeiro para mostrar o saldo total acumulado das contas bancárias, independentemente do mês selecionado. Além disso, deixar claro que o "Saldo" mostrado no `FinancialSummaryView` é o saldo apenas do mês/período selecionado.

---

## Arquivos a Modificar

### 1. `src/components/FinanceTab.tsx`

**Alterações:**
- Renderizar o componente `AccountSummaryCards` no topo do dashboard (antes do `FinancialSummaryView`)
- O `AccountSummaryCards` já está importado mas não está sendo usado

```typescript
// Dentro do return, antes da div do FinancialSummaryView:
{viewMode === "dashboard" && (
  <>
    {/* Cards de resumo das contas bancárias - Saldo Total Acumulado */}
    <AccountSummaryCards />
    
    <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm">
      <FinancialSummaryView 
        income={summaries.income}
        expenses={summaries.expenses}
        balance={summaries.balance}
        pending={summaries.pending}
        chartData={chartData}
      />
    </div>
  </>
)}
```

### 2. `src/components/finance/FinancialSummaryView.tsx`

**Alterações:**
- Renomear o card "Saldo" para "Saldo do Mês" ou "Balanço Mensal" para deixar claro que é apenas do período
- Atualizar a descrição de "Saldo do período" para "Receitas - Despesas do mês"

```typescript
// Alterar de:
<CardTitle className="text-sm font-medium">Saldo</CardTitle>
// Para:
<CardTitle className="text-sm font-medium">Balanço Mensal</CardTitle>

// E alterar de:
<p className="text-xs text-muted-foreground">Saldo do período</p>
// Para:
<p className="text-xs text-muted-foreground">Receitas - Despesas do mês</p>
```

---

## Resultado Esperado

Após as alterações:
- O usuário verá o **Saldo Total das Contas** no topo do dashboard (valor acumulado real)
- O **Balanço Mensal** mostrará a diferença entre receitas e despesas do mês selecionado
- Ao navegar para diferentes meses, o **Saldo Total** permanece o mesmo (é cumulativo)
- O **Balanço Mensal** muda de acordo com o mês selecionado

---

## Detalhes Técnicos

O `AccountSummaryCards` já usa o hook `useBankAccounts` que busca o `current_balance` de cada conta. Esse saldo é calculado pelo banco de dados através do trigger `update_bank_account_balance`, que soma todas as transações pagas (`is_paid = true`) de todos os tempos, independentemente da data.

Fluxo do saldo:
```
initial_balance + SUM(todas transações pagas da conta) = current_balance
```

Isso significa que o `current_balance` já é cumulativo e correto. O problema era apenas de exibição - o componente que mostra esse valor simplesmente não estava sendo renderizado.
