import { FitnessMeasurement, FitnessProfile } from "@/hooks/useFitness";
import { Flame, Info, Clock, RefreshCw } from "lucide-react";
import { format, differenceInYears } from "date-fns";

export function MetabolicClock({ profile, latestMeas }: { profile: FitnessProfile, latestMeas?: FitnessMeasurement }) {
    if (!latestMeas || typeof latestMeas.metabolic_age !== 'number') return null;

    const metabolicAge = latestMeas.metabolic_age;
    const birthDate = profile.birth_date ? new Date(profile.birth_date) : null;
    const chronologicalAge = birthDate ? differenceInYears(new Date(), birthDate) : 0;

    let difference = 0;
    if (chronologicalAge > 0) {
        difference = chronologicalAge - metabolicAge;
    }

    let status = "Saudável";
    let statusColor = "text-emerald-500";
    let bgStatusColor = "bg-emerald-50";
    let barColor = "bg-emerald-400";
    let message = "Excelente! Seu metabolismo está mais jovem do que sua idade real. Suas células estão regenerando perfeitamente.";
    let icon = <RefreshCw className="h-8 w-8 text-emerald-500" />;

    if (difference < 0) {
        status = "Envelhecido";
        statusColor = "text-red-500";
        bgStatusColor = "bg-red-50";
        barColor = "bg-red-400";
        message = `Atenção: O desgaste interno do seu corpo equivale ao de uma pessoa de ${metabolicAge} anos. Acelere seu metabolismo com água e treinos anaeróbicos.`;
        icon = <Clock className="h-8 w-8 text-red-500" />;
    } else if (difference === 0) {
        status = "Dentro da Média";
        statusColor = "text-blue-500";
        bgStatusColor = "bg-blue-50";
        barColor = "bg-blue-400";
        message = "Sua idade metabólica caminha lado a lado com sua idade real.";
        icon = <Flame className="h-8 w-8 text-blue-500" />;
    }

    // Calcular a angulação do "Ponteiro" do relógio visual (Gauge)
    // Escala: a diferença pode ir de -15 a +15 geralmente.
    const maxDiff = 15;
    const clampedDiff = Math.min(Math.max(-maxDiff, difference), maxDiff);
    // Transformar de -15/+15 para um ângulo de -90 a +90 graus
    const angle = (clampedDiff / maxDiff) * 90;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full flex flex-col">
            <h3 className="font-bold text-gray-800 mb-2 px-1 flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-500" />
                Relógio Metabólico
            </h3>

            <div className="flex-1 flex flex-col md:flex-row items-center gap-6 mt-4">
                {/* Visual Gauge of the Concept */}
                <div className="relative w-40 h-24 shrink-0 overflow-hidden flex flex-col items-center">
                    {/* Semi circle track */}
                    <div className="absolute top-0 w-40 h-40 rounded-full border-[16px] border-gray-100"></div>
                    {/* Colored semi-circle (masking half of it, showing specific gradient) */}
                    <svg className="absolute w-40 h-40 transform -rotate-180" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="url(#clockGrad)" strokeWidth="16" strokeDasharray="132" strokeDashoffset="0" />
                        <defs>
                            <linearGradient id="clockGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#ef4444" /> {/* Ruim - Mais Velho (Esquerda agora porque roda -180) */}
                                <stop offset="50%" stopColor="#eab308" />
                                <stop offset="100%" stopColor="#10b981" /> {/* Bom - Mais Novo */}
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Mask out lower half */}
                    <div className="absolute top-[100px] w-[110%] h-[100px] bg-white"></div>

                    {/* Gauge needle */}
                    <div className="absolute top-[80px] origin-bottom transition-all duration-1000 ease-in-out" style={{ transform: `rotate(${angle}deg)` }}>
                        <div className="w-[4px] h-[34px] bg-gray-800 rounded-full -mt-[34px]"></div>
                        <div className="w-3 h-3 bg-gray-800 rounded-full absolute bottom-[-6px] left-[-4px]"></div>
                    </div>

                    <div className="absolute top-[65px] font-bold text-gray-400 text-[10px] w-full flex justify-between px-2">
                        <span>+Velho</span>
                        <span>+Novo</span>
                    </div>
                </div>

                <div className="flex-1 space-y-3 w-full text-center md:text-left">
                    <div className="flex flex-col sm:flex-row items-center gap-2 justify-center md:justify-start">
                        <div className={`shrink-0 p-3 rounded-2xl ${bgStatusColor} shadow-inner`}>
                            {icon}
                        </div>
                        <div>
                            <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                {metabolicAge} <span className="text-sm font-medium text-gray-400 uppercase tracking-normal">Anos</span>
                            </div>
                            <div className={`text-sm font-bold ${statusColor}`}>
                                {chronologicalAge > 0 && difference !== 0 ? (
                                    <span>{Math.abs(difference)} anos mais {difference > 0 ? "jovem" : "velho"}!</span>
                                ) : (
                                    <span>{status}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-gray-500 flex gap-2 items-start bg-gray-50 p-3 rounded-xl border border-gray-100/50">
                        <Info className="h-4 w-4 shrink-0 text-dilq-accent mt-0.5" />
                        <span className="leading-relaxed font-medium">
                            {chronologicalAge > 0
                                ? `Você tem ${chronologicalAge} anos de idade cronológica. ${message}`
                                : "Adicione sua data de nascimento no Perfil para cruzar esse dado com a sua idade real."
                            }
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
