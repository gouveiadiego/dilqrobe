import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HEVY_BASE_URL = "https://api.hevyapp.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate Supabase JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, page = 1, workoutId } = await req.json();

    // 2. Fetch the user's API key from hevy_integrations
    const { data: integration, error: integrationError } = await supabase
      .from("hevy_integrations")
      .select("api_key, is_active")
      .eq("user_id", user.id)
      .single();

    if (integrationError || !integration) {
      return new Response(JSON.stringify({ error: "Hevy integration not configured" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!integration.is_active) {
      return new Response(JSON.stringify({ error: "Hevy integration is disabled" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = integration.api_key;

    // 3. Route to correct Hevy API action
    switch (action) {
      case "test_connection": {
        const resp = await hevyFetch("/v1/workouts/count", apiKey);
        if (!resp.ok) {
          const err = await resp.text();
          return new Response(JSON.stringify({ error: "Invalid API key", details: err }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const data = await resp.json();
        return new Response(JSON.stringify({ success: true, workout_count: data.workout_count }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "sync_workouts": {
        // Fetch up to 3 pages (15 workouts per page = 45 workouts max per sync)
        const allWorkouts: any[] = [];
        let currentPage = page;
        let hasMore = true;
        const maxPages = 3;

        while (hasMore && currentPage <= page + maxPages - 1) {
          const resp = await hevyFetch(`/v1/workouts?page=${currentPage}&pageSize=15`, apiKey);
          if (!resp.ok) break;

          const data = await resp.json();
          const workouts = data.workouts || [];
          allWorkouts.push(...workouts);

          hasMore = workouts.length === 15;
          currentPage++;
        }

        // Parse and upsert each workout into cache
        const parsedWorkouts = allWorkouts.map((w: any) => parseWorkout(w, user.id));

        if (parsedWorkouts.length > 0) {
          const { error: upsertError } = await supabase
            .from("hevy_workouts_cache")
            .upsert(parsedWorkouts, { onConflict: "user_id,hevy_workout_id" });

          if (upsertError) {
            console.error("Upsert error:", upsertError);
          }
        }

        // Update last_sync_at and workout_count
        const { data: countResp } = await supabase
          .from("hevy_workouts_cache")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        await supabase
          .from("hevy_integrations")
          .update({
            last_sync_at: new Date().toISOString(),
            workout_count: parsedWorkouts.length,
          })
          .eq("user_id", user.id);

        return new Response(
          JSON.stringify({ success: true, synced: parsedWorkouts.length, has_more: hasMore }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_workout_detail": {
        if (!workoutId) {
          return new Response(JSON.stringify({ error: "workoutId is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const resp = await hevyFetch(`/v1/workouts/${workoutId}`, apiKey);
        if (!resp.ok) {
          return new Response(JSON.stringify({ error: "Workout not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const data = await resp.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    console.error("hevy-proxy error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", details: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper: fetch from Hevy API with the user's key
async function hevyFetch(path: string, apiKey: string): Promise<Response> {
  return fetch(`${HEVY_BASE_URL}${path}`, {
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
  });
}

// Helper: extract muscle groups from exercises
function getMuscleGroups(exercises: any[]): string[] {
  const groups = new Set<string>();
  for (const ex of exercises) {
    if (ex.muscle_group) groups.add(ex.muscle_group);
    if (ex.exercise_template?.muscle_group) groups.add(ex.exercise_template.muscle_group);
  }
  return Array.from(groups).filter(Boolean);
}

// Helper: compute total volume (sum of weight × reps across all sets)
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

// Helper: parse a raw Hevy workout into our cache schema
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
