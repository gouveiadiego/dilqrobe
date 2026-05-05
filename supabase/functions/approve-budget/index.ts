import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { token, action, name, reason } = body;

    if (!token || !["approve", "reject"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: budget, error: fetchErr } = await supabase
      .from("budgets")
      .select("id, status, valid_until")
      .eq("public_token", token)
      .maybeSingle();

    if (fetchErr || !budget) {
      return new Response(JSON.stringify({ error: "Orçamento não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (budget.status === "approved" || budget.status === "rejected") {
      return new Response(JSON.stringify({ error: "Este orçamento já foi respondido" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (budget.valid_until && new Date(budget.valid_until) < new Date()) {
      return new Response(JSON.stringify({ error: "Orçamento expirado" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    const now = new Date().toISOString();

    const update =
      action === "approve"
        ? {
            status: "approved",
            approved_at: now,
            approved_ip: ip,
            approved_name: name || null,
            approved_user_agent: ua,
          }
        : {
            status: "rejected",
            rejected_at: now,
            approved_ip: ip,
            approved_name: name || null,
            approved_user_agent: ua,
            rejection_reason: reason || null,
          };

    const { error: updErr } = await supabase
      .from("budgets")
      .update(update)
      .eq("public_token", token);

    if (updErr) {
      return new Response(JSON.stringify({ error: updErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, status: update.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
