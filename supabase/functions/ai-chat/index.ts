
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
    const { message, context, userId } = await req.json();
    console.log('AI Chat request:', { message, userId, hasContext: !!context });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client to get user data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user data for context
    let userContext = '';
    if (userId) {
      try {
        // Get recent tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('title, completed, priority, due_date, category')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        // Get recent transactions
        const { data: transactions } = await supabase
          .from('transactions')
          .select('description, amount, date, payment_type')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(10);

        // Get meetings
        const { data: meetings } = await supabase
          .from('meetings')
          .select('title, meeting_date, status')
          .eq('user_id', userId)
          .order('meeting_date', { ascending: false })
          .limit(5);

        if (tasks?.length || transactions?.length || meetings?.length) {
          userContext = `\nContexto do usuário:
Tarefas recentes: ${tasks?.map(t => `- ${t.title} (${t.completed ? 'concluída' : 'pendente'}, prioridade: ${t.priority})`).join('\n') || 'Nenhuma tarefa'}
Transações recentes: ${transactions?.map(t => `- ${t.description}: R$ ${t.amount} (${t.date})`).join('\n') || 'Nenhuma transação'}
Reuniões: ${meetings?.map(m => `- ${m.title} em ${new Date(m.meeting_date).toLocaleDateString()} (${m.status})`).join('\n') || 'Nenhuma reunião'}`;
        }
      } catch (error) {
        console.error('Error fetching user context:', error);
      }
    }

    const systemPrompt = `Você é um assistente virtual inteligente integrado ao sistema DilQ Orbe, uma plataforma de produtividade pessoal. 

Suas funcionalidades principais:
- Ajudar com gestão de tarefas, finanças e reuniões
- Fornecer insights baseados nos dados do usuário
- Sugerir melhorias de produtividade
- Responder perguntas sobre o sistema
- Interpretar comandos em linguagem natural

Características:
- Seja conciso e direto
- Use linguagem brasileira informal
- Forneça dicas práticas
- Sugira ações específicas quando relevante
- Se o usuário quiser adicionar algo, explique como fazer no sistema

Comandos que você pode interpretar:
- "Adicionar tarefa [nome] para [data]" 
- "Registrar gasto de R$ [valor] com [descrição]"
- "Agendar reunião [título] para [data/hora]"
- "Como está minha produtividade?"
- "Resumo financeiro"

${userContext}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...(context || []),
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI response generated successfully');

    return new Response(JSON.stringify({ 
      response: aiResponse,
      suggestions: [
        "Como posso ser mais produtivo?",
        "Resumo das minhas atividades",
        "Sugestões para economizar",
        "Próximas tarefas importantes"
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro ao processar solicitação',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
