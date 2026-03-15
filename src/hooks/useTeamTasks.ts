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
    subtasks: { id: string; title: string; completed: boolean }[];
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
                .or(`due_date.eq.${selectedDate},and(due_date.lt.${selectedDate},completed.eq.false)`)
                .order("due_date", { ascending: true }) // Order by older date first
                .order("created_at", { ascending: true });
            if (error) { toast.error("Erro ao carregar tarefas da equipe"); throw error; }
            
            return data.map((task: any) => ({
                ...task,
                subtasks: Array.isArray(task.subtasks) ? task.subtasks : []
            })) as TeamTask[];
        },
        enabled: !!selectedDate
    });

    const addTaskMutation = useMutation({
        mutationFn: async ({ member_id, title, due_date, priority }: { member_id: string; title: string; due_date: string; priority?: string }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");
            const { data, error } = await supabase
                .from("team_tasks" as any)
                .insert({ member_id, title, due_date, user_id: user.id, completed: false, priority: priority ?? 'medium', subtasks: [] })
                .select()
                .single();
            if (error) { toast.error("Erro ao adicionar tarefa"); throw error; }
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-tasks", selectedDate] })
    });

    const toggleTaskMutation = useMutation({
        mutationFn: async ({ id, completed, original_due_date }: { id: string; completed: boolean; original_due_date?: string }) => {
            const updates: any = { completed };
            
            // If we are completing a past overdue task today, log it as completed today.
            if (completed && original_due_date && original_due_date < selectedDate) {
                updates.due_date = selectedDate;
            }

            const { error } = await supabase
                .from("team_tasks" as any)
                .update(updates)
                .eq("id", id);
            if (error) { toast.error("Erro ao atualizar tarefa"); throw error; }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-tasks", selectedDate] })
    });

    const updateTaskNotesMutation = useMutation({
        mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
            const { error } = await supabase
                .from("team_tasks" as any)
                .update({ notes })
                .eq("id", id);
            if (error) { toast.error("Erro ao atualizar notas da tarefa"); throw error; }
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

    const addSubtaskMutation = useMutation({
        mutationFn: async ({ taskId, title }: { taskId: string; title: string }) => {
            const task = tasks.find(t => t.id === taskId);
            if (!task) throw new Error("Task not found");

            const newSubtask = {
                id: crypto.randomUUID(),
                title,
                completed: false
            };

            const updatedSubtasks = [...(task.subtasks || []), newSubtask];

            const { error } = await supabase
                .from("team_tasks" as any)
                .update({ subtasks: updatedSubtasks })
                .eq("id", taskId);

            if (error) { toast.error("Erro ao adicionar subtarefa"); throw error; }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-tasks", selectedDate] })
    });

    const toggleSubtaskMutation = useMutation({
        mutationFn: async ({ taskId, subtaskId }: { taskId: string; subtaskId: string }) => {
            const task = tasks.find(t => t.id === taskId);
            if (!task) throw new Error("Task not found");

            const updatedSubtasks = (task.subtasks || []).map(st => 
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
            );

            const { error } = await supabase
                .from("team_tasks" as any)
                .update({ subtasks: updatedSubtasks })
                .eq("id", taskId);

            if (error) { toast.error("Erro ao atualizar subtarefa"); throw error; }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["team-tasks", selectedDate] })
    });

    const deleteSubtaskMutation = useMutation({
        mutationFn: async ({ taskId, subtaskId }: { taskId: string; subtaskId: string }) => {
            const task = tasks.find(t => t.id === taskId);
            if (!task) throw new Error("Task not found");

            const updatedSubtasks = (task.subtasks || []).filter(st => st.id !== subtaskId);

            const { error } = await supabase
                .from("team_tasks" as any)
                .update({ subtasks: updatedSubtasks })
                .eq("id", taskId);

            if (error) { toast.error("Erro ao remover subtarefa"); throw error; }
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
        updateTaskNotes: updateTaskNotesMutation.mutate,
        addSubtask: addSubtaskMutation.mutate,
        toggleSubtask: toggleSubtaskMutation.mutate,
        deleteSubtask: deleteSubtaskMutation.mutate,
    };
};

// ---- HISTORY HOOK ----
export interface HistoryEntry {
    date: string;
    tasks: (TeamTask & { member_name: string; member_color: string })[];
}

export const useTeamHistory = (dateFrom: string, dateTo: string, members: TeamMember[]) => {
    const { data: historyTasks = [], isLoading } = useQuery({
        queryKey: ["team-history", dateFrom, dateTo],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];
            const { data, error } = await supabase
                .from("team_tasks" as any)
                .select("*")
                .eq("user_id", user.id)
                .eq("completed", true)
                .gte("due_date", dateFrom)
                .lte("due_date", dateTo)
                .order("due_date", { ascending: false })
                .order("created_at", { ascending: true });
            if (error) { toast.error("Erro ao carregar histórico"); throw error; }
            return (data as unknown) as TeamTask[];
        },
        enabled: !!dateFrom && !!dateTo
    });

    // Enrich with member info and group by date
    const grouped: HistoryEntry[] = [];
    const dateMap = new Map<string, HistoryEntry>();

    for (const task of historyTasks) {
        const member = members.find(m => m.id === task.member_id);
        const enriched = {
            ...task,
            member_name: member?.name ?? "?",
            member_color: member?.color ?? "#9b87f5",
        };
        if (!dateMap.has(task.due_date)) {
            const entry: HistoryEntry = { date: task.due_date, tasks: [] };
            dateMap.set(task.due_date, entry);
            grouped.push(entry);
        }
        dateMap.get(task.due_date)!.tasks.push(enriched);
    }

    return { grouped, isLoading, totalCompleted: historyTasks.length };
};
