# Plano: Diário Treino × Comida — Macros + Sugestões + Fix Volume

## 1. Bug: volume dos treinos vindo como 0 / null

Causa: em `supabase/functions/hevy-webhook/index.ts` (e `hevy-proxy/index.ts`) a função `computeVolume` tem erro de precedência:

```ts
const weight = set.weight_kg ?? set.weight_lbs ? (set.weight_lbs * 0.453592) : 0;
```

É interpretado como `(set.weight_kg ?? set.weight_lbs) ? (set.weight_lbs * 0.453592) : 0`, então quando só vem `weight_kg`, o resultado vira `NaN`/`0` e o total fica nulo. Confirmado no banco: várias linhas com `weight_kg=20, reps=10` salvas com `volume_kg = null`.

**Correção:**
- Reescrever para `const weight = set.weight_kg ?? (set.weight_lbs ? set.weight_lbs * 0.453592 : 0);` nos dois edge functions (`hevy-webhook` e `hevy-proxy`).
- Adicionar migração SQL que **recalcula `volume_kg` em massa** percorrendo `raw_data->'exercises'->'sets'` para todos os registros já em cache (one-shot UPDATE).
- Treinos futuros já vêm corretos via webhook.

## 2. Status de macros no diário (Hoje + cada dia)

No `NutritionHistoryDiary` hoje só mostra os totais consumidos. Adicionar avaliação por macro contra `activeGoals` (que já considera dia de treino vs descanso):

- Cada macro (Calorias, Proteína, Carbo, Gordura) ganha:
  - Barra de progresso compacta (consumido / meta)
  - Label: `87g / 150g` e `faltam 63g` (ou `+12g acima`)
  - Cor semântica via tokens: dentro de ±10% = verde; abaixo = amber; muito acima = destructive
- Resumo no topo do dia "Hoje": chip `Faltam: 63g proteína · 280 kcal` ou `✅ Metas batidas` quando tudo dentro da faixa.
- Para dias passados: mesmo cálculo, mas usando a meta correta do dia (treino/descanso) — já temos `day.workout` para decidir.

Requer pequena refatoração: expor de `useNutrition` um helper `getGoalsForDay(hadWorkout)` ou recalcular inline no diário a partir de `rawGoals`. Vou expor `rawGoals` no hook para evitar duplicar lógica.

## 3. Sugestões "o que comer para bater" (novo componente)

Componente novo `MacroSuggestions.tsx` colocado **logo abaixo do card de "Hoje"** no `NutritionTrainingSync` (não dentro do diário — o diário é histórico):

- Calcula faltantes do dia: `restante = meta − consumido` por macro.
- Botão "Sugerir refeição para fechar o dia" → chama edge function `ai-nutrition-suggest` (nova) passando os faltantes + preferências básicas.
- Edge function usa Lovable AI Gateway (`google/gemini-2.5-flash`) com tool `sugerir_refeicoes` retornando 2–3 opções de refeições com nome, ingredientes e macros por opção.
- Resultado renderizado em cards; botão "Registrar esta refeição" reaproveita `saveLog` do `useNutrition` para inserir os itens direto no log do dia.

Se todas as metas já estão batidas, o componente mostra estado vazio: "✅ Metas do dia batidas — bom descanso/treino!".

## Detalhes técnicos

**Arquivos alterados:**
- `supabase/functions/hevy-webhook/index.ts` — fix `computeVolume`
- `supabase/functions/hevy-proxy/index.ts` — fix `computeVolume`
- Migração SQL — recalcula `volume_kg` de `hevy_workouts_cache` existente
- `src/hooks/useNutrition.ts` — expor `rawGoals` + helper de meta por dia
- `src/components/fitness/NutritionHistoryDiary.tsx` — barras + status por macro, resumo "faltam X"
- `src/components/fitness/NutritionTrainingSync.tsx` — montar `MacroSuggestions`

**Arquivos novos:**
- `src/components/fitness/MacroSuggestions.tsx`
- `supabase/functions/ai-nutrition-suggest/index.ts`
- `supabase/config.toml` — registrar nova função (verify_jwt = true)

**Sem mudanças de schema** além do UPDATE one-shot para backfill do volume.

**Cache:** invalidar `['nutrition-history', userId]` e `['nutrition-logs-today', userId]` ao registrar sugestão; manter `user_id` em todas as chaves.
