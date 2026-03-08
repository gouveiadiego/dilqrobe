import { FitnessMeasurement } from "@/hooks/useFitness";
import { Info } from "lucide-react";

export function BodyVisualizer({ latestMeas, gender }: { latestMeas?: FitnessMeasurement, gender: 'male' | 'female' }) {
    if (!latestMeas || !latestMeas.bmi) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center text-center h-full min-h-[320px]">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                </div>
                <h4 className="font-bold text-gray-700">Visualizador Corporal</h4>
                <p className="text-sm text-gray-500 mt-2 max-w-xs">Adicione seu peso e altura para ver a simulação do seu tipo físico.</p>
            </div>
        );
    }

    const bmi = latestMeas.bmi;
    const bodyFat = latestMeas.body_fat_pct;

    // Calculando a "largura" do boneco baseada no IMC
    // IMC normal = ~22 (fator 1). IMC 35 (fator ~1.6). IMC 17 (fator ~0.8)
    const rawWidthFactor = bmi / 22;
    // Limitando visualmente para não distorcer demais ou "quebrar"
    const widthFactor = Math.max(0.7, Math.min(1.8, rawWidthFactor));

    // Classificação IMC
    let imcCategory = "Normal";
    let imcColor = "text-green-500";
    let imcBgColor = "bg-green-100";
    let barColor = "bg-green-500";

    if (bmi < 18.5) {
        imcCategory = "Abaixo do Peso";
        imcColor = "text-blue-500";
        imcBgColor = "bg-blue-100";
        barColor = "bg-blue-500";
    } else if (bmi >= 25 && bmi <= 29.9) {
        imcCategory = "Sobrepeso";
        imcColor = "text-yellow-500";
        imcBgColor = "bg-yellow-100";
        barColor = "bg-yellow-500";
    } else if (bmi >= 30 && bmi <= 34.9) {
        imcCategory = "Obesidade I";
        imcColor = "text-orange-500";
        imcBgColor = "bg-orange-100";
        barColor = "bg-orange-500";
    } else if (bmi >= 35) {
        imcCategory = "Obesidade II+";
        imcColor = "text-red-500";
        imcBgColor = "bg-red-100";
        barColor = "bg-red-500";
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-stretch min-h-[320px]">
            {/* O Bonequinho */}
            <div className={`p-6 rounded-2xl flex items-center justify-center w-full max-w-[200px] bg-gradient-to-b from-gray-50 to-gray-100/50 relative overflow-hidden`}>
                <svg width="100%" height="100%" viewBox="0 0 100 240" className="drop-shadow-sm min-h-[220px]">
                    {/* Head - doesn't scale horizontally */}
                    <circle cx="50" cy="30" r="18" fill="url(#bodyGrad)" />

                    {/* Neck */}
                    <path d="M 45 45 L 55 45 L 56 55 L 44 55 Z" fill="url(#bodyGrad)" />

                    {/* Torso & Legs Group - scales based on BMI */}
                    <g style={{ transform: `scaleX(${widthFactor})`, transformOrigin: "50% 50%" }}>
                        {/* Upper Body / Tors */}
                        <path d="M 30 55 Q 50 48 70 55 Q 75 90 70 130 Q 50 140 30 130 Q 25 90 30 55 Z" fill="url(#bodyGrad)" />

                        {/* Arms (Resting on sides, scale with torso) */}
                        <path d="M 30 55 Q 15 80 20 120" fill="none" stroke="url(#bodyGrad)" strokeWidth="12" strokeLinecap="round" />
                        <path d="M 70 55 Q 85 80 80 120" fill="none" stroke="url(#bodyGrad)" strokeWidth="12" strokeLinecap="round" />

                        {/* Legs */}
                        <path d="M 40 125 L 35 210" fill="none" stroke="url(#bodyGrad)" strokeWidth="16" strokeLinecap="round" />
                        <path d="M 60 125 L 65 210" fill="none" stroke="url(#bodyGrad)" strokeWidth="16" strokeLinecap="round" />
                    </g>

                    <defs>
                        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                            {gender === 'female' ? (
                                <>
                                    <stop offset="0%" stopColor="#ec4899" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </>
                            ) : (
                                <>
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#0ea5e9" />
                                </>
                            )}
                        </linearGradient>
                    </defs>
                </svg>

                <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${imcBgColor} ${imcColor}`}>
                    IMC {bmi}
                </div>
            </div>

            {/* Resumo e Medidores */}
            <div className="flex-1 flex flex-col justify-center space-y-5">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">Estado Atual</h3>
                    <p className="text-sm text-gray-500 font-medium">Classificação corporal baseada no seu IMC.</p>
                </div>

                <div className="space-y-4">
                    {/* IMC Meter */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                            <span className="font-bold text-gray-700">Sua Categoria IMC</span>
                            <span className={`font-bold ${imcColor}`}>{imcCategory}</span>
                        </div>
                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden flex">
                            {/* Bar representing ranges: <18.5, 18.5-24.9, 25-29.9, >=30 */}
                            <div className={`h-full ${barColor}`} style={{ width: `${Math.min(100, Math.max(5, (bmi / 40) * 100))}%`, transition: 'width 1s ease-in-out' }} />
                        </div>
                        <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400 px-1">
                            <span>Abaixo</span>
                            <span>Normal</span>
                            <span>Sobrepeso</span>
                            <span>Obeso</span>
                        </div>
                    </div>

                    {/* Body Fat context if available */}
                    {bodyFat && (
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex gap-3 items-start">
                            <Info className="h-4 w-4 text-dilq-accent shrink-0 mt-0.5" />
                            <div className="text-xs text-gray-600">
                                Seu percentual de gordura atual é de <strong>{bodyFat}%</strong>.
                                Lembre-se que o IMC é um indicador geral; a composição de músculos e gordura conta muito mais para o seu visual!
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
