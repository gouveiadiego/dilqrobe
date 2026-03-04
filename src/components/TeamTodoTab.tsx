import { useState, useMemo } from "react";
import { format, addDays, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTeamTasks, TeamMember } from "@/hooks/useTeamTasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
    ChevronLeft, ChevronRight, Plus, Trash2, UserPlus,
    CheckCircle2, Circle, Users, CalendarDays, CheckCheck,
    ArrowDownToLine, Trophy, Star, Zap,
} from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

// ---------- CONSTANTS ----------
const MEMBER_COLORS = [
    "#9b87f5", "#33C3F0", "#F97316", "#10B981",
    "#EC4899", "#F59E0B", "#6366F1", "#14B8A6",
];

type Priority = 'high' | 'medium' | 'low';

const PRIORITY_CONFIG: Record<Priority, { label: string; dot: string; pulse: boolean }> = {
    high: { label: "Alta", dot: "bg-red-500", pulse: true },
    medium: { label: "Normal", dot: "bg-yellow-400", pulse: false },
    low: { label: "Baixa", dot: "bg-green-500", pulse: false },
};

const MOTIVATIONAL_QUOTES = [
    "A disciplina é a ponte entre metas e realizações. 🌉",
    "Pequenos progressos também são progressos. 🚀",
    "Cada tarefa concluída é um passo mais perto do sucesso. ✨",
    "O sucesso é a soma de pequenos esforços repetidos. 💪",
    "Foque no progresso, não na perfeição. 🎯",
    "Grandes coisas são feitas por uma série de pequenas coisas. 🌟",
    "Você é capaz. Comece. 🔥",
    "A ação de hoje é a vitória de amanhã. 🏆",
    "Produtividade é dedicar o seu tempo ao que realmente importa. ⚡",
    "Persevere. Os maiores resultados levam tempo. 🌱",
    "Execute com excelência, não só com velocidade. 🎖️",
    "Cada check é uma vitória. Celebre! 🎉",
];

