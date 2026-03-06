import { useMemo } from "react";
import { FitnessProfile, FitnessMeasurement } from "@/hooks/useFitness";
import { Trophy, ArrowUpCircle, AlertCircle, Medal } from "lucide-react";

export function FitnessLeaderboard({
    profiles,
    measurements
}: {
    profiles: FitnessProfile[],
    measurements: FitnessMeasurement[]
}) {

    const leaderboard = useMemo(() => {
        return profiles.map(p => {
            // Find history for this profile
            const profHistory = measurements
                .filter(m => m.profile_id === p.id)
                .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());

            if (profHistory.length < 2 || !p.goal_weight) {
                return { profile: p, progressPct: 0, hasGoal: !!p.goal_weight, noData: true };
            }

            const firstMeas = profHistory[0].weight_kg;
            const lastMeas = profHistory[profHistory.length - 1].weight_kg;

            if (!firstMeas || !lastMeas) {
                return { profile: p, progressPct: 0, hasGoal: true, noData: true };
            }

            const totalToLose = firstMeas - p.goal_weight;
            // If goal is to GAIN weight
            if (totalToLose < 0) {
                const totalToGain = p.goal_weight - firstMeas;
                const gainedSoFar = lastMeas - firstMeas;
                const pct = Math.max(0, Math.min(100, (gainedSoFar / totalToGain) * 100));
                return { profile: p, progressPct: Math.round(pct), hasGoal: true, noData: false };
            }
            // If goal is to LOSE weight
            else {
                const lostSoFar = firstMeas - lastMeas;
                const pct = Math.max(0, Math.min(100, (lostSoFar / totalToLose) * 100));
                return { profile: p, progressPct: Math.round(pct), hasGoal: true, noData: false };
            }
        }).sort((a, b) => b.progressPct - a.progressPct);
    }, [profiles, measurements]);

    const validEntries = leaderboard.filter(l => !l.noData);
    const pendingEntries = leaderboard.filter(l => l.noData);

    if (profiles.length < 2) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Ranking de Progresso</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                    Adicione mais pessoas na aba Fitness para criar uma competição saudável! Vence quem chegar mais perto da meta estipulada.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl border border-yellow-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    <h3 className="text-xl font-bold text-gray-800">Competição de Resultados</h3>
                </div>

                {validEntries.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Ninguém registrou progresso suficiente para a meta de peso ainda.</p>
                ) : (
                    <div className="space-y-4">
                        {validEntries.map((entry, idx) => (
                            <div key={entry.profile.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="font-bold text-xl text-gray-300 w-6 text-center">
                                        {idx === 0 ? '1º' : idx === 1 ? '2º' : idx === 2 ? '3º' : `${idx + 1}º`}
                                    </div>
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: entry.profile.color }}>
                                        {entry.profile.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                            {entry.profile.name}
                                            {idx === 0 && <Medal className="h-4 w-4 text-yellow-500" />}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            Rumo aos {entry.profile.goal_weight}kg
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-2xl font-black text-dilq-accent">
                                        {entry.progressPct}%
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">da meta</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {pendingEntries.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-yellow-200/50">
                        <h4 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" /> Precisam definir meta ou registrar medidas
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {pendingEntries.map(entry => (
                                <span key={entry.profile.id} className="bg-white border border-gray-100 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600">
                                    {entry.profile.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
