import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callGemini(text: string) {
  if (!geminiApiKey) {
    throw new Error('A chave da API Gemini (GEMINI_API_KEY) não está configurada nos segredos da Edge Function.');
  }

  const prompt = `Você é um assistente de nutrição integrado a um sistema fitness.
  O usuário consumiu a seguinte refeição/alimento, descrito de forma livre:
  "${text}"

  Sua tarefa é identificar todos os alimentos consumidos, estimar suas quantidades, e calcular os macros (proteína, carboidrato, gordura) e calorias de cada um, além do total da refeição.

  RETORNE ESTRITAMENTE O JSON SOLICITADO NO SCHEMA, E MAIS NENHUM OUTRO TEXTO.
  Use as seguintes regras:
  - Proteína tem ~4 kcal por grama
  - Carboidrato tem ~4 kcal por grama
  - Gordura tem ~9 kcal por grama
  As calorias totais de cada alimento devem bater aproximadamente com a soma de (proteína*4 + carbo*4 + gordura*9).
  `

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            alimentos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  quantidade: { type: "number" },
                  unidade: { type: "string" },
                  proteina_g: { type: "number" },
                  carbo_g: { type: "number" },
                  gordura_g: { type: "number" },
                  calorias: { type: "number" }
                },
                required: ["nome", "quantidade", "unidade", "proteina_g", "carbo_g", "gordura_g", "calorias"]
              }
            },
            total: {
              type: "object",
              properties: {
                proteina_g: { type: "number" },
                carbo_g: { type: "number" },
                gordura_g: { type: "number" },
                calorias: { type: "number" }
              },
              required: ["proteina_g", "carbo_g", "gordura_g", "calorias"]
            }
          },
          required: ["alimentos", "total"]
        }
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Erro na API Gemini:', response.status, errorData);
    throw new Error(`Erro na API Gemini: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Formato de resposta inválido da API Gemini.');
  }

  return JSON.parse(data.candidates[0].content.parts[0].text);
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

    const result = await callGemini(text);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função ai-nutrition:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error.message || 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