function getDailyQuote(): string {
    const dayOfYear = Math.floor(
        (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "☀️ Bom dia, equipe!";
    if (hour < 18) return "🌤️ Boa tarde, equipe!";
    return "🌙 Boa noite, equipe!";
}

function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

// ---------- PRIORITY PICKER ----------
function PriorityPicker({ value, onChange }: { value: Priority; onChange: (p: Priority) => void }) {
    return (
        <TooltipProvider>
            <div className="flex gap-1.5 items-center">
                {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => (
                    <Tooltip key={p}>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={() => onChange(p)}
                                className={`w-4 h-4 rounded-full transition-all ${PRIORITY_CONFIG[p].dot} ${value === p ? "scale-125 ring-2 ring-offset-1 ring-gray-400 shadow-sm" : "opacity-40 hover:opacity-70"
                                    }`}
                            />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">{PRIORITY_CONFIG[p].label}</TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    );
}

// ---------- MEMBER CARD ----------
function MemberCard({
    member, tasks, date, isTopPerformer,
    onAddTask, onToggleTask, onDeleteTask, onDeleteMember, onCompleteAll, onCarryOver,
}: {
    member: TeamMember;
    tasks: { id: string; title: string; completed: boolean; member_id: string; priority?: string }[];
    date: string;
    isTopPerformer: boolean;
    onAddTask: (memberId: string, title: string, date: string, priority: Priority) => void;
    onToggleTask: (id: string, completed: boolean) => void;
    onDeleteTask: (id: string) => void;
    onDeleteMember: (id: string) => void;
    onCompleteAll: (memberId: string) => void;
    onCarryOver: (memberId: string) => void;
}) {
    const [newTask, setNewTask] = useState("");
    const [priority, setPriority] = useState<Priority>("medium");

    const memberTasks = tasks.filter(t => t.member_id === member.id);
    const completedCount = memberTasks.filter(t => t.completed).length;
    const totalCount = memberTasks.length;
    const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
    const allDone = totalCount > 0 && completedCount === totalCount;

    const handleAddTask = () => {
        const trimmed = newTask.trim();
        if (!trimmed) return;
        onAddTask(member.id, trimmed, date, priority);
        setNewTask("");
        setPriority("medium");
    };

    const sorted = [...memberTasks].sort((a, b) => {
        const pOrder = { high: 0, medium: 1, low: 2 };
        const pa = pOrder[(a.priority as Priority) ?? 'medium'];
        const pb = pOrder[(b.priority as Priority) ?? 'medium'];
        if (pa !== pb) return pa - pb;
        return (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
    });

    return (
        <div className={`rounded-2xl border flex flex-col transition-all duration-500 overflow-hidden relative ${allDone
                ? 'border-green-300 bg-gradient-to-b from-green-50 to-emerald-50/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                : 'border-gray-100 bg-white shadow-sm hover:shadow-md'
            }`}>
            {/* Top performer ribbon */}
            {isTopPerformer && totalCount > 0 && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-yellow-400 to-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1 z-10">
                    <Trophy className="h-3 w-3" /> Destaque
                </div>
            )}

            {/* Header */}
            <div className="p-4 flex items-center justify-between" style={{ borderLeft: `4px solid ${member.color}` }}>
                <div className="flex items-center gap-3">
                    <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm transition-all duration-300 ${allDone ? 'scale-110' : ''
                            }`}
                        style={{ backgroundColor: member.color }}
                    >
                        {allDone ? <CheckCheck className="h-5 w-5" /> : getInitials(member.name)}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-base leading-tight flex items-center gap-1.5">
                            {member.name}
                            {isTopPerformer && totalCount > 0 && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-400" />}
                        </h3>
                        <p className={`text-xs font-medium ${allDone ? 'text-green-600' : 'text-gray-400'}`}>
                            {totalCount === 0 ? "Sem tarefas" : allDone ? "🎉 Tudo concluído!" : `${completedCount}/${totalCount} concluídas`}
                        </p>
                    </div>
                </div>

                <TooltipProvider>
                    <div className="flex items-center gap-0.5">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => onCarryOver(member.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                                    <ArrowDownToLine className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-xs">Importar do dia anterior</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => onCompleteAll(member.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-green-500 hover:bg-green-50 transition-colors">
                                    <CheckCheck className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-xs">Concluir todas</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button onClick={() => onDeleteMember(member.id)} className="p-1.5 rounded-lg text-gray-200 hover:text-red-400 hover:bg-red-50 transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-xs">Remover pessoa</TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            </div>

            {/* Progress Bar */}
            <div className="px-4 pb-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400 font-medium">Progresso</span>
                    <span className={`text-[10px] font-bold ${progress === 100 ? 'text-green-600' : 'text-gray-500'}`}>{progress}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${allDone
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                : 'bg-gradient-to-r from-dilq-accent to-dilq-teal'
                            }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* All done celebration */}
            {allDone && (
                <div className="mx-4 mb-3 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center font-semibold text-sm shadow-sm">
                    🎉 Parabéns! Todas as tarefas concluídas!
                </div>
            )}

            {/* Task List */}
            <div className="flex-1 px-4 pb-2 space-y-0.5 min-h-[80px]">
                {sorted.length === 0 && (
                    <p className="text-gray-400 text-sm py-4 text-center italic">
                        Nenhuma tarefa. Adicione uma abaixo! 👇
                    </p>
                )}
                {sorted.map(task => {
                    const pCfg = PRIORITY_CONFIG[(task.priority as Priority) ?? 'medium'];
                    const isHighPriority = task.priority === 'high' && !task.completed;
                    return (
                        <div key={task.id} className={`flex items-start gap-2 group py-1.5 px-2 rounded-lg transition-colors ${isHighPriority ? 'bg-red-50/60 hover:bg-red-50' : 'hover:bg-gray-50'
                            }`}>
                            <button onClick={() => onToggleTask(task.id, !task.completed)} className="mt-0.5 shrink-0 transition-transform active:scale-90">
                                {task.completed
                                    ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    : <Circle className={`h-5 w-5 ${isHighPriority ? 'text-red-300' : 'text-gray-300'} hover:text-gray-400`} />}
                            </button>
                            <div className="flex-1 min-w-0 flex items-start gap-1.5">
                                <span className={`mt-[5px] shrink-0 w-2 h-2 rounded-full ${pCfg.dot} ${isHighPriority ? 'animate-pulse' : ''}`} />
                                <span className={`text-sm leading-snug transition-all ${task.completed ? "line-through text-gray-400" : isHighPriority ? "text-red-800 font-medium" : "text-gray-700"
                                    }`}>
                                    {task.title}
                                    {isHighPriority && <Zap className="inline h-3 w-3 ml-1 text-red-500" />}
                                </span>
                            </div>
                            <button onClick={() => onDeleteTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 shrink-0 p-0.5 mt-0.5">
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Add Task Input */}
            <div className="p-3 border-t border-gray-50 bg-gray-50/50">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-400 font-medium">Prioridade:</span>
                    <PriorityPicker value={priority} onChange={setPriority} />
                </div>
                <div className="flex gap-2">
                    <Input
                        placeholder="Adicionar tarefa... (Enter)"
                        value={newTask}
                        onChange={e => setNewTask(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleAddTask()}
                        className="h-8 text-sm bg-white border-gray-200 placeholder:text-gray-300 focus-visible:ring-1"
                    />
                    <Button size="sm" onClick={handleAddTask} className="h-8 px-2 shrink-0 hover:opacity-90 transition-opacity" style={{ backgroundColor: member.color, border: "none" }}>
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
        setName(""); setSelectedColor(MEMBER_COLORS[0]); setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-dilq-accent to-dilq-teal text-white border-none hover:opacity-90 shadow-sm">
                    <UserPlus className="h-4 w-4" /> Adicionar Pessoa
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
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleAdd()}
                        autoFocus
                    />
                    <div>
                        <p className="text-xs text-gray-500 mb-2">Cor do avatar</p>
                        <div className="flex gap-2 flex-wrap">
                            {MEMBER_COLORS.map(c => (
                                <button key={c} onClick={() => setSelectedColor(c)}
                                    className={`w-7 h-7 rounded-full transition-transform ${selectedColor === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"
                                        }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                    {name && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: selectedColor }}>
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
    const { members, tasks, isLoading, addMember, deleteMember, addTask, toggleTask, deleteTask, completeAllForMember, carryOverFromYesterday } = useTeamTasks(selectedDate);

    const displayDate = parseISO(selectedDate + "T12:00:00");
    const isToday = selectedDate === format(new Date(), "yyyy-MM-dd");

    const goToPrev = () => setSelectedDate(format(subDays(displayDate, 1), "yyyy-MM-dd"));
    const goToNext = () => setSelectedDate(format(addDays(displayDate, 1), "yyyy-MM-dd"));
    const goToToday = () => setSelectedDate(format(new Date(), "yyyy-MM-dd"));

    // Team stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const teamProgress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const allTeamDone = members.length > 0 && totalTasks > 0 && completedTasks === totalTasks;

    // Top performer = highest completion %
    const topPerformerId = useMemo(() => {
        if (members.length === 0) return null;
        let best = { id: "", pct: -1 };
        for (const m of members) {
            const mt = tasks.filter(t => t.member_id === m.id);
            if (mt.length === 0) continue;
            const pct = mt.filter(t => t.completed).length / mt.length;
            if (pct > best.pct) best = { id: m.id, pct };
        }
        return best.pct > 0 ? best.id : null;
    }, [members, tasks]);

    const quote = useMemo(() => getDailyQuote(), []);
    const greeting = getGreeting();

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Motivational Header */}
            <div className="rounded-2xl bg-gradient-to-r from-dilq-accent to-dilq-teal p-5 text-white shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <p className="text-white/80 text-sm font-medium mb-0.5">{greeting}</p>
                        <h2 className="text-2xl font-extrabold tracking-tight">To-Do da Equipe</h2>
                        <p className="text-white/70 text-sm mt-1 italic">"{quote}"</p>
                    </div>
                    <AddMemberDialog onAdd={(name, color) => addMember({ name, color })} />
                </div>
            </div>

            {/* Full team celebration */}
            {allTeamDone && (
                <div className="rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 p-5 text-white text-center shadow-lg animate-fade-in">
                    <div className="text-4xl mb-2">🏆</div>
                    <h3 className="text-xl font-extrabold">EQUIPE INCRÍVEL!</h3>
                    <p className="text-green-100 mt-1 text-sm">Toda a equipe concluiu 100% das tarefas de hoje. Vocês são demais! 🎉</p>
                </div>
            )}

            {/* Date Nav + Team Progress */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Date navigator */}
                <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 shadow-sm p-2.5">
                    <button onClick={goToPrev} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <ChevronLeft className="h-4 w-4 text-gray-600" />
                    </button>
                    <div className="flex items-center gap-2 min-w-[190px] justify-center">
                        <CalendarDays className="h-4 w-4 text-dilq-accent shrink-0" />
                        <span className="font-semibold text-gray-800 capitalize text-sm">
                            {format(displayDate, "eeee, dd 'de' MMMM", { locale: ptBR })}
                        </span>
                    </div>
                    <button onClick={goToNext} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                    </button>
                    {!isToday && (
                        <button onClick={goToToday} className="text-xs text-dilq-accent hover:underline font-medium ml-1">
                            Hoje
                        </button>
                    )}
                </div>

                {/* Team Progress */}
                {members.length > 0 && totalTasks > 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex-1 max-w-md">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5" /> Progresso da Equipe
                            </span>
                            <span className={`text-xs font-bold ${teamProgress === 100 ? 'text-green-600' : teamProgress >= 60 ? 'text-yellow-600' : 'text-gray-500'}`}>
                                {teamProgress}% • {completedTasks}/{totalTasks}
                            </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${teamProgress === 100
                                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                        : 'bg-gradient-to-r from-dilq-accent to-dilq-teal'
                                    }`}
                                style={{ width: `${teamProgress}%` }}
                            />
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2">
                            {members.map(m => {
                                const mt = tasks.filter(t => t.member_id === m.id);
                                const mc = mt.filter(t => t.completed).length;
                                return (
                                    <div key={m.id} className="flex items-center gap-1">
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                                        <span className="text-[11px] text-gray-500">{m.name.split(" ")[0]}</span>
                                        <span className="text-[11px] font-semibold text-gray-700">{mc}/{mt.length}</span>
                                        {mt.length > 0 && mc === mt.length && <span className="text-[10px]">✅</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Priority legend */}
            <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                <span className="font-medium text-gray-500">Prioridade:</span>
                {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => (
                    <span key={p} className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[p].dot}`} />
                        {PRIORITY_CONFIG[p].label}
                        {p === 'high' && <span className="text-red-400">(pulsa ⚡)</span>}
                    </span>
                ))}
            </div>

            {/* Cards */}
            {isLoading ? (
                <LoadingSpinner text="Carregando equipe..." className="py-16" />
            ) : members.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-dilq-accent/20 to-dilq-teal/20 mx-auto flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-dilq-accent" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">Equipe vazia</h3>
                    <p className="text-gray-400 text-sm">Clique em "Adicionar Pessoa" para cadastrar os membros da equipe.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                    {members.map(member => (
                        <MemberCard
                            key={member.id}
                            member={member}
                            tasks={tasks}
                            date={selectedDate}
                            isTopPerformer={topPerformerId === member.id}
                            onAddTask={(memberId, title, date, prio) => addTask({ member_id: memberId, title, due_date: date, priority: prio })}
                            onToggleTask={(id, completed) => toggleTask({ id, completed })}
                            onDeleteTask={deleteTask}
                            onDeleteMember={deleteMember}
                            onCompleteAll={completeAllForMember}
                            onCarryOver={carryOverFromYesterday}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
