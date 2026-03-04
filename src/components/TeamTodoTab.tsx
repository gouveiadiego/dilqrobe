import { useState } from "react";
import { format, addDays, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTeamTasks, TeamMember } from "@/hooks/useTeamTasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Trash2,
    UserPlus,
    CheckCircle2,
    Circle,
    Users,
    CalendarDays,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const MEMBER_COLORS = [
    "#9b87f5", "#33C3F0", "#F97316", "#10B981",
    "#EC4899", "#F59E0B", "#6366F1", "#14B8A6",
];

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

// ---------- MEMBER CARD ----------
function MemberCard({
    member,
    tasks,
    date,
    onAddTask,
    onToggleTask,
    onDeleteTask,
    onDeleteMember,
}: {
    member: TeamMember;
    tasks: { id: string; title: string; completed: boolean; member_id: string }[];
    date: string;
    onAddTask: (memberId: string, title: string, date: string) => void;
    onToggleTask: (id: string, completed: boolean) => void;
    onDeleteTask: (id: string) => void;
    onDeleteMember: (id: string) => void;
}) {
    const [newTask, setNewTask] = useState("");
    const memberTasks = tasks.filter((t) => t.member_id === member.id);
    const completedCount = memberTasks.filter((t) => t.completed).length;
    const totalCount = memberTasks.length;
    const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    const handleAddTask = () => {
        const trimmed = newTask.trim();
        if (!trimmed) return;
        onAddTask(member.id, trimmed, date);
        setNewTask("");
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
            {/* Header */}
            <div
                className="p-4 flex items-center justify-between"
                style={{ borderLeft: `4px solid ${member.color}` }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                        style={{ backgroundColor: member.color }}
                    >
                        {getInitials(member.name)}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-base leading-tight">{member.name}</h3>
                        <p className="text-xs text-gray-400">
                            {completedCount}/{totalCount} tarefas concluídas
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => onDeleteMember(member.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50"
                    title="Remover pessoa"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="px-4 pb-2">
                <Progress
                    value={progress}
                    className="h-1.5 bg-gray-100"
                    style={{ "--tw-ring-color": member.color } as any}
                />
            </div>

            {/* Task List */}
            <div className="flex-1 px-4 pb-2 space-y-1 min-h-[80px]">
                {memberTasks.length === 0 && (
                    <p className="text-gray-400 text-sm py-4 text-center italic">
                        Nenhuma tarefa ainda. Adicione uma abaixo!
                    </p>
                )}
                {memberTasks.map((task) => (
                    <div
                        key={task.id}
                        className="flex items-start gap-2 group py-1.5"
                    >
                        <button
                            onClick={() => onToggleTask(task.id, !task.completed)}
                            className="mt-0.5 shrink-0 transition-transform active:scale-90"
                        >
                            {task.completed ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                                <Circle className="h-5 w-5 text-gray-300 hover:text-gray-400" />
                            )}
                        </button>
                        <span
                            className={`flex-1 text-sm leading-snug transition-all ${task.completed
                                    ? "line-through text-gray-400"
                                    : "text-gray-700"
                                }`}
                        >
                            {task.title}
                        </span>
                        <button
                            onClick={() => onDeleteTask(task.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 shrink-0 p-0.5"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add Task Input */}
            <div className="p-3 border-t border-gray-50 bg-gray-50/50">
                <div className="flex gap-2">
                    <Input
                        placeholder="Adicionar tarefa..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                        className="h-8 text-sm bg-white border-gray-200 placeholder:text-gray-400 focus-visible:ring-1"
                        style={{ "--tw-ring-color": member.color } as any}
                    />
                    <Button
                        size="sm"
                        onClick={handleAddTask}
                        className="h-8 px-2 shrink-0"
                        style={{ backgroundColor: member.color, border: "none" }}
                    >
                        <Plus className="h-4 w-4 text-white" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ---------- ADD MEMBER DIALOG ----------
function AddMemberDialog({ onAdd }: { onAdd: (name: string, color: string) => void }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [selectedColor, setSelectedColor] = useState(MEMBER_COLORS[0]);

    const handleAdd = () => {
        if (!name.trim()) return;
        onAdd(name.trim(), selectedColor);
        setName("");
        setSelectedColor(MEMBER_COLORS[0]);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-dilq-accent to-dilq-teal text-white border-none hover:opacity-90 shadow-sm">
                    <UserPlus className="h-4 w-4" />
                    Adicionar Pessoa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Nova Pessoa na Equipe</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <Input
                        placeholder="Nome (ex: Francine)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        autoFocus
                    />
                    <div>
                        <p className="text-xs text-gray-500 mb-2">Cor do avatar</p>
                        <div className="flex gap-2 flex-wrap">
                            {MEMBER_COLORS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setSelectedColor(c)}
                                    className={`w-7 h-7 rounded-full transition-transform ${selectedColor === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"
                                        }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {name && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                style={{ backgroundColor: selectedColor }}
                            >
                                {getInitials(name)}
                            </div>
                            <span className="font-medium text-gray-900">{name}</span>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleAdd} disabled={!name.trim()}>Adicionar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ---------- MAIN TAB ----------
export function TeamTodoTab() {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const { members, tasks, isLoading, addMember, deleteMember, addTask, toggleTask, deleteTask } =
        useTeamTasks(selectedDate);

    const displayDate = parseISO(selectedDate);
    const isToday = selectedDate === format(new Date(), "yyyy-MM-dd");

    const goToPrev = () => setSelectedDate(format(subDays(displayDate, 1), "yyyy-MM-dd"));
    const goToNext = () => setSelectedDate(format(addDays(displayDate, 1), "yyyy-MM-dd"));
    const goToToday = () => setSelectedDate(format(new Date(), "yyyy-MM-dd"));

    // Aggregate stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.completed).length;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dilq-accent to-dilq-teal flex items-center justify-center shadow-sm">
                        <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-dilq-accent to-dilq-teal bg-clip-text text-transparent">
                            To-Do da Equipe
                        </h2>
                        <p className="text-sm text-gray-500">
                            {totalTasks === 0
                                ? "Sem tarefas para este dia"
                                : `${completedTasks} de ${totalTasks} tarefas concluídas`}
                        </p>
                    </div>
                </div>

                <AddMemberDialog onAdd={(name, color) => addMember({ name, color })} />
            </div>

            {/* Date Navigator */}
            <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-3 w-fit">
                <button
                    onClick={goToPrev}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>

                <div className="flex items-center gap-2 min-w-[180px] justify-center">
                    <CalendarDays className="h-4 w-4 text-dilq-accent" />
                    <span className="font-semibold text-gray-800 capitalize text-sm">
                        {format(displayDate, "eeee, dd 'de' MMMM", { locale: ptBR })}
                    </span>
                </div>

                <button
                    onClick={goToNext}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>

                {!isToday && (
                    <button
                        onClick={goToToday}
                        className="ml-1 text-xs text-dilq-accent hover:underline font-medium"
                    >
                        Hoje
                    </button>
                )}
            </div>

            {/* Loading / Empty / Cards */}
            {isLoading ? (
                <LoadingSpinner text="Carregando equipe..." className="py-16" />
            ) : members.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-dilq-accent/20 to-dilq-teal/20 mx-auto flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-dilq-accent" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">Equipe vazia</h3>
                    <p className="text-gray-400 text-sm">
                        Clique em "Adicionar Pessoa" para cadastrar os membros da sua equipe.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                    {members.map((member) => (
                        <MemberCard
                            key={member.id}
                            member={member}
                            tasks={tasks}
                            date={selectedDate}
                            onAddTask={(memberId, title, date) =>
                                addTask({ member_id: memberId, title, due_date: date })
                            }
                            onToggleTask={(id, completed) => toggleTask({ id, completed })}
                            onDeleteTask={deleteTask}
                            onDeleteMember={deleteMember}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
