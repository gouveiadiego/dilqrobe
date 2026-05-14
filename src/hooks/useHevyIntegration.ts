import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HevyIntegration {
    id: string;
    user_id: string;
    api_key: string;
    is_active: boolean;
    webhook_secret: string;
    last_sync_at: string | null;
    workout_count: number;
    created_at: string;
    updated_at: string;
}

export interface HevyExerciseSet {
    weight_kg: number | null;
    reps: number | null;
    type: string;
}

export interface HevyExercise {
    title: string;
    muscle_group: string | null;
    sets: HevyExerciseSet[];
}

export interface HevyWorkout {
    id: string;
    user_id: string;
    hevy_workout_id: string;
    workout_date: string;
    title: string;
    description: string | null;
    duration_seconds: number | null;
    volume_kg: number;
    exercise_count: number;
    set_count: number;
    muscle_groups: string[];
    exercises: HevyExercise[];
    synced_at: string;
}

// ─── Helper: call the hevy-proxy Edge Function ───────────────────────────────

async function callHevyProxy(action: string, extra?: Record<string, unknown>) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const resp = await supabase.functions.invoke("hevy-proxy", {
        body: { action, ...extra },
    });

    if (resp.error) throw new Error(resp.error.message);
    return resp.data;
}

// ─── useHevyIntegration ───────────────────────────────────────────────────────

export const useHevyIntegration = () => {
    const queryClient = useQueryClient();

    // Fetch current integration config
    const { data: integration, isLoading } = useQuery<HevyIntegration | null>({
        queryKey: ["hevy-integration"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from("hevy_integrations" as any)
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) throw error;
            return (data as unknown) as HevyIntegration | null;
        },
    });

    // Save / update API key
    const saveKeyMutation = useMutation({
        mutationFn: async (apiKey: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from("hevy_integrations" as any)
                .upsert({ user_id: user.id, api_key: apiKey, is_active: true }, {
                    onConflict: "user_id",
                });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["hevy-integration"] });
            toast.success("API Key salva com sucesso!");
        },
        onError: () => toast.error("Erro ao salvar API Key"),
    });

    // Test connection
    const testConnectionMutation = useMutation({
        mutationFn: async () => {
            const result = await callHevyProxy("test_connection");
            return result as { success: boolean; workout_count: number };
        },
        onSuccess: (data) => {
            toast.success(`✅ Conexão OK! ${data.workout_count} treinos encontrados.`);
        },
        onError: (err: Error) => {
            toast.error(`❌ Falha na conexão: ${err.message}`);
        },
    });

    // Sync workouts
    const syncMutation = useMutation({
        mutationFn: async () => {
            const result = await callHevyProxy("sync_workouts", { page: 1 });
            return result as { success: boolean; synced: number };
        },
        onSuccess: (data) => {
            toast.success(`🏋️ ${data.synced} treinos sincronizados!`);
            queryClient.invalidateQueries({ queryKey: ["hevy-workouts"] });
            queryClient.invalidateQueries({ queryKey: ["hevy-integration"] });
        },
        onError: () => toast.error("Erro ao sincronizar treinos"),
    });

    // Sync ALL historical workouts
    const syncAllMutation = useMutation({
        mutationFn: async () => {
            const result = await callHevyProxy("sync_workouts", { page: 1, fetchAll: true });
            return result as { success: boolean; synced: number };
        },
        onSuccess: (data) => {
            toast.success(`🏆 ${data.synced} treinos históricos sincronizados!`);
            queryClient.invalidateQueries({ queryKey: ["hevy-workouts"] });
            queryClient.invalidateQueries({ queryKey: ["hevy-integration"] });
        },
        onError: () => toast.error("Erro ao sincronizar histórico"),
    });

    // Delete integration
    const deleteIntegrationMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");
            const { error } = await supabase
                .from("hevy_integrations" as any)
                .delete()
                .eq("user_id", user.id);
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Integração removida.");
            queryClient.invalidateQueries({ queryKey: ["hevy-integration"] });
            queryClient.invalidateQueries({ queryKey: ["hevy-workouts"] });
        },
    });

    return {
        integration,
        isLoading,
        isConnected: !!integration?.is_active,
        saveKey: saveKeyMutation.mutateAsync,
        isSavingKey: saveKeyMutation.isPending,
        testConnection: testConnectionMutation.mutateAsync,
        isTestingConnection: testConnectionMutation.isPending,
        syncWorkouts: syncMutation.mutateAsync,
        isSyncing: syncMutation.isPending,
        syncAllWorkouts: syncAllMutation.mutateAsync,
        isSyncingAll: syncAllMutation.isPending,
        deleteIntegration: deleteIntegrationMutation.mutate,
    };
};

// ─── useHevyWorkouts ──────────────────────────────────────────────────────────

export const useHevyWorkouts = () => {
    const { data: workouts = [], isLoading } = useQuery<HevyWorkout[]>({
        queryKey: ["hevy-workouts"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            const { data, error } = await supabase
                .from("hevy_workouts_cache" as any)
                .select("*")
                .eq("user_id", user.id)
                .order("workout_date", { ascending: false })
                .limit(200);

            if (error) { toast.error("Erro ao carregar treinos"); throw error; }
            return (data as unknown) as HevyWorkout[];
        },
    });

    return { workouts, isLoading };
};
