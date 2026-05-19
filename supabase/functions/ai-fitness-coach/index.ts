// Edge function: AI Fitness Coach
// Recebe contexto da semana (treinos, nutrição, daily log) e devolve uma análise
// curta + recomendações práticas via Lovable AI Gateway (gemini-2.5-flash).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { weekSummary, todaySummary, goals, profile } = body;

    const prompt = `Você é meu coach de fitness/nutrição. Analise os dados abaixo e devolva:
1. Diagnóstico curto da semana (2-3 frases).
2. O que está dando certo (até 2 bullets).
3. O que ajustar essa semana (até 3 bullets, bem práticos e específicos com números).
4. Próxima ação de hoje (1 frase imperativa).

PERFIL: ${JSON.stringify(profile)}
METAS DIÁRIAS: ${JSON.stringify(goals)}
HOJE: ${JSON.stringify(todaySummary)}
ÚLTIMOS 7 DIAS: ${JSON.stringify(weekSummary)}

Seja direto, brasileiro, sem rodeios. Use markdown leve (negrito e bullets).`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um coach prático de musculação e nutrição. Responde em português do Brasil, curto, com números concretos." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Limite de uso de IA atingido. Tente novamente em alguns segundos." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: "AI Gateway error", details: t }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const message: string = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ message }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error", details: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
