import { useState } from "react";
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFitness, FitnessProfile } from "@/hooks/useFitness";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Activity, Scale, Ruler, UserPlus, Trash2, ArrowRight,
    Target, Droplets, Dumbbell, Flame, Bone, HeartPulse, Settings2
} from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { FitnessForm } from "./fitness/FitnessForm";
import { FitnessCharts } from "./fitness/FitnessCharts";
import { FitnessLeaderboard } from "./fitness/FitnessLeaderboard";
import { FitnessHistory } from "./fitness/FitnessHistory";

const PROFILE_COLORS = [
    "#9b87f5", "#33C3F0", "#F97316", "#10B981",
    "#EC4899", "#F59E0B", "#6366F1", "#14B8A6",
];

function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function calculateAge(birthDate: string | null) {
    if (!birthDate) return null;
    return differenceInYears(new Date(), new Date(birthDate));
}

// ---------- ADD PROFILE DIALOG ----------
function AddProfileDialog({ onAdd }: { onAdd: (data: Partial<FitnessProfile>) => void }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [height, setHeight] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [goalWeight, setGoalWeight] = useState("");
    const [goalFat, setGoalFat] = useState("");
    const [selectedColor, setSelectedColor] = useState(PROFILE_COLORS[0]);

    const idealWeight = height ? (22 * Math.pow(parseFloat(height) / 100, 2)).toFixed(1) : null;

    const handleAdd = () => {
        if (!name.trim()) return;
        onAdd({
            name: name.trim(),
            color: selectedColor,
            gender,
            height_cm: height ? parseFloat(height) : null,
            birth_date: birthDate || null,
            goal_weight: goalWeight ? parseFloat(goalWeight) : null,
            goal_body_fat: goalFat ? parseFloat(goalFat) : null,
        });
        setOpen(false);
        setName(""); setHeight(""); setBirthDate(""); setGoalWeight(""); setGoalFat("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-dilq-accent to-dilq-teal text-white border-none hover:opacity-90 shadow-sm shrink-0">
                    <UserPlus className="h-4 w-4" /> Adicionar Perfil
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Novo Perfil Fitness</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-3">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600">Nome</label>
                        <Input placeholder="Ex: Diego" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-600">Altura (cm)</label>
                            <Input type="number" placeholder="Ex: 175" value={height} onChange={e => setHeight(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-600">Nascimento</label>
                            <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
                        </div>
                    </div>

                    {/* GOALS & IDEAL WEIGHT */}
                    <div className="border border-gray-100 bg-gray-50/50 p-3 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-700">Metas Físicas</label>
                            {idealWeight && (
                                <span className="text-[10px] text-gray-500 font-medium">
                                    Peso ideal (IMC 22): <button type="button" onClick={() => setGoalWeight(idealWeight)} className="text-dilq-accent hover:underline font-bold transition-all">{idealWeight}kg</button>
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-semibold text-gray-500">Peso Alvo (kg)</label>
                                <Input type="number" step="0.1" placeholder="Ex: 70" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} className="h-8 text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-semibold text-gray-500">% Gordura Alvo</label>
                                <Input type="number" step="0.1" placeholder="Ex: 15" value={goalFat} onChange={e => setGoalFat(e.target.value)} className="h-8 text-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600">Gênero</label>
                        <div className="flex gap-2">
                            <Button type="button" variant={gender === 'male' ? 'default' : 'outline'} onClick={() => setGender('male')} className="w-full">Masculino</Button>
                            <Button type="button" variant={gender === 'female' ? 'default' : 'outline'} onClick={() => setGender('female')} className="w-full">Feminino</Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-600">Cor do Avatar</label>
                        <div className="flex gap-2 flex-wrap">
                            {PROFILE_COLORS.map(c => (
                                <button key={c} type="button" onClick={() => setSelectedColor(c)}
                                    className={`w-7 h-7 rounded-full transition-transform ${selectedColor === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"}`}
                                    style={{ backgroundColor: c }} />
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleAdd} disabled={!name.trim()}>Criar Perfil</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ---------- MAIN COMPONENT ----------
export function FitnessTab() {
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
    const { profiles, measurements, bodyMeasurements, isLoading, addProfile, deleteProfile } = useFitness(activeProfileId);

    // Auto-select first profile if none selected
    if (!activeProfileId && profiles.length > 0) {
        setActiveProfileId(profiles[0].id);
    }

    const activeProfile = profiles.find(p => p.id === activeProfileId);
    const latestMeas = measurements[0];
    const latestBody = bodyMeasurements[0];

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-dilq-accent to-dilq-teal bg-clip-text text-transparent">
                        Fitness Tracker
                    </h2>
                    <p className="text-gray-500 mt-1">Acompanhe sua evolução corporal e dados de bioimpedância.</p>
                </div>
                <AddProfileDialog onAdd={addProfile} />
            </div>

            {isLoading && profiles.length === 0 ? (
                <LoadingSpinner text="Carregando perfis..." />
            ) : profiles.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-700">Comece seu acompanhamento</h3>
                    <p className="text-gray-500 mb-6 mt-2 max-w-md mx-auto">Adicione seu perfil para começar a registrar peso, gordura corporal, massa muscular e medidas de fita.</p>
                    <AddProfileDialog onAdd={addProfile} />
                </div>
            ) : (
                <>
                    {/* Profile Selector */}
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                        {profiles.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setActiveProfileId(p.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all min-w-[200px] text-left ${activeProfileId === p.id
                                    ? 'border-dilq-accent bg-blue-50/50 shadow-sm ring-1 ring-dilq-accent/20'
                                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: p.color }}>
                                    {getInitials(p.name)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 leading-tight">{p.name}</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {calculateAge(p.birth_date)} anos {p.height_cm ? `• ${p.height_cm}cm` : ''}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {activeProfile && (
                        <Tabs defaultValue="dashboard" className="w-full">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 w-full">
                                <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-gray-100/80 p-1">
                                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                                    <TabsTrigger value="charts">Evolução</TabsTrigger>
                                    <TabsTrigger value="history">Histórico</TabsTrigger>
                                    <TabsTrigger value="leaderboard">Ranking 🏆</TabsTrigger>
                                </TabsList>

                                <Button
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                        if (window.confirm(`Tem certeza que deseja excluir o perfil de ${activeProfile.name} e todo o seu histórico?\nEsta ação não pode ser desfeita.`)) {
                                            deleteProfile(activeProfile.id);
                                            setActiveProfileId(null);
                                        }
                                    }}
                                >
                                    <Trash2 className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Excluir Perfil</span>
                                </Button>
                            </div>

                            <TabsContent value="dashboard" className="mt-6 space-y-6">

                                {/* At-a-Glance Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card className="p-4 bg-white shadow-sm border-gray-100 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2">
                                            <Scale className="h-4 w-4 text-dilq-accent" /> Peso Atual
                                        </div>
                                        <div className="text-3xl font-bold text-gray-900">
                                            {latestMeas?.weight_kg ? `${latestMeas.weight_kg} kg` : '--'}
                                        </div>
                                        {activeProfile.goal_weight && latestMeas?.weight_kg && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Meta: {activeProfile.goal_weight}kg (Faltam {Math.abs(latestMeas.weight_kg - activeProfile.goal_weight).toFixed(1)}kg)
                                            </p>
                                        )}
                                    </Card>

                                    <Card className="p-4 bg-white shadow-sm border-gray-100 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2">
                                            <Target className="h-4 w-4 text-orange-500" /> Gordura Corporal
                                        </div>
                                        <div className="text-3xl font-bold text-gray-900">
                                            {latestMeas?.body_fat_pct ? `${latestMeas.body_fat_pct}%` : '--'}
                                        </div>
                                        {activeProfile.goal_body_fat && latestMeas?.body_fat_pct && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Meta: {activeProfile.goal_body_fat}%
                                            </p>
                                        )}
                                    </Card>

                                    <Card className="p-4 bg-white shadow-sm border-gray-100 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2">
                                            <Dumbbell className="h-4 w-4 text-emerald-500" /> Massa Muscular
                                        </div>
                                        <div className="text-3xl font-bold text-gray-900">
                                            {latestMeas?.muscle_mass_kg ? `${latestMeas.muscle_mass_kg} kg` : '--'}
                                        </div>
                                        {latestMeas?.skeletal_muscle_pct && (
                                            <p className="text-xs text-gray-500 mt-1">Esquelético: {latestMeas.skeletal_muscle_pct}%</p>
                                        )}
                                    </Card>

                                    <Card className="p-4 bg-white shadow-sm border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-center items-center text-center">
                                        <FitnessForm profile={activeProfile} />
                                    </Card>
                                </div>

                                {/* Detailed Bioimpedance Grid */}
                                {latestMeas ? (
                                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                <Activity className="h-5 w-5 text-dilq-accent" /> Última Bioimpedância
                                            </h3>
                                            <span className="text-sm font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                                                {format(new Date(latestMeas.measured_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                            <MetricsCard title="IMC" value={latestMeas.bmi} unit="" icon={<UserPlus className="h-4 w-4 text-gray-400" />} />
                                            <MetricsCard title="Água Corporal" value={latestMeas.water_pct} unit="%" icon={<Droplets className="h-4 w-4 text-blue-400" />} />
                                            <MetricsCard title="Gordura Visceral" value={latestMeas.visceral_fat} unit="" icon={<HeartPulse className="h-4 w-4 text-red-500" />} />
                                            <MetricsCard title="Massa Óssea" value={latestMeas.bone_mass_kg} unit="kg" icon={<Bone className="h-4 w-4 text-gray-500" />} />
                                            <MetricsCard title="Metabolismo" value={latestMeas.bmr_kcal} unit="kcal" icon={<Flame className="h-4 w-4 text-orange-400" />} />
                                            <MetricsCard title="Proteína" value={latestMeas.protein_pct} unit="%" icon={<Activity className="h-4 w-4 text-purple-400" />} />
                                            <MetricsCard title="Massa Gorda" value={latestMeas.fat_mass_kg} unit="kg" icon={<Target className="h-4 w-4 text-orange-500" />} />
                                            <MetricsCard title="Idade Metabólica" value={latestMeas.metabolic_age} unit="anos" icon={<Settings2 className="h-4 w-4 text-gray-400" />} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                                        <p className="text-gray-500">Nenhuma bioimpedância registrada ainda.</p>
                                    </div>
                                )}

                            </TabsContent>

                            <TabsContent value="charts">
                                <FitnessCharts
                                    profileId={activeProfile.id}
                                    measurements={measurements}
                                    goalWeight={activeProfile.goal_weight}
                                    goalBodyFat={activeProfile.goal_body_fat}
                                />
                            </TabsContent>

                            <TabsContent value="leaderboard">
                                <FitnessLeaderboard profiles={profiles} measurements={measurements} />
                            </TabsContent>

                            <TabsContent value="history">
                                <FitnessHistory
                                    profile={activeProfile}
                                    measurements={measurements}
                                    bodyMeasurements={bodyMeasurements}
                                />
                            </TabsContent>

                        </Tabs>
                    )}
                </>
            )}
        </div>
    );
}

function MetricsCard({ title, value, unit, icon }: { title: string; value: number | null | undefined; unit: string; icon: React.ReactNode }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                {icon} {title}
            </div>
            <div className="text-lg font-bold text-gray-900 border-l-2 border-gray-200 pl-2 mt-1">
                {value ? (
                    <>
                        {value} <span className="text-xs font-medium text-gray-400">{unit}</span>
                    </>
                ) : (
                    <span className="text-gray-300">--</span>
                )}
            </div>
        </div>
    );
}
