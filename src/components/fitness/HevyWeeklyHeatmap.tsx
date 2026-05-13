import { useMemo } from "react";
import { useHevyWorkouts } from "@/hooks/useHevyIntegration";
import { subWeeks, startOfWeek, addDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Flame } from "lucide-react";

const WEEKS = 15;

function getIntensityLevel(volumeKg: number): 0 | 1 | 2 | 3 | 4 {
    if (volumeKg <= 0) return 0;
    if (volumeKg < 2000) return 1;
    if (volumeKg < 5000) return 2;
    if (volumeKg < 10000) return 3;
    return 4;
}

const INTENSITY_CLASSES = [
    "hevy-heatmap__cell--empty",
    "hevy-heatmap__cell--l1",
    "hevy-heatmap__cell--l2",
    "hevy-heatmap__cell--l3",
    "hevy-heatmap__cell--l4",
];

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function HevyWeeklyHeatmap() {
    const { workouts, isLoading } = useHevyWorkouts();

    // Build a map: date string → workout
    const workoutByDate = useMemo(() => {
        const map = new Map<string, typeof workouts[0]>();
        for (const w of workouts) {
            if (!map.has(w.workout_date)) map.set(w.workout_date, w);
        }
        return map;
    }, [workouts]);

    // Build grid: WEEKS columns × 7 rows
    const grid = useMemo(() => {
        const today = new Date();
        const gridStart = startOfWeek(subWeeks(today, WEEKS - 1), { weekStartsOn: 0 }); // Sunday start

        return Array.from({ length: WEEKS }, (_, weekIdx) => {
            return Array.from({ length: 7 }, (_, dayIdx) => {
                const date = addDays(gridStart, weekIdx * 7 + dayIdx);
                const dateStr = format(date, "yyyy-MM-dd");
                const workout = workoutByDate.get(dateStr) ?? null;
                const isFuture = date > today;
                return { date, dateStr, workout, isFuture };
            });
        });
    }, [workoutByDate]);

    // Streak calculation
    const streak = useMemo(() => {
        let count = 0;
        const today = new Date();
        for (let i = 0; i <= 365; i++) {
            const d = addDays(today, -i);
            const ds = format(d, "yyyy-MM-dd");
            if (workoutByDate.has(ds)) {
                count++;
            } else if (i > 0) {
                break;
            }
        }
        return count;
    }, [workoutByDate]);

    const totalWorkouts = workoutByDate.size;

    if (isLoading) {
        return <div className="hevy-heatmap hevy-heatmap--loading"><div className="hevy-skeleton hevy-skeleton--wide" /></div>;
    }

    return (
        <div className="hevy-heatmap">
            {/* Header */}
            <div className="hevy-heatmap__header">
                <div className="hevy-heatmap__title-row">
                    <h3 className="hevy-heatmap__title">Histórico de Treinos</h3>
                    <div className="hevy-heatmap__streak">
                        <Flame className="hevy-heatmap__streak-icon" />
                        <span className="hevy-heatmap__streak-count">{streak}</span>
                        <span className="hevy-heatmap__streak-label">dias seguidos</span>
                    </div>
                </div>
                <p className="hevy-heatmap__subtitle">{totalWorkouts} treinos nos últimos {WEEKS} semanas</p>
            </div>

            {/* Day labels */}
            <div className="hevy-heatmap__day-labels">
                {DAYS_PT.map((d) => (
                    <span key={d} className="hevy-heatmap__day-label">{d[0]}</span>
                ))}
            </div>

            {/* Grid */}
            <div className="hevy-heatmap__grid" style={{ gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }}>
                {grid.map((week, wi) =>
                    week.map(({ date, dateStr, workout, isFuture }, di) => {
                        const level = isFuture ? 0 : (workout ? getIntensityLevel(workout.volume_kg) : 0);
                        const title = workout
                            ? `${format(date, "dd/MM/yyyy")} — ${workout.title} (${workout.volume_kg.toFixed(0)} kg)`
                            : format(date, "dd/MM/yyyy", { locale: ptBR });

                        return (
                            <div
                                key={`${wi}-${di}`}
                                className={`hevy-heatmap__cell ${INTENSITY_CLASSES[level]} ${isFuture ? "hevy-heatmap__cell--future" : ""}`}
                                title={title}
                            />
                        );
                    })
                )}
            </div>

            {/* Legend */}
            <div className="hevy-heatmap__legend">
                <span className="hevy-heatmap__legend-label">Menos</span>
                {[0, 1, 2, 3, 4].map((l) => (
                    <div key={l} className={`hevy-heatmap__legend-cell ${INTENSITY_CLASSES[l]}`} />
                ))}
                <span className="hevy-heatmap__legend-label">Mais</span>
            </div>
        </div>
    );
}
