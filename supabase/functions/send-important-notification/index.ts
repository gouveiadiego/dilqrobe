
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

interface NotificationBody {
  user_id: string;
  notification_text: string;
}

async function getUserEmail(user_id: string): Promise<string | null> {
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user_id}&select=email`,
    {
      headers: {
        apiKey: SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  if (!resp.ok) {
    console.log('Could not fetch user profile for user', user_id);
    return null;
  }
  const data = await resp.json();
  // email pode não estar preenchido, nesse caso pegar do auth
  if (data.length && data[0]?.email) return data[0].email;
  // fallback: buscar no auth (não exposto, não disponível via REST para função Edge)
  return null;
}

async function shouldSendByAI(notificationText: string): Promise<boolean> {
  // Use OpenAI para decidir se a notificação é realmente importante
  try {
    const prompt = `
    Recebi a seguinte notificação para enviar ao usuário:
    """${notificationText}"""
    Ela deve ser enviada por e-mail, pois é realmente importante? 
    Responda somente "Sim" se for crucial e "Não" caso não seja.
    `;
    const result = await fetch('https://api.openai.com/v1/chat/completions', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um assistente de notificações que responde apenas: Sim (para importantes) ou Não (para triviais)." },
          { role: "user", content: prompt },
        ],
        max_tokens: 3,
        temperature: 0,
      }),
    });
    if (!result.ok) return false;
    const data = await result.json();
    const output = (data.choices?.[0]?.message?.content || "").trim().toLowerCase();
    return output.startsWith("sim");
  } catch (e) {
    console.error('Erro IA notificação:', e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, notification_text }: NotificationBody = await req.json();
    if (!user_id || !notification_text)
      return new Response(
        JSON.stringify({ error: "user_id e notification_text obrigatórios" }),
        { status: 400, headers: corsHeaders }
      );

    // Buscar e-mail do usuário
    const email = await getUserEmail(user_id);
    if (!email)
      return new Response(
        JSON.stringify({ error: "Email do usuário não encontrado" }),
        { status: 404, headers: corsHeaders }
      );

    // Decidir se deve enviar por IA
    const allowed = await shouldSendByAI(notification_text);
    if (!allowed) {
      return new Response(
        JSON.stringify({ sent: false, message: "Notificação não considerada importante o suficiente" }),
        { headers: corsHeaders }
      );
    }

    // Enviar e-mail via Resend
    const result = await resend.emails.send({
      from: "Notificações DilQ <notificacoes@resend.dev>",
      to: [email],
      subject: "Notificação importante do DilQ",
      html: `
        <h2>Você recebeu uma notificação importante</h2>
        <p>${notification_text}</p>
      `,
    });

    return new Response(
      JSON.stringify({ sent: true, result }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Erro envio notificação:", error);
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
