import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface TeamMember {
    id: string;
    user_id: string;
    name: string;
    color: string;
    created_at: string;
}

export interface TeamTask {
    id: string;
    user_id: string;
    member_id: string;
    title: string;
    completed: boolean;
    due_date: string;
    notes?: string;
    created_at: string;
}

export const useTeamTasks = (selectedDate: string) => {
    const queryClient = useQueryClient();

    // ---- MEMBERS ----
    const { data: members = [], isLoading: membersLoading } = useQuery({
        queryKey: ["team-members"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            const { data, error } = await supabase
                .from("team_members" as any)
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: true });
            if (error) { toast.error("Erro ao carregar membros da equipe"); throw error; }
            return (data as unknown) as TeamMember[];
        }
    });

    const addMemberMutation = useMutation({
        mutationFn: async ({ name, color }: { name: string; color: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");
            const { data, error } = await supabase
                .from("team_members" as any)
                .insert({ name, color, user_id: user.id })
                .select()
                .single();
            if (error) { toast.error("Erro ao adicionar membro"); throw error; }
            toast.success(`${name} adicionado(a) à equipe!`);
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-members"] })
    });

    const deleteMemberMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("team_members" as any).delete().eq("id", id);
            if (error) { toast.error("Erro ao remover membro"); throw error; }
            toast.success("Membro removido da equipe");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team-members"] });
            queryClient.invalidateQueries({ queryKey: ["team-tasks", selectedDate] });
        }
    });

    // ---- TASKS ----
    const { data: tasks = [], isLoading: tasksLoading } = useQuery({
        queryKey: ["team-tasks", selectedDate],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            const { data, error } = await supabase
                .from("team_tasks" as any)
                .select("*")
                .eq("user_id", user.id)
                .eq("due_date", selectedDate)
                .order("created_at", { ascending: true });
            if (error) { toast.error("Erro ao carregar tarefas da equipe"); throw error; }
            return (data as unknown) as TeamTask[];
        },
        enabled: !!selectedDate
    });

    const addTaskMutation = useMutation({
        mutationFn: async ({ member_id, title, due_date }: { member_id: string; title: string; due_date: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");
            const { data, error } = await supabase
                .from("team_tasks" as any)
                .insert({ member_id, title, due_date, user_id: user.id, completed: false })
                .select()
                .single();
            if (error) { toast.error("Erro ao adicionar tarefa"); throw error; }
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-tasks", selectedDate] })
    });

    const toggleTaskMutation = useMutation({
        mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
            const { error } = await supabase
                .from("team_tasks" as any)
                .update({ completed })
                .eq("id", id);
            if (error) { toast.error("Erro ao atualizar tarefa"); throw error; }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-tasks", selectedDate] })
    });

    const deleteTaskMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("team_tasks" as any).delete().eq("id", id);
            if (error) { toast.error("Erro ao remover tarefa"); throw error; }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-tasks", selectedDate] })
    });

    return {
        members,
        tasks,
        isLoading: membersLoading || tasksLoading,
        addMember: addMemberMutation.mutate,
        deleteMember: deleteMemberMutation.mutate,
        addTask: addTaskMutation.mutate,
        toggleTask: toggleTaskMutation.mutate,
        deleteTask: deleteTaskMutation.mutate,
    };
};
