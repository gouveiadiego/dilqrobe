## Ideias para deixar o sistema fitness mais completo

Hoje o sistema já cobre: perfis, bioimpedância, medidas corporais, gráficos, insights, integração Hevy (treinos), nutrição (metas, log com IA, histórico, sugestões de refeições). Abaixo, oportunidades organizadas por impacto.

---

### 1. Coach diário e progresso semanal (alto impacto)
- **Resumo Semanal automático**: card "Sua semana" com aderência de treino (X/Y dias), aderência de macros (% dias na meta), variação de peso, volume total levantado vs semana anterior.
- **Coach IA diário**: botão "Análise do dia" que cruza treino + nutrição + sono/estresse do `fitness_nutrition_profile` e devolve 1 parágrafo com feedback ("comeu pouco carbo no dia de perna, considere +50g…").
- **Score de consistência**: 0–100 baseado em treino+macros+peso da semana, com badge visual.

### 2. Planejamento (preencher lacuna entre "meta" e "execução")
- **Plano de refeições do dia**: gerar 4–5 refeições (café, almoço, lanche, jantar) que somem as metas, salvas como template. Hoje só temos sugestão pontual.
- **Lista de compras semanal**: derivada dos templates de refeição.
- **Plano de treino próximo**: usar histórico Hevy para sugerir próxima carga por exercício (progressive overload).

### 3. Hidratação, sono e cardio
- Nova tabela `fitness_daily_log` (água_ml, sono_h, passos, cardio_min, humor).
- Widget rápido no topo do fitness com +250ml, +1h sono etc.
- Gráficos correlacionando sono/água com performance no treino.

### 4. Fotos de progresso
- Bucket `fitness-photos` (privado) com foto frente/lado/costas mensal.
- Comparador lado-a-lado por data com slider.

### 5. Análise de treino mais profunda (Hevy já está pronto)
- **PRs automáticos**: detectar novos recordes (1RM estimado por exercício) e exibir badge "🏆 Novo PR".
- **Heatmap de grupos musculares por semana**: alertar desequilíbrios (ex: "peito 12 séries vs costas 4").
- **Volume por grupo muscular** em barras, comparando semanas.

### 6. Metas e gamificação
- Tabela `fitness_goals` (tipo: peso/bf%/PR/streak, valor, prazo).
- Streaks visíveis (dias batendo proteína, dias treinando).
- Conquistas: "30 dias de proteína", "100kg no supino", etc.

### 7. Suplementação e medicação
- Tabela `fitness_supplements` (nome, dose, horário, dias_semana) + lembretes/checkin diário.
- Útil porque já há `usa_ergogenicos` no perfil mas sem rastreio.

### 8. Exportação e compartilhamento
- Export PDF mensal "Relatório do Mês" (peso, BF%, treinos, macros médios, fotos).
- Link compartilhável com personal trainer (read-only).

### 9. Pequenas melhorias de UX
- Atalho rápido "Repetir refeição de ontem" no NutritionTrainingSync.
- Banco pessoal de alimentos (top 20 mais usados, 1-clique).
- Código de barras / busca por alimento (TACO/OpenFoodFacts).
- Notificação push no horário de cada refeição planejada.

---

### Minha recomendação (ordem sugerida)
1. **Resumo Semanal + Coach IA diário** — agrega valor imediato sobre o que já existe.
2. **Daily Log (água/sono/passos)** — preenche dimensão importante que falta.
3. **PRs automáticos + Volume por grupo** — aproveita Hevy que já está integrado.
4. **Fotos de progresso** — alto impacto motivacional, baixo esforço.
5. **Plano de refeições** — natural evolução da sugestão pontual.

Qual desses caminhos (ou combinação) você quer que eu detalhe e implemente primeiro?
