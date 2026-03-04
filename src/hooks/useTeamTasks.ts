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
    priority?: 'high' | 'medium' | 'low';
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
        mutationFn: async ({ member_id, title, due_date, priority }: { member_id: string; title: string; due_date: string; priority?: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");
            const { data, error } = await supabase
                .from("team_tasks" as any)
                .insert({ member_id, title, due_date, user_id: user.id, completed: false, priority: priority ?? 'medium' })
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

    // Complete ALL pending tasks for a given member
    const completeAllMutation = useMutation({
        mutationFn: async (member_id: string) => {
            const pending = tasks.filter(t => t.member_id === member_id && !t.completed).map(t => t.id);
            if (pending.length === 0) { toast.info("Nenhuma tarefa pendente."); return; }
            const { error } = await supabase
                .from("team_tasks" as any)
                .update({ completed: true })
                .in("id", pending);
            if (error) { toast.error("Erro ao concluir tarefas"); throw error; }
            toast.success(`${pending.length} tarefa(s) concluída(s)!`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-tasks", selectedDate] })
    });

    // Carry over unfinished tasks from the previous day
    const carryOverMutation = useMutation({
        mutationFn: async (member_id: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const today = new Date(selectedDate + "T12:00:00");
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            const { data: prevTasks, error } = await supabase
                .from("team_tasks" as any)
                .select("*")
                .eq("user_id", user.id)
                .eq("member_id", member_id)
                .eq("due_date", yesterdayStr)
                .eq("completed", false);

            if (error) { toast.error("Erro ao buscar tarefas do dia anterior"); throw error; }
            const prev = (prevTasks as unknown) as TeamTask[];
            if (!prev || prev.length === 0) { toast.info("Nenhuma tarefa pendente do dia anterior."); return; }

            const todayTitles = tasks.filter(t => t.member_id === member_id).map(t => t.title);
            const toCarry = prev.filter(t => !todayTitles.includes(t.title));
            if (toCarry.length === 0) { toast.info("Todas já foram importadas."); return; }

            const { error: insertErr } = await supabase.from("team_tasks" as any).insert(
                toCarry.map(t => ({ member_id, title: t.title, due_date: selectedDate, user_id: user.id, completed: false, priority: t.priority ?? 'medium' }))
            );
            if (insertErr) { toast.error("Erro ao importar tarefas"); throw insertErr; }
            toast.success(`${toCarry.length} tarefa(s) importada(s) do dia anterior!`);
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
        completeAllForMember: completeAllMutation.mutate,
        carryOverFromYesterday: carryOverMutation.mutate,
    };
};
