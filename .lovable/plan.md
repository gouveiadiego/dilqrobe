## Objetivo

Suportar dois tipos de orçamento:

1. **Produtos/Itens** (atual) — Descrição, Quantidade, Valor Unitário, Total automático.
2. **Serviços** (novo) — Descrição livre/longa, valor opcional por item, mistura permitida. Total geral soma apenas os itens com valor.

## Decisões confirmadas

- Item de Serviço sem valor: **omitir** (não mostrar nada na coluna/linha de valor).
- Pode **misturar** itens com e sem valor no mesmo orçamento.
- Total geral aparece somando apenas os itens preenchidos (mesmo que parcial).

## Fluxo do usuário

Ao criar/editar um orçamento, no topo do formulário:

```text
┌─────────────────────────┐   ┌─────────────────────────┐
│  Produtos / Itens       │   │  Serviços               │
│  Qtd × Valor Unitário   │   │  Descrição livre        │
│  Total automático       │   │  Valor opcional         │
└─────────────────────────┘   └─────────────────────────┘
```

- **Produtos**: tabela atual.
- **Serviços**: lista de blocos, cada bloco com:
  - Título do serviço (curto)
  - Descrição detalhada (textarea multilinha)
  - Toggle "Incluir valor" → quando ativo, mostra campo de Valor.

Listagem: badge "Produtos" / "Serviços" em cada card.

## Mudanças técnicas

**Banco (migration)**:
- Adicionar coluna `budget_type text not null default 'products'` em `budgets` (mantém compatibilidade — orçamentos antigos viram "products").

**Tipos** (`src/components/budget/types.ts`):
- `Budget` e `NewBudget`: adicionar `budget_type: 'products' | 'services'`.
- `BudgetItem`: tornar `quantity` e `unit_price` opcionais; adicionar `title?: string` e `has_value?: boolean`.

**Hook** (`useBudgets.ts`):
- Persistir e ler `budget_type`. Default `'products'` quando ausente.
- Cálculo de `total_amount` em Serviços: somar apenas itens com `has_value === true`.

**Formulário** (`BudgetForm.tsx`):
- Seletor de tipo no topo (2 cards). Bloqueia troca após adicionar itens, ou pede confirmação.
- Renderização condicional do form de itens:
  - `BudgetItemsForm` atual → renomeado/refatorado para `ProductItemsForm`.
  - Novo `ServiceItemsForm` com blocos: título + textarea + toggle de valor.

**Listagem** (`BudgetCard` / `BudgetList`):
- Badge do tipo.
- Para Serviços, exibir total normalmente (já calculado).

**PDF** (`generateBudgetPDF.ts`):
- Se `budget_type === 'services'`:
  - Sem colunas Qtd/V.Unit. Cada item vira bloco: título em destaque (dourado), descrição justificada, valor à direita só se `has_value`.
  - Total geral só aparece se algum item tem valor.
- Se `'products'`: layout atual (já refeito premium).

## Compatibilidade

Orçamentos existentes assumem `budget_type = 'products'` automaticamente via default da migration. Nada quebra.
