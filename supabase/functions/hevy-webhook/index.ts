import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HEVY_BASE_URL = "https://api.hevyapp.com";

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Webhook Authentication via Bearer Token (webhook_secret)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const secret = authHeader.replace("Bearer ", "").trim();

    // Init Supabase with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Identify user by webhook_secret
    const { data: integration, error: intError } = await supabase
      .from("hevy_integrations")
      .select("user_id, api_key, is_active")
      .eq("webhook_secret", secret)
      .single();

    if (intError || !integration) {
      return new Response(JSON.stringify({ error: "Integration not found for this secret" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!integration.is_active) {
      return new Response(JSON.stringify({ error: "Hevy integration is disabled for this user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Parse Hevy Webhook payload
    const body = await req.json();
    const workoutId = body.workoutId;

    if (!workoutId) {
      return new Response(JSON.stringify({ error: "Missing workoutId in payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Fetch full workout details from Hevy API
    const resp = await fetch(`${HEVY_BASE_URL}/v1/workouts/${workoutId}`, {
      headers: {
        "api-key": integration.api_key,
        "Content-Type": "application/json",
      },
    });

    if (!resp.ok) {
      const err = await resp.text();
      return new Response(JSON.stringify({ error: "Failed to fetch workout details from Hevy", details: err }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hevyWorkout = await resp.json();

    // 5. Parse and save to cache
    const parsedWorkout = parseWorkout(hevyWorkout, integration.user_id);
    
    const { error: upsertError } = await supabase
      .from("hevy_workouts_cache")
      .upsert([parsedWorkout], { onConflict: "user_id,hevy_workout_id" });

    if (upsertError) {
      throw upsertError;
    }

    // 6. Update integration metadata (workout count and sync time)
    const { data: countResp } = await supabase
      .from("hevy_workouts_cache")
      .select("id", { count: "exact", head: true })
      .eq("user_id", integration.user_id);

    await supabase
      .from("hevy_integrations")
      .update({
        last_sync_at: new Date().toISOString(),
        workout_count: countResp?.count || 0,
      })
      .eq("user_id", integration.user_id);

    return new Response(JSON.stringify({ success: true, workoutId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Hevy Webhook Error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── Helpers (same as proxy) ──────────────────────────────────────────────────

function getMuscleGroups(exercises: any[]): string[] {
  const groups = new Set<string>();
  for (const ex of exercises) {
    if (ex.muscle_group) groups.add(ex.muscle_group);
    if (ex.exercise_template?.muscle_group) groups.add(ex.exercise_template.muscle_group);
  }
  return Array.from(groups).filter(Boolean);
}

function computeVolume(exercises: any[]): number {
  let total = 0;
  for (const ex of exercises) {
    for (const set of ex.sets || []) {
      const weight = set.weight_kg ?? set.weight_lbs ? (set.weight_lbs * 0.453592) : 0;
      const reps = set.reps ?? 0;
      total += weight * reps;
    }
  }
  return Math.round(total * 100) / 100;
}

function parseWorkout(w: any, userId: string) {
  const exercises = w.exercises || [];
  const setCount = exercises.reduce((acc: number, ex: any) => acc + (ex.sets?.length ?? 0), 0);

  return {
    user_id: userId,
    hevy_workout_id: w.id,
    workout_date: w.start_time ? w.start_time.slice(0, 10) : new Date().toISOString().slice(0, 10),
    title: w.title || "Treino sem título",
    description: w.description || null,
    duration_seconds: w.end_time && w.start_time
      ? Math.round((new Date(w.end_time).getTime() - new Date(w.start_time).getTime()) / 1000)
      : null,
    volume_kg: computeVolume(exercises),
    exercise_count: exercises.length,
    set_count: setCount,
    muscle_groups: getMuscleGroups(exercises),
    exercises: exercises.map((ex: any) => ({
      title: ex.title || ex.exercise_template?.title || "Exercício",
      muscle_group: ex.muscle_group || ex.exercise_template?.muscle_group || null,
      sets: (ex.sets || []).map((s: any) => ({
        weight_kg: s.weight_kg ?? (s.weight_lbs ? s.weight_lbs * 0.453592 : null),
        reps: s.reps ?? null,
        type: s.type ?? "normal",
      })),
    })),
    raw_data: w,
  };
}
