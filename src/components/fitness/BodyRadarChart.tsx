import { FitnessMeasurement } from "@/hooks/useFitness";
import { ResponsiveContainer, PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadarChart, Radar, Tooltip } from "recharts";
import { Activity } from "lucide-react";

export function BodyRadarChart({ latestMeas }: { latestMeas?: FitnessMeasurement }) {
    if (!latestMeas) return null;

    // Normalizing values to a 0-100 scale to make a balanced radar chart.
    // These are approximations for visual balance.

    // Muscle Mass (%): Usually 30-50% for healthy adults. Let's map 20% -> 0, 50% -> 100
    const rawMuscle = latestMeas.muscle_mass_kg || 0; // The name of the field is misleading but it contains the %
    const normMuscle = Math.min(100, Math.max(0, ((rawMuscle - 20) / 30) * 100));

    // Body Fat (%): Let's map 35% -> 0 (bad), 10% -> 100 (good)
    const rawFat = latestMeas.body_fat_pct || 0;
    const normFat = rawFat === 0 ? 0 : Math.min(100, Math.max(0, 100 - ((rawFat - 10) / 25) * 100));

    // Water (%): Let's map 40% -> 0, 65% -> 100
    const rawWater = latestMeas.water_pct || 0;
    const normWater = Math.min(100, Math.max(0, ((rawWater - 40) / 25) * 100));

    // Visceral Fat: Let's map 15 -> 0 (bad), 5 -> 100 (good)
    const rawVisceral = latestMeas.visceral_fat || 0;
    const normVisceral = rawVisceral === 0 ? 0 : Math.min(100, Math.max(0, 100 - ((rawVisceral - 5) / 10) * 100));

    // BMI: 18.5 to 24.9 is good. Let's map difference from 22 (ideal).
    // Ideal (22) -> 100. Far away (abs diff > 10) -> 0.
    const rawBmi = latestMeas.bmi || 0;
    const diffBmi = Math.abs(rawBmi - 22);
    const normBmi = Math.min(100, Math.max(0, 100 - (diffBmi / 10) * 100));

    const data = [
        { subject: 'Músculo', A: Math.round(normMuscle), fullMark: 100 },
        { subject: 'Gordura Int.', A: Math.round(normVisceral), fullMark: 100 },
        { subject: 'Hidratação', A: Math.round(normWater), fullMark: 100 },
        { subject: 'Gordura Perf.', A: Math.round(normFat), fullMark: 100 },
        { subject: 'Saúde (IMC)', A: Math.round(normBmi), fullMark: 100 },
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-dilq-accent" />
                    Equilíbrio Corporal
                </h3>
            </div>
            <p className="text-xs text-gray-500 w-full mb-4">
                Quanto mais preenchida e simétrica for a "teia", mais equilibrada está a sua composição corporal.
            </p>

            <div className="flex-1 w-full min-h-[250px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Você" dataKey="A" stroke="#8b5cf6" fill="#a78bfa" fillOpacity={0.6} />
                        <Tooltip
                            formatter={(value: number) => [`${value}/100 Nível`, 'Pontuação']}
                            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
