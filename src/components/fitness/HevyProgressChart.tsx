import { useMemo, useState } from "react";
import { useHevyWorkouts } from "@/hooks/useHevyIntegration";
import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, Trophy, ChevronDown } from "lucide-react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine,
} from "recharts";

interface ExerciseDataPoint {
    date: string;
    displayDate: string;
    maxWeightKg: number;
    totalVolume: number;
    isPR: boolean;
}

export function HevyProgressChart() {
    const { workouts, isLoading } = useHevyWorkouts();
    const [selectedExercise, setSelectedExercise] = useState<string>("");
    const [open, setOpen] = useState(false);

    // Build list of all unique exercises
    const exerciseOptions = useMemo(() => {
        const counts = new Map<string, number>();
        for (const w of workouts) {
            for (const ex of w.exercises) {
                counts.set(ex.title, (counts.get(ex.title) ?? 0) + 1);
            }
        }
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1]) // Most frequent first
            .map(([title]) => title);
    }, [workouts]);

    // Auto-select first exercise if none chosen
    const activeExercise = selectedExercise || exerciseOptions[0] || "";

    // Build chart data
    const chartData = useMemo((): ExerciseDataPoint[] => {
        if (!activeExercise) return [];

        const points: ExerciseDataPoint[] = [];
        let allTimePR = 0;

        const sorted = [...workouts].sort(
            (a, b) => parseISO(a.workout_date).getTime() - parseISO(b.workout_date).getTime()
        );

        for (const workout of sorted) {
            const ex = workout.exercises.find(
                (e) => e.title.toLowerCase() === activeExercise.toLowerCase()
            );
            if (!ex) continue;

            const maxWeight = Math.max(
                0,
                ...ex.sets
                    .filter((s) => s.weight_kg && s.reps)
                    .map((s) => s.weight_kg!)
            );

            const volume = ex.sets.reduce((acc, s) => {
                return acc + (s.weight_kg ?? 0) * (s.reps ?? 0);
            }, 0);

            const isPR = maxWeight > allTimePR;
            if (isPR) allTimePR = maxWeight;

            points.push({
                date: workout.workout_date,
                displayDate: format(parseISO(workout.workout_date), "dd/MM", { locale: ptBR }),
                maxWeightKg: maxWeight,
                totalVolume: Math.round(volume),
                isPR,
            });
        }

        return points;
    }, [activeExercise, workouts]);

    const prValue = useMemo(
        () => Math.max(0, ...chartData.map((d) => d.maxWeightKg)),
        [chartData]
    );

    const CustomDot = (props: any) => {
        const { cx, cy, payload } = props;
        if (!payload.isPR) return <circle cx={cx} cy={cy} r={3} fill="#FF6B2B" stroke="#fff" strokeWidth={1.5} />;
        return (
            <g>
                <circle cx={cx} cy={cy} r={7} fill="#FF6B2B" stroke="#fff" strokeWidth={2} />
                <text x={cx} y={cy - 12} textAnchor="middle" fontSize={10} fill="#FF6B2B" fontWeight="bold">PR</text>
            </g>
        );
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null;
        const d = payload[0]?.payload as ExerciseDataPoint;
        return (
            <div className="hevy-chart-tooltip">
                <p className="hevy-chart-tooltip__date">{label}</p>
                <p className="hevy-chart-tooltip__weight">{d.maxWeightKg} kg</p>
                <p className="hevy-chart-tooltip__vol">Volume: {d.totalVolume} kg</p>
                {d.isPR && <p className="hevy-chart-tooltip__pr">🏆 Personal Record!</p>}
            </div>
        );
    };

    if (isLoading) {
        return <div className="hevy-progress-chart"><div className="hevy-skeleton hevy-skeleton--tall" /></div>;
    }

    if (exerciseOptions.length === 0) {
        return (
            <div className="hevy-progress-chart hevy-progress-chart--empty">
                <TrendingUp className="hevy-progress-chart__empty-icon" />
                <p>Sincronize seus treinos para ver a evolução de cargas.</p>
            </div>
        );
    }

    return (
        <div className="hevy-progress-chart">
            {/* Header */}
            <div className="hevy-progress-chart__header">
                <div>
                    <h3 className="hevy-progress-chart__title">Evolução de Carga</h3>
                    {prValue > 0 && (
                        <div className="hevy-progress-chart__pr-badge">
                            <Trophy className="hevy-progress-chart__pr-icon" />
                            <span>PR: {prValue} kg</span>
                        </div>
                    )}
                </div>

                {/* Exercise selector */}
                <div className="hevy-exercise-selector">
                    <button
                        onClick={() => setOpen((v) => !v)}
                        className="hevy-exercise-selector__trigger"
                        id="hevy-exercise-select-btn"
                    >
                        <span>{activeExercise || "Selecionar exercício"}</span>
                        <ChevronDown className={`hevy-exercise-selector__chevron ${open ? "rotate-180" : ""}`} />
                    </button>
                    {open && (
                        <div className="hevy-exercise-selector__dropdown">
                            {exerciseOptions.map((ex) => (
                                <button
                                    key={ex}
                                    onClick={() => { setSelectedExercise(ex); setOpen(false); }}
                                    className={`hevy-exercise-selector__option ${ex === activeExercise ? "hevy-exercise-selector__option--active" : ""}`}
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chart */}
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={chartData} margin={{ top: 16, right: 16, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis
                            dataKey="displayDate"
                            tick={{ fontSize: 11, fill: "#9CA3AF" }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 11, fill: "#9CA3AF" }}
                            tickLine={false}
                            axisLine={false}
                            unit=" kg"
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {prValue > 0 && (
                            <ReferenceLine
                                y={prValue}
                                stroke="#FF6B2B"
                                strokeDasharray="4 4"
                                label={{ value: "PR", position: "right", fill: "#FF6B2B", fontSize: 11 }}
                            />
                        )}
                        <Line
                            type="monotone"
                            dataKey="maxWeightKg"
                            stroke="#FF6B2B"
                            strokeWidth={2}
                            dot={<CustomDot />}
                            activeDot={{ r: 6, fill: "#FF6B2B" }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="hevy-progress-chart__no-data">
                    <p>Nenhum dado de carga encontrado para <strong>{activeExercise}</strong>.</p>
                </div>
            )}

            <p className="hevy-progress-chart__footer">
                {chartData.length} sessões registradas para este exercício
            </p>
        </div>
    );
}
