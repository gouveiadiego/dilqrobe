
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Pega a chave da API do Gemini dos segredos do projeto
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para chamar a API do Gemini
async function callGemini(prompt: string) {
  if (!geminiApiKey) {
    console.error('A chave GEMINI_API_KEY não está configurada!');
    throw new Error('A chave da API Gemini (GEMINI_API_KEY) não está configurada nos segredos da Edge Function.');
  }

  // Usamos o modelo gemini-1.5-flash que é rápido e eficiente
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 2048,
        // Garantimos que a resposta será um JSON, como o front-end espera
        responseMimeType: "application/json",
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
    console.error('Resposta inválida da Gemini:', data);
    throw new Error('Formato de resposta inválido da API Gemini.');
  }

  return data.candidates[0].content.parts[0].text;
}

// Servidor principal da Edge Function
serve(async (req) => {
  // Trata requisições de CORS (necessário para o navegador)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'O prompt é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Chama a Gemini e obtém o texto gerado
    const generatedText = await callGemini(prompt);

    // Retorna o texto para o front-end
    return new Response(JSON.stringify({ generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função generate-with-ai:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error.message || 'Erro desconhecido'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
