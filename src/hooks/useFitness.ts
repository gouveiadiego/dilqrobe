import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FitnessProfile {
    id: string;
    user_id: string;
    name: string;
    color: string;
    gender: 'male' | 'female';
    birth_date: string | null;
    height_cm: number | null;
    goal_weight: number | null;
    goal_body_fat: number | null;
    goal_waist: number | null;
    notes: string | null;
    created_at: string;
}

export interface FitnessMeasurement {
    id: string;
    profile_id: string;
    user_id: string;
    measured_at: string;
    weight_kg: number | null;
    bmi: number | null;
    body_fat_pct: number | null;
    fat_mass_kg: number | null;
    muscle_mass_kg: number | null;
    skeletal_muscle_pct: number | null;
    water_pct: number | null;
    bone_mass_kg: number | null;
    visceral_fat: number | null;
    bmr_kcal: number | null;
    protein_pct: number | null;
    metabolic_age: number | null;
    notes: string | null;
    created_at: string;
}

export interface BodyMeasurement {
    id: string;
    profile_id: string;
    user_id: string;
    measured_at: string;
    chest_cm: number | null;
    waist_cm: number | null;
    abdomen_cm: number | null;
    hip_cm: number | null;
    left_arm_cm: number | null;
    right_arm_cm: number | null;
    left_thigh_cm: number | null;
    right_thigh_cm: number | null;
    left_calf_cm: number | null;
    right_calf_cm: number | null;
    neck_cm: number | null;
    created_at: string;
}

export const useFitness = (activeProfileId?: string | null) => {
    const queryClient = useQueryClient();

    // --- PROFILES ---
    const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
        queryKey: ["fitness-profiles"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            const { data, error } = await supabase
                .from("fitness_profiles" as any)
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: true });
            if (error) { toast.error("Erro ao carregar perfis"); throw error; }
            return (data as unknown) as FitnessProfile[];
        }
    });

    const addProfileMutation = useMutation({
        mutationFn: async (profile: Partial<FitnessProfile>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");
            const { data, error } = await supabase
                .from("fitness_profiles" as any)
                .insert({ ...profile, user_id: user.id })
                .select()
                .single();
            if (error) { toast.error("Erro ao criar perfil"); throw error; }
            toast.success("Perfil criado com sucesso!");
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fitness-profiles"] })
    });

    const deleteProfileMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("fitness_profiles" as any).delete().eq("id", id);
            if (error) { toast.error("Erro ao deletar perfil"); throw error; }
            toast.success("Perfil removido.");
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fitness-profiles"] })
    });

    const updateProfileMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<FitnessProfile> }) => {
            const { error } = await supabase.from("fitness_profiles" as any).update(updates).eq("id", id);
            if (error) { toast.error("Erro ao atualizar metas"); throw error; }
            toast.success("Metas atualizadas!");
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fitness-profiles"] })
    });

    // --- BIOIMPEDANCE MEASUREMENTS ---
    const { data: measurements = [], isLoading: loadingMeasurements } = useQuery({
        queryKey: ["fitness-measurements", activeProfileId],
        queryFn: async () => {
            if (!activeProfileId) return [];
            const { data, error } = await supabase
                .from("fitness_measurements" as any)
                .select("*")
                .eq("profile_id", activeProfileId)
                .order("measured_at", { ascending: false })
                .order("created_at", { ascending: false });
            if (error) { toast.error("Erro ao carregar bioimpedância"); throw error; }
            return (data as unknown) as FitnessMeasurement[];
        },
        enabled: !!activeProfileId
    });

    const addMeasurementMutation = useMutation({
        mutationFn: async (measurement: Partial<FitnessMeasurement>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");
            const { data, error } = await supabase
                .from("fitness_measurements" as any)
                .insert({ ...measurement, user_id: user.id })
                .select()
                .single();
            if (error) { toast.error("Erro ao salvar medição"); throw error; }
            toast.success("Medição salva com sucesso!");
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fitness-measurements", activeProfileId] })
    });

    const deleteMeasurementMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("fitness_measurements" as any).delete().eq("id", id);
            if (error) { toast.error("Erro ao deletar medição"); throw error; }
            toast.success("Medição removida.");
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fitness-measurements", activeProfileId] })
    });

    // --- BODY MEASUREMENTS ---
    const { data: bodyMeasurements = [], isLoading: loadingBodyMeasurements } = useQuery({
        queryKey: ["body-measurements", activeProfileId],
        queryFn: async () => {
            if (!activeProfileId) return [];
            const { data, error } = await supabase
                .from("body_measurements" as any)
                .select("*")
                .eq("profile_id", activeProfileId)
                .order("measured_at", { ascending: false })
                .order("created_at", { ascending: false });
            if (error) { toast.error("Erro ao carregar medidas"); throw error; }
            return (data as unknown) as BodyMeasurement[];
        },
        enabled: !!activeProfileId
    });

    const addBodyMeasurementMutation = useMutation({
        mutationFn: async (measurement: Partial<BodyMeasurement>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");
            const { data, error } = await supabase
                .from("body_measurements" as any)
                .insert({ ...measurement, user_id: user.id })
                .select()
                .single();
            if (error) { toast.error("Erro ao salvar medidas"); throw error; }
            toast.success("Medidas corporais salvas!");
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["body-measurements", activeProfileId] })
    });

    const deleteBodyMeasurementMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("body_measurements" as any).delete().eq("id", id);
            if (error) { toast.error("Erro ao deletar medidas"); throw error; }
            toast.success("Medidas corporais removidas.");
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["body-measurements", activeProfileId] })
    });

    return {
        profiles,
        measurements,
        bodyMeasurements,
        isLoading: loadingProfiles || loadingMeasurements || loadingBodyMeasurements,
        addProfile: addProfileMutation.mutate,
        deleteProfile: deleteProfileMutation.mutate,
        updateProfile: updateProfileMutation.mutate,
        addMeasurement: addMeasurementMutation.mutate,
        deleteMeasurement: deleteMeasurementMutation.mutate,
        addBodyMeasurement: addBodyMeasurementMutation.mutate,
        deleteBodyMeasurement: deleteBodyMeasurementMutation.mutate,
    };
};
