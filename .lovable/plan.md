
## O que vou construir

Dois componentes novos na aba Fitness, logo abaixo do card "Sincronização Ativa":

### 1. Histórico de Refeições do dia
Lista cronológica do que foi registrado hoje (já existe `fitness_nutrition_logs`, só precisa exibir):
- Cada item mostra: nome do alimento, quantidade/unidade, macros (P/C/G) e calorias
- Botão de excluir em cada linha (caso registre errado)
- Totais do dia no rodapé

### 2. Diário Treino × Comida (últimos 7 dias)
Linha do tempo dos últimos 7 dias mostrando lado a lado:
- **Treino do dia** (de `hevy_workouts_cache`): título, volume kg, grupos musculares — ou "Descanso"
- **Resumo nutricional** (agregado de `fitness_nutrition_logs`): calorias consumidas vs meta, proteína batida ou não
- **Indicador visual** de alinhamento: ✅ se bateu meta de proteína, ⚠️ se ficou abaixo, 🔥 destaque para dia de treino

Cada dia expansível para ver a lista de refeições daquele dia.

## Como vai parecer

```text
┌─ Hoje, 17 mai ─────────────────────────────┐
│ 🔥 Treino: Push Day · 4.200 kg · Peito/Triceps │
│ 🍽️  1.850 / 2.400 kcal  · Proteína ✅ 175/174g │
│   └─ 2 ovos · 1 pão · 30g whey · ...       │
├─ 16 mai ───────────────────────────────────┤
│ 🌙 Descanso                                 │
│ 🍽️  2.100 / 2.160 kcal  · Proteína ⚠️ 140/174g │
└─────────────────────────────────────────────┘
```

## Detalhes técnicos

- Novo hook `useNutritionHistory(days = 7)` que busca logs + workouts agregados por dia
- Novo componente `NutritionHistory.tsx` (lista de hoje com delete)
- Novo componente `NutritionWorkoutDiary.tsx` (timeline 7 dias, accordion por dia)
- Ambos plugados em `NutritionTrainingSync.tsx` (ou no container da aba Fitness, abaixo dele)
- Sem mudanças de schema — tabelas `fitness_nutrition_logs` e `hevy_workouts_cache` já têm tudo
- Cache keys com `user_id` e invalidação após delete/registro novo
