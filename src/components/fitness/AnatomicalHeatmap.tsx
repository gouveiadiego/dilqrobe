import { BodyMeasurement } from "@/hooks/useFitness";
import { Activity, Ruler } from "lucide-react";

export function AnatomicalHeatmap({ measurements }: { measurements: BodyMeasurement[] }) {
    if (measurements.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Ruler className="h-6 w-6 text-gray-300" />
                </div>
                <h4 className="font-bold text-gray-700">Mapa Anatômico</h4>
                <p className="text-sm text-gray-500 mt-2 max-w-xs">Adicione suas medidas de fita para acompanhar o crescimento e perda de medidas visualmente.</p>
            </div>
        );
    }

    const latest = measurements[0];
    const previous = measurements.length > 1 ? measurements[1] : null;

    // Helper para calcular a diferença e retornar objeto de renderização
    const getDelta = (current?: number | null, prev?: number | null) => {
        if (!current) return null;
        if (!prev) return { value: current, diff: 0, text: `${current}cm` };

        const diff = current - prev;
        const sign = diff > 0 ? '+' : '';
        const colorClass = diff > 0 ? 'text-blue-600 bg-blue-50 border-blue-200' : diff < 0 ? 'text-green-600 bg-green-50 border-green-200' : 'text-gray-500 bg-gray-50 border-gray-200';
        const iconColor = diff > 0 ? 'fill-blue-400' : diff < 0 ? 'fill-green-400' : 'fill-gray-300';

        return {
            value: current,
            diff,
            text: diff !== 0 ? `${sign}${diff.toFixed(1)}cm` : '=',
            colorClass,
            iconColor
        };
    };

    // Deltas de cada parte do corpo
    const neck = getDelta(latest.neck_cm, previous?.neck_cm);
    const chest = getDelta(latest.chest_cm, previous?.chest_cm);
    const leftArm = getDelta(latest.left_arm_cm, previous?.left_arm_cm);
    const rightArm = getDelta(latest.right_arm_cm, previous?.right_arm_cm);
    const abdomen = getDelta(latest.abdomen_cm, previous?.abdomen_cm);
    const waist = getDelta(latest.waist_cm, previous?.waist_cm);
    const hip = getDelta(latest.hip_cm, previous?.hip_cm);
    const leftThigh = getDelta(latest.left_thigh_cm, previous?.left_thigh_cm);
    const rightThigh = getDelta(latest.right_thigh_cm, previous?.right_thigh_cm);
    const leftCalf = getDelta(latest.left_calf_cm, previous?.left_calf_cm);
    const rightCalf = getDelta(latest.right_calf_cm, previous?.right_calf_cm);

    // Render Badge
    const MeasurementBadge = ({ data, label, className }: { data: ReturnType<typeof getDelta>, label: string, className?: string }) => {
        if (!data) return null;
        return (
            <div className={`absolute flex flex-col items-center z-10 ${className}`}>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5 drop-shadow-sm">{label}</div>
                <div className={`px-2.5 py-1 rounded-lg border text-xs font-bold shadow-sm flex flex-col items-center min-w-[50px] ${data.colorClass}`}>
                    <span>{data.value}cm</span>
                    {data.diff !== 0 && (
                        <span className="text-[9px] opacity-80 mt-[-2px]">{data.text}</span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-full min-h-[500px]">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-dilq-accent" />
                        Mapa Anatômico
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Evolução em centímetros (Mês Atual x Anterior)</p>
                </div>

                {/* Legenda */}
                {previous && (
                    <div className="flex gap-3 text-[10px] font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Cresceu (+)</div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Secou (-)</div>
                    </div>
                )}
            </div>

            <div className="flex-1 relative flex items-center justify-center p-4">

                {/* A Silhueta SVG */}
                <div className="relative w-[280px] h-[480px]">
                    <svg viewBox="0 0 100 240" className="w-full h-full drop-shadow-sm opacity-80">
                        {/* Cores dinâmicas para cada parte, se houve mudança */}
                        <defs>
                            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                        </defs>

                        {/* Corpo Base (Cinza claro neutro) */}
                        <g fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1" strokeLinejoin="round">
                            {/* Cabeça */}
                            <circle cx="50" cy="20" r="14" />
                            {/* Pescoço */}
                            <path d="M 44 32 L 56 32 L 57 44 L 43 44 Z" fill={neck?.iconColor || '#f3f4f6'} />

                            {/* Ombros e Tronco Superior (Peito) */}
                            <path d="M 28 44 Q 50 38 72 44 Q 76 60 70 80 Q 50 85 30 80 Q 24 60 28 44 Z" fill={chest?.iconColor || '#f3f4f6'} style={{ transition: "fill 0.5s ease" }} />

                            {/* Cintura e Abdômen */}
                            <path d="M 30 80 Q 50 85 70 80 Q 64 110 68 135 Q 50 145 32 135 Q 36 110 30 80 Z" fill={abdomen?.iconColor || waist?.iconColor || '#f3f4f6'} />

                            {/* Quadril */}
                            <path d="M 32 135 Q 50 145 68 135 Q 75 160 50 160 Q 25 160 32 135 Z" fill={hip?.iconColor || '#f3f4f6'} />

                            {/* Braço Esquerdo (Visualmente à direita na tela) */}
                            <path d="M 72 44 Q 88 55 84 100 Q 80 130 82 140" fill="none" stroke={leftArm?.iconColor || '#e5e7eb'} strokeWidth="12" strokeLinecap="round" />

                            {/* Braço Direito (Visualmente à esquerda na tela) */}
                            <path d="M 28 44 Q 12 55 16 100 Q 20 130 18 140" fill="none" stroke={rightArm?.iconColor || '#e5e7eb'} strokeWidth="12" strokeLinecap="round" />

                            {/* Coxa Esquerda */}
                            <path d="M 52 160 L 64 200" fill="none" stroke={leftThigh?.iconColor || '#e5e7eb'} strokeWidth="16" strokeLinecap="round" />

                            {/* Perna/Panturrilha Esquerda */}
                            <path d="M 64 200 L 66 235" fill="none" stroke={leftCalf?.iconColor || '#e5e7eb'} strokeWidth="12" strokeLinecap="round" />

                            {/* Coxa Direita */}
                            <path d="M 48 160 L 36 200" fill="none" stroke={rightThigh?.iconColor || '#e5e7eb'} strokeWidth="16" strokeLinecap="round" />

                            {/* Perna/Panturrilha Direita */}
                            <path d="M 36 200 L 34 235" fill="none" stroke={rightCalf?.iconColor || '#e5e7eb'} strokeWidth="12" strokeLinecap="round" />
                        </g>

                        {/* Linhas de Marcação (Tracejadas) */}
                        <g stroke="#9ca3af" strokeWidth="0.5" strokeDasharray="2 2" fill="none" opacity="0.6">
                            {neck && <path d="M 45 38 L 85 38" />}
                            {chest && <path d="M 50 65 L 15 65" />}
                            {abdomen && <line x1="10" y1="110" x2="50" y2="110" />}
                            {hip && <line x1="85" y1="145" x2="50" y2="145" />}
                            {rightArm && <line x1="16" y1="85" x2="-5" y2="85" />}
                            {leftArm && <line x1="84" y1="85" x2="105" y2="85" />}
                            {rightThigh && <line x1="40" y1="180" x2="-5" y2="180" />}
                            {leftThigh && <line x1="60" y1="180" x2="105" y2="180" />}
                            {rightCalf && <line x1="35" y1="220" x2="-5" y2="220" />}
                            {leftCalf && <line x1="65" y1="220" x2="105" y2="220" />}
                        </g>
                    </svg>

                    {/* Labels HTML Absolutos sobre o SVG */}
                    <MeasurementBadge data={neck} label="Pescoço" className="top-[45px] right-[-20px]" />
                    <MeasurementBadge data={chest} label="Peito" className="top-[100px] left-[-20px]" />

                    <MeasurementBadge data={rightArm} label="Braço Dir." className="top-[140px] left-[-30px]" />
                    <MeasurementBadge data={leftArm} label="Braço Esq." className="top-[140px] right-[-30px]" />

                    <MeasurementBadge data={waist} label="Cintura" className="top-[185px] left-[-20px]" />
                    <MeasurementBadge data={abdomen} label="Abdômen" className="top-[225px] left-[-20px]" />

                    <MeasurementBadge data={hip} label="Quadril" className="top-[265px] right-[-10px]" />

                    <MeasurementBadge data={rightThigh} label="Coxa Dir." className="top-[335px] left-[-30px]" />
                    <MeasurementBadge data={leftThigh} label="Coxa Esq." className="top-[335px] right-[-30px]" />

                    <MeasurementBadge data={rightCalf} label="Pant. Dir." className="bottom-[20px] left-[-30px]" />
                    <MeasurementBadge data={leftCalf} label="Pant. Esq." className="bottom-[20px] right-[-30px]" />

                </div>

            </div>
        </div>
    );
}
