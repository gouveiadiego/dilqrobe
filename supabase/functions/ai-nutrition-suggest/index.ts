// Edge function: suggests meals to close remaining macro gaps for the day
// Uses Lovable AI Gateway (google/gemini-2.5-flash) with structured tool calling

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Remaining {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const remaining: Remaining = body.remaining || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
    const isWorkoutDay: boolean = !!body.isWorkoutDay;
    const restrictions: string = body.restrictions || "";

    const prompt = `Sou ${isWorkoutDay ? "dia de TREINO" : "dia de DESCANSO"} e ainda preciso atingir hoje:
- ${Math.max(0, remaining.calories).toFixed(0)} kcal
- ${Math.max(0, remaining.protein_g).toFixed(0)}g de proteína
- ${Math.max(0, remaining.carbs_g).toFixed(0)}g de carboidrato
- ${Math.max(0, remaining.fat_g).toFixed(0)}g de gordura

${restrictions ? `Restrições: ${restrictions}` : ""}

Sugira 3 opções de refeição simples, brasileiras, que somadas cheguem bem perto desses números. Para CADA opção retorne uma lista de itens prontos para serem registrados (nome do alimento, quantidade, unidade, proteína, carbo, gordura, calorias). Seja realista nos macros.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "sugerir_refeicoes",
          description: "Sugere 2-3 opções de refeição com itens detalhados para fechar as metas do dia.",
          parameters: {
            type: "object",
            properties: {
              opcoes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    titulo: { type: "string", description: "Nome curto da refeição (ex: 'Frango com batata doce')" },
                    descricao: { type: "string" },
                    itens: {
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
                          calorias: { type: "number" },
                        },
                        required: ["nome", "quantidade", "unidade", "proteina_g", "carbo_g", "gordura_g", "calorias"],
                      },
                    },
                  },
                  required: ["titulo", "itens"],
                },
              },
            },
            required: ["opcoes"],
          },
        },
      },
    ];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um nutricionista brasileiro prático. Responda SEMPRE chamando a tool sugerir_refeicoes." },
          { role: "user", content: prompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "sugerir_refeicoes" } },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Limite de uso de IA atingido. Tente novamente em alguns segundos." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: "AI Gateway error", details: t }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments ? JSON.parse(call.function.arguments) : { opcoes: [] };

    return new Response(JSON.stringify(args), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error", details: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
