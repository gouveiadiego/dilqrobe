
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, userId, sentiment, actionable, requestAdvanced } = await req.json();
    console.log('Advanced AI Chat request:', { message, userId, sentiment, actionable, requestAdvanced });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'API não configurada',
        details: 'Chave da API OpenAI não configurada'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client to get user data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get comprehensive user data for advanced context
    let advancedUserContext = '';
    if (userId) {
      try {
        // Get detailed analytics
        const [tasksData, transactionsData, meetingsData, habitsData] = await Promise.all([
          supabase
            .from('tasks')
            .select('title, completed, priority, due_date, category, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20),
          
          supabase
            .from('transactions')
            .select('description, amount, date, payment_type, created_at')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(15),
          
          supabase
            .from('client_meetings')
            .select('title, meeting_date, status, created_at')
            .eq('user_id', userId)
            .order('meeting_date', { ascending: false })
            .limit(10),
          
          supabase
            .from('habits')
            .select('name, streak, target_frequency, created_at')
            .eq('user_id', userId)
            .limit(10)
        ]);

        // Calculate advanced metrics
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const recentTasks = tasksData.data?.filter(t => new Date(t.created_at) > lastWeek) || [];
        const completedTasks = recentTasks.filter(t => t.completed);
        const productivityRate = recentTasks.length > 0 ? Math.round((completedTasks.length / recentTasks.length) * 100) : 0;

        const recentTransactions = transactionsData.data?.filter(t => new Date(t.date) > lastMonth) || [];
        const totalSpent = recentTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const avgDaily = Math.round(totalSpent / 30);

        // Generate advanced context
        advancedUserContext = `
CONTEXTO AVANÇADO DO USUÁRIO:

📊 MÉTRICAS DE PRODUTIVIDADE:
- Taxa de conclusão (7 dias): ${productivityRate}%
- Tarefas criadas esta semana: ${recentTasks.length}
- Tarefas concluídas: ${completedTasks.length}
- Prioridades pendentes: ${tasksData.data?.filter(t => !t.completed && t.priority === 'high').length || 0} alta, ${tasksData.data?.filter(t => !t.completed && t.priority === 'medium').length || 0} média

💰 ANÁLISE FINANCEIRA:
- Gasto médio diário (30d): R$ ${avgDaily}
- Total transações (30d): ${recentTransactions.length}
- Categorias mais ativas: ${transactionsData.data?.slice(0, 3).map(t => t.payment_type).join(', ') || 'N/A'}

📅 AGENDA E REUNIÕES:
- Reuniões próximas: ${meetingsData.data?.filter(m => new Date(m.meeting_date) > now).length || 0}
- Status agenda: ${meetingsData.data?.map(m => m.status).join(', ') || 'Livre'}

🎯 HÁBITOS E ROTINAS:
- Hábitos ativos: ${habitsData.data?.length || 0}
- Streaks médios: ${habitsData.data?.reduce((sum, h) => sum + h.streak, 0) / (habitsData.data?.length || 1) || 0}

🔍 ANÁLISE DE SENTIMENTO: ${sentiment}
⚡ CONTEÚDO ACIONÁVEL: ${actionable ? 'Sim' : 'Não'}

DADOS RECENTES:
Tarefas: ${tasksData.data?.slice(0, 5).map(t => `- ${t.title} (${t.completed ? 'Concluída' : 'Pendente'}, ${t.priority})`).join('\n') || 'Nenhuma tarefa'}
Transações: ${transactionsData.data?.slice(0, 3).map(t => `- R$ ${t.amount} - ${t.description} (${new Date(t.date).toLocaleDateString()})`).join('\n') || 'Nenhuma transação'}
Reuniões: ${meetingsData.data?.slice(0, 3).map(m => `- ${m.title} em ${new Date(m.meeting_date).toLocaleDateString()} (${m.status})`).join('\n') || 'Nenhuma reunião'}`;

      } catch (error) {
        console.error('Error fetching advanced user context:', error);
        advancedUserContext = 'Dados de contexto temporariamente indisponíveis';
      }
    }

    // Advanced system prompt for intelligent responses
    const advancedSystemPrompt = `Você é o DilQ Orbe AI, um assistente virtual de PRÓXIMA GERAÇÃO com capacidades avançadas de análise, predição e automação.

CARACTERÍSTICAS PRINCIPAIS:
🧠 INTELIGÊNCIA AVANÇADA: Analise padrões, identifique tendências e faça predições
🚀 PROATIVIDADE: Sugira ações antes que o usuário peça
📊 ANÁLISE PROFUNDA: Interprete dados e forneça insights acionáveis
⚡ AUTOMAÇÃO: Proponha automatizações e otimizações
🎯 PERSONALIZAÇÃO: Adapte respostas ao perfil e contexto do usuário
💡 INOVAÇÃO: Sugira soluções criativas e tecnológicas

CAPACIDADES ESPECIAIS:
- Análise preditiva de produtividade
- Otimização de agenda baseada em energia/foco
- Insights financeiros e oportunidades de economia
- Detecção de padrões comportamentais
- Sugestões de automação de tarefas
- Planejamento estratégico personalizado
- Análise de sentimentos e bem-estar

ESTILO DE COMUNICAÇÃO:
- Use emojis e formatação rica (markdown)
- Seja conciso mas profundo
- Forneça insights acionáveis
- Use dados para fundamentar sugestões
- Mantenha tom futurístico mas acessível
- Sempre inclua próximos passos

COMANDOS ESPECIAIS QUE VOCÊ ENTENDE:
- "Analise [período/aspecto]" → Análise profunda com métricas
- "Otimize [área]" → Sugestões de melhoria específicas
- "Preveja [situação]" → Predições baseadas em dados
- "Automatize [processo]" → Propostas de automação
- "Planeje [objetivo]" → Estratégia detalhada
- "Compare [períodos]" → Análise comparativa

${advancedUserContext}

INSTRUÇÕES ESPECIAIS:
- Se a mensagem menciona análise, forneça métricas específicas
- Se pede planejamento, crie cronograma detalhado
- Se solicita otimização, identifique gargalos e soluções
- Para predições, use tendências dos dados
- Sempre sugira 2-3 ações concretas
- Use dados do contexto para personalizar respostas`;

    console.log('Making advanced request to OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: advancedSystemPrompt },
          ...(context || []),
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorData);
      } catch {
        errorDetails = { error: { message: errorData } };
      }
      
      return new Response(JSON.stringify({ 
        error: 'Erro na API OpenAI',
        details: errorDetails.error?.message || 'Erro desconhecido',
        status: response.status,
        type: errorDetails.error?.type || 'unknown_error'
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Generate smart suggestions based on response content
    const smartSuggestions = generateSmartSuggestions(message, aiResponse);

    console.log('Advanced AI response generated successfully');

    return new Response(JSON.stringify({ 
      response: aiResponse,
      suggestions: smartSuggestions,
      category: categorizeResponse(message),
      sentiment: 'positive'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in advanced ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error.message || 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateSmartSuggestions(userMessage: string, aiResponse: string): string[] {
  const message = userMessage.toLowerCase();
  const response = aiResponse.toLowerCase();
  
  const suggestions: string[] = [];
  
  // Context-aware suggestions
  if (message.includes('produtiv') || response.includes('produtiv')) {
    suggestions.push(
      "Crie um dashboard de produtividade personalizado",
      "Analise padrões de energia ao longo do dia",
      "Configure alertas inteligentes para deadlines"
    );
  }
  
  if (message.includes('financ') || response.includes('financ')) {
    suggestions.push(
      "Previsão de gastos para os próximos 3 meses",
      "Identifique oportunidades de investimento",
      "Configure automação de poupança"
    );
  }
  
  if (message.includes('agenda') || message.includes('reunião')) {
    suggestions.push(
      "Otimize agenda baseado em biorhythm",
      "Analise eficácia de reuniões passadas",
      "Configure blocos de tempo para deep work"
    );
  }
  
  if (message.includes('analise') || message.includes('relatorio')) {
    suggestions.push(
      "Gere relatório semanal automatizado",
      "Compare performance com mês anterior",
      "Identifique tendências e padrões ocultos"
    );
  }
  
  // Default suggestions if none match
  if (suggestions.length === 0) {
    suggestions.push(
      "Analise meu desempenho desta semana",
      "Crie um plano de ação para amanhã",
      "Identifique oportunidades de otimização",
      "Configure automações inteligentes"
    );
  }
  
  return suggestions.slice(0, 4);
}

function categorizeResponse(message: string): string {
  const msg = message.toLowerCase();
  
  if (msg.includes('analise') || msg.includes('dados') || msg.includes('relatorio')) return 'analytics';
  if (msg.includes('plano') || msg.includes('estrateg') || msg.includes('objetivo')) return 'planning';
  if (msg.includes('financ') || msg.includes('gasto') || msg.includes('orcamento')) return 'financial';
  if (msg.includes('produtiv') || msg.includes('tarefa') || msg.includes('efici')) return 'productivity';
  if (msg.includes('reuniao') || msg.includes('agenda') || msg.includes('cronograma')) return 'scheduling';
  
  return 'general';
}
