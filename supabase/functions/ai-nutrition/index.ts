import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callAI(text: string) {
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY não está configurada.');
  }

  const systemPrompt = `Você é um assistente de nutrição. Identifique todos os alimentos consumidos, estime quantidades e calcule macros (proteína, carboidrato, gordura em gramas) e calorias de cada um, além do total.
Regras: proteína ~4 kcal/g, carboidrato ~4 kcal/g, gordura ~9 kcal/g. As calorias devem bater com (prot*4 + carbo*4 + gord*9).`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Refeição consumida: "${text}"` },
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'registrar_refeicao',
          description: 'Registra os alimentos identificados com seus macros e calorias',
          parameters: {
            type: 'object',
            properties: {
              alimentos: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    nome: { type: 'string' },
                    quantidade: { type: 'number' },
                    unidade: { type: 'string' },
                    proteina_g: { type: 'number' },
                    carbo_g: { type: 'number' },
                    gordura_g: { type: 'number' },
                    calorias: { type: 'number' },
                  },
                  required: ['nome', 'quantidade', 'unidade', 'proteina_g', 'carbo_g', 'gordura_g', 'calorias'],
                  additionalProperties: false,
                },
              },
              total: {
                type: 'object',
                properties: {
                  proteina_g: { type: 'number' },
                  carbo_g: { type: 'number' },
                  gordura_g: { type: 'number' },
                  calorias: { type: 'number' },
                },
                required: ['proteina_g', 'carbo_g', 'gordura_g', 'calorias'],
                additionalProperties: false,
              },
            },
            required: ['alimentos', 'total'],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: 'function', function: { name: 'registrar_refeicao' } },
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Erro Lovable AI:', response.status, errorData);
    if (response.status === 429) {
      throw new Error('Limite de requisições atingido. Aguarde um momento e tente novamente.');
    }
    if (response.status === 402) {
      throw new Error('Créditos do AI Gateway esgotados. Adicione créditos em Settings > Workspace > Usage.');
    }
    throw new Error(`Erro Lovable AI: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error('Resposta inválida da IA.');
  }
  return JSON.parse(toolCall.function.arguments);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'O texto da refeição é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await callAI(text);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erro na função ai-nutrition:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Erro desconhecido',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
