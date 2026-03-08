import { FitnessMeasurement } from "@/hooks/useFitness";
import { AlertCircle, HeartPulse, Info, ShieldCheck, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

export function VisceralFatHeatmap({ latestMeas }: { latestMeas?: FitnessMeasurement }) {
    if (!latestMeas || typeof latestMeas.visceral_fat !== 'number') return null;

    const visceral = latestMeas.visceral_fat;

    // Categorias de Risco (escala 1 a 59 tipicamente, mas focaremos até 20 para visualização)
    let category = "Saudável";
    let color = "bg-green-500";
    let textColor = "text-green-700";
    let bgColor = "bg-green-50";
    let icon = <ShieldCheck className="h-6 w-6 text-green-500" />;
    let message = "Sua gordura visceral está em um nível excelente. Seus órgãos internos estão bem protegidos sem excesso de gordura perigosa ao redor do coração e fígado.";
    let riskLevel = "Baixo Risco Cardiovascular";

    if (visceral >= 10 && visceral <= 14) {
        category = "Alerta (Nível Elevado)";
        color = "bg-yellow-500";
        textColor = "text-yellow-700";
        bgColor = "bg-yellow-50";
        icon = <AlertTriangle className="h-6 w-6 text-yellow-500" />;
        message = "Atenção: A gordura começou a se acumular ao redor dos órgãos corporais. O ideal é reduzir o consumo de açúcares, álcool e carboidratos refinados para evitar a progressão.";
        riskLevel = "Risco Moderado";
    } else if (visceral >= 15) {
        category = "Perigo (Nível Crítico)";
        color = "bg-red-500";
        textColor = "text-red-700";
        bgColor = "bg-red-50";
        icon = <AlertCircle className="h-6 w-6 text-red-500" />;
        message = "Alerta Médico: Gordura visceral muito alta. Há aumento drástico no risco de diabetes tipo 2, hipertensão e ataques cardíacos. Recomenda-se acompanhamento médico imediato e dieta rigorosa.";
        riskLevel = "Alto Risco Clínico";
    }

    // Calcular a posição da seta (escala visual de 1 a 30)
    // Se passar de 30, tranca no máximo da barra.
    const maxScale = 30;
    const clampedVisceral = Math.min(Math.max(visceral, 1), maxScale);
    const percentage = (clampedVisceral / maxScale) * 100;

    return (
        <div className="w-full">
            <h3 className="font-bold text-gray-800 mb-4 px-1 flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-rose-500" />
                Mapa de Risco: Gordura Visceral
            </h3>

            <Card className={`p-6 border ${textColor.replace('text', 'border')}/30 ${bgColor} shadow-sm transition-all relative overflow-hidden`}>
                {/* Background pulse effect for high risk */}
                {visceral >= 15 && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
                )}

                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">

                    {/* Indicador Principal */}
                    <div className="shrink-0 flex items-center gap-4 w-full md:w-1/3">
                        <div className={`p-4 rounded-2xl bg-white shadow-sm border ${textColor.replace('text', 'border')}/10`}>
                            {icon}
                        </div>
                        <div>
                            <div className="flex items-end gap-1">
                                <span className={`text-4xl font-extrabold tracking-tight ${textColor.replace('700', '600')}`}>{visceral}</span>
                                <span className="text-sm font-medium text-gray-500 mb-1.5 uppercase">Nível</span>
                            </div>
                            <span className={`text-sm font-bold ${textColor}`}>{riskLevel}</span>
                        </div>
                    </div>

                    {/* Escala (Heatmap Thermometer) */}
                    <div className="w-full md:w-2/3 space-y-3">
                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-1 px-1">
                            <span className="w-1/3 text-left">Saudável (1-9)</span>
                            <span className="w-1/3 text-center">Alerta (10-14)</span>
                            <span className="w-1/3 text-right">Perigo (15+)</span>
                        </div>

                        <div className="relative h-4 w-full bg-gray-200 rounded-full overflow-hidden flex">
                            {/* Gradiente do Termômetro */}
                            <div className="h-full w-1/3 bg-gradient-to-r from-emerald-400 to-green-500 relative">
                                <div className="absolute right-0 top-0 bottom-0 w-px bg-white/50 z-10 hidden sm:block"></div>
                            </div>
                            <div className="h-full w-1/6 bg-gradient-to-r from-yellow-400 to-orange-400 relative">
                                <div className="absolute right-0 top-0 bottom-0 w-px bg-white/50 z-10 hidden sm:block"></div>
                            </div>
                            <div className="h-full w-1/2 bg-gradient-to-r from-red-500 to-rose-700"></div>
                        </div>

                        {/* Pino / Seta Indicadora */}
                        <div className="relative w-full h-8 mt-1">
                            <div
                                className="absolute top-0 -ml-3 flex flex-col items-center transition-all duration-1000 ease-out"
                                style={{ left: `${percentage}%` }}
                            >
                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-gray-800 rotate-180"></div>
                                <div className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm mt-1 whitespace-nowrap">
                                    Seu Nível: {visceral}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Caixa de Explicação Médica */}
                <div className="mt-6 pt-5 border-t border-black/5 flex gap-3 text-sm">
                    <Info className={`h-5 w-5 shrink-0 ${textColor} mt-0.5`} />
                    <p className={`font-medium ${textColor} leading-relaxed`}>
                        {message}
                    </p>
                </div>
            </Card>
        </div>
    );
}
