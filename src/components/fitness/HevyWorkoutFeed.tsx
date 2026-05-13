import { useMemo } from "react";
import { useHevyWorkouts } from "@/hooks/useHevyIntegration";
import { format, isToday, isThisWeek, startOfWeek, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dumbbell, Clock, Zap, TrendingUp, ChevronRight } from "lucide-react";

const MUSCLE_COLORS: Record<string, string> = {
    chest: "#FF6B2B",
    peito: "#FF6B2B",
    back: "#0EA5E9",
    costas: "#0EA5E9",
    legs: "#10B981",
    pernas: "#10B981",
    quadriceps: "#10B981",
    shoulders: "#F59E0B",
    ombros: "#F59E0B",
    biceps: "#8B5CF6",
    bíceps: "#8B5CF6",
    triceps: "#EC4899",
    tríceps: "#EC4899",
    core: "#6366F1",
    cardio: "#EF4444",
};

function getMuscleColor(group: string | null): string {
    if (!group) return "#6B7280";
    const key = group.toLowerCase();
    for (const k of Object.keys(MUSCLE_COLORS)) {
        if (key.includes(k)) return MUSCLE_COLORS[k];
    }
    return "#6B7280";
}

function formatDuration(seconds: number | null): string {
    if (!seconds) return "--";
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m}min`;
    return `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}min` : ""}`;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function HevyWorkoutFeed() {
    const { workouts, isLoading } = useHevyWorkouts();

    const weekDays = useMemo(() => {
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
        return Array.from({ length: 7 }, (_, i) => {
            const date = addDays(weekStart, i);
            const dateStr = format(date, "yyyy-MM-dd");
            const workout = workouts.find((w) => w.workout_date === dateStr);
            return { date, dateStr, workout, isToday: isToday(date) };
        });
    }, [workouts]);

    const todayWorkout = workouts.find((w) => isToday(parseISO(w.workout_date)));
    const recentWorkouts = workouts.slice(0, 10);

    if (isLoading) {
        return (
            <div className="hevy-feed">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="hevy-skeleton" />
                ))}
            </div>
        );
    }

    if (workouts.length === 0) {
        return (
            <div className="hevy-feed hevy-feed--empty">
                <Dumbbell className="hevy-feed__empty-icon" />
                <h4 className="hevy-feed__empty-title">Nenhum treino encontrado</h4>
                <p className="hevy-feed__empty-desc">Sincronize para importar seus treinos do Hevy.</p>
            </div>
        );
    }

    return (
        <div className="hevy-feed">
            {/* TODAY HIGHLIGHT */}
            <div className="hevy-feed__section">
                <h3 className="hevy-feed__section-title">Hoje</h3>
                {todayWorkout ? (
                    <WorkoutCard workout={todayWorkout} featured />
                ) : (
                    <div className="hevy-feed__rest-day">
                        <span className="hevy-feed__rest-icon">😴</span>
                        <div>
                            <p className="hevy-feed__rest-label">Dia de descanso</p>
                            <p className="hevy-feed__rest-hint">Nenhum treino registrado hoje ainda.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* WEEKLY STRIP */}
            <div className="hevy-feed__section">
                <h3 className="hevy-feed__section-title">Esta Semana</h3>
                <div className="hevy-week-strip">
                    {weekDays.map(({ date, workout, isToday: today }) => (
                        <div
                            key={date.toISOString()}
                            className={`hevy-week-strip__day ${today ? "hevy-week-strip__day--today" : ""} ${workout ? "hevy-week-strip__day--trained" : ""}`}
                        >
                            <span className="hevy-week-strip__label">{WEEKDAYS[date.getDay()]}</span>
                            <div
                                className="hevy-week-strip__dot"
                                style={workout ? { backgroundColor: getMuscleColor(workout.muscle_groups[0] ?? null) } : {}}
                                title={workout ? workout.title : "Descanso"}
                            />
                            {workout && (
                                <span className="hevy-week-strip__vol">
                                    {workout.volume_kg > 0 ? `${(workout.volume_kg / 1000).toFixed(1)}t` : "✓"}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* RECENT WORKOUTS */}
            <div className="hevy-feed__section">
                <h3 className="hevy-feed__section-title">Treinos Recentes</h3>
                <div className="hevy-feed__list">
                    {recentWorkouts.map((w) => (
                        <WorkoutCard key={w.id} workout={w} />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── WorkoutCard ─────────────────────────────────────────────────────────────

function WorkoutCard({ workout, featured = false }: { workout: any; featured?: boolean }) {
    const primaryMuscle = workout.muscle_groups?.[0] ?? null;
    const accent = getMuscleColor(primaryMuscle);

    return (
        <div
            className={`hevy-workout-card ${featured ? "hevy-workout-card--featured" : ""}`}
            style={{ "--accent": accent } as any}
        >
            {/* Left accent bar */}
            <div className="hevy-workout-card__accent-bar" style={{ backgroundColor: accent }} />

            <div className="hevy-workout-card__body">
                <div className="hevy-workout-card__top">
                    <div>
                        <h4 className="hevy-workout-card__title">{workout.title}</h4>
                        <p className="hevy-workout-card__date">
                            {format(parseISO(workout.workout_date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </p>
                    </div>
                    {featured && (
                        <span className="hevy-workout-card__today-badge">Hoje</span>
                    )}
                </div>

                {/* Stats row */}
                <div className="hevy-workout-card__stats">
                    <StatChip icon={<Clock />} label={formatDuration(workout.duration_seconds)} />
                    <StatChip icon={<Zap />} label={`${workout.exercise_count} exerc.`} />
                    <StatChip icon={<TrendingUp />} label={`${workout.volume_kg.toFixed(0)} kg`} />
                </div>

                {/* Muscle groups */}
                {workout.muscle_groups?.length > 0 && (
                    <div className="hevy-workout-card__muscles">
                        {workout.muscle_groups.slice(0, 4).map((g: string) => (
                            <span
                                key={g}
                                className="hevy-muscle-tag"
                                style={{ borderColor: getMuscleColor(g), color: getMuscleColor(g) }}
                            >
                                {g}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatChip({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="hevy-stat-chip">
            <span className="hevy-stat-chip__icon">{icon}</span>
            <span className="hevy-stat-chip__label">{label}</span>
        </div>
    );
}
