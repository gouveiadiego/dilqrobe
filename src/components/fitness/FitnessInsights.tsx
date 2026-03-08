import { FitnessProfile, FitnessMeasurement } from "@/hooks/useFitness";
import { TrendingDown, TrendingUp, Trophy, Target, Star, AlertCircle } from "lucide-react";

export function FitnessInsights({ profile, measurements }: { profile: FitnessProfile, measurements: FitnessMeasurement[] }) {
    if (measurements.length === 0) {
        return (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                    <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                        <Star className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-gray-800">Seu primeiro passo!</h3>
                </div>
                <p className="text-gray-600 text-sm">Registre sua primeira medição para desbloquear insights personalizados sobre seu corpo e evolução.</p>
            </div>
        );
    }

    const latest = measurements[0];
    const previous = measurements.length > 1 ? measurements[1] : null;

    const insights = [];

    // Goal Insights
    if (profile.goal_weight && latest.weight_kg) {
        const diff = latest.weight_kg - profile.goal_weight;
        const absDiff = Math.abs(diff);

        // Se a pessoa já passou mais de um peso, calcular progresso total
        if (measurements.length > 1) {
            const first = measurements[measurements.length - 1];
            if (first.weight_kg) {
                const totalToLose = first.weight_kg - profile.goal_weight;
                const lostSoFar = first.weight_kg - latest.weight_kg;

                if (totalToLose > 0 && lostSoFar > 0) {
                    const pct = Math.min(100, Math.round((lostSoFar / totalToLose) * 100));
                    insights.push({
                        icon: <Trophy className="h-5 w-5" />,
                        color: "text-yellow-600",
                        bg: "bg-yellow-100",
                        title: "Progresso da Meta",
                        desc: `Você já completou ${pct}% da jornada para seu peso alvo! Continue firme!`
                    });
                }
            }
        }

        if (diff <= 0.5 && diff >= -0.5) {
            insights.push({
                icon: <Target className="h-5 w-5" />,
                color: "text-green-600",
                bg: "bg-green-100",
                title: "Meta Atingida!",
                desc: "Parabéns! Você alcançou o seu peso alvo. Agora o foco é a manutenção e qualidade muscular."
            });
        } else if (diff > 0) {
            insights.push({
                icon: <Target className="h-5 w-5" />,
                color: "text-dilq-accent",
                bg: "bg-blue-100",
                title: "Foco na Meta",
                desc: `Faltam apenas ${absDiff.toFixed(1)}kg para você alcançar seu peso alvo de ${profile.goal_weight}kg.`
            });
        }
    }

    // Comparison Insights vs Previous
    if (previous) {
        if (latest.weight_kg && previous.weight_kg) {
            const weightDiff = latest.weight_kg - previous.weight_kg;
            if (weightDiff < -0.5) {
                insights.push({
                    icon: <TrendingDown className="h-5 w-5" />,
                    color: "text-green-600",
                    bg: "bg-green-100",
                    title: "Perda de Peso",
                    desc: `Ótimo trabalho! Você eliminou ${Math.abs(weightDiff).toFixed(1)}kg desde a última avaliação.`
                });
            } else if (weightDiff > 0.5 && (!profile.goal_weight || latest.weight_kg < profile.goal_weight)) {
                // Ganho de peso pode ser positivo se for ganho muscular para quem quer crescer!
                insights.push({
                    icon: <TrendingUp className="h-5 w-5" />,
                    color: "text-blue-600",
                    bg: "bg-blue-100",
                    title: "Ganho de Massa",
                    desc: `Você ganhou ${weightDiff.toFixed(1)}kg desde a última vez.` // Deixar neutro/positivo dependendo do IMC
                });
            }
        }

        if (latest.body_fat_pct && previous.body_fat_pct) {
            const fatDiff = latest.body_fat_pct - previous.body_fat_pct;
            if (fatDiff < -0.2) {
                insights.push({
                    icon: <Star className="h-5 w-5" />,
                    color: "text-orange-600",
                    bg: "bg-orange-100",
                    title: "Queima de Gordura 🔥",
                    desc: `Fantástico! Seu percentual de gordura diminuiu em ${Math.abs(fatDiff).toFixed(1)}%.`
                });
            }
        }

        if (latest.muscle_mass_kg && previous.muscle_mass_kg) {
            const muscleDiff = latest.muscle_mass_kg - previous.muscle_mass_kg;
            if (muscleDiff > 0.2) {
                insights.push({
                    icon: <TrendingUp className="h-5 w-5" />,
                    color: "text-emerald-600",
                    bg: "bg-emerald-100",
                    title: "Ganho Muscular 💪",
                    desc: `Você construiu ${muscleDiff.toFixed(1)}kg de massa muscular magra!`
                });
            }
        }
    }

    // Default Insights se não tem histórico suficiente / Não atingiu nada especial
    if (insights.length === 0) {
        insights.push({
            icon: <AlertCircle className="h-5 w-5" />,
            color: "text-gray-600",
            bg: "bg-gray-100",
            title: "Acompanhamento Ativo",
            desc: "Continue registrando seus dados regularmente para visualizarmos a sua transformação."
        });
    }

    return (
        <div className="flex flex-col gap-3">
            <h3 className="font-bold text-gray-800 mb-1 px-1">Insights Motivacionais ✨</h3>
            {insights.slice(0, 3).map((insight, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-white shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-all">
                    <div className={`p-2.5 rounded-xl shrink-0 ${insight.bg} ${insight.color}`}>
                        {insight.icon}
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm mb-0.5">{insight.title}</h4>
                        <p className="text-gray-500 text-xs leading-relaxed">{insight.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
