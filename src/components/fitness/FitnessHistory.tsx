import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FitnessProfile, FitnessMeasurement, BodyMeasurement, useFitness } from "@/hooks/useFitness";
import { Button } from "@/components/ui/button";
import { Trash2, Edit3, Activity, Ruler } from "lucide-react";
import { FitnessForm } from "./FitnessForm";

export function FitnessHistory({
    profile,
    measurements,
    bodyMeasurements
}: {
    profile: FitnessProfile;
    measurements: FitnessMeasurement[];
    bodyMeasurements: BodyMeasurement[];
}) {
    const { deleteMeasurement, deleteBodyMeasurement } = useFitness(profile.id);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Bioimpedance History */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                    <Activity className="h-5 w-5 text-dilq-accent" />
                    <h3 className="font-bold text-gray-800">Histórico de Bioimpedância</h3>
                </div>

                {measurements.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Nenhum registro de balança encontrado.</div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {measurements.map(m => (
                            <div key={m.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                <div>
                                    <div className="font-bold text-gray-900 mb-1">
                                        {format(parseISO(m.measured_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                        <span><strong className="text-gray-800">{m.weight_kg}kg</strong> (Peso)</span>
                                        {m.body_fat_pct && <span><strong className="text-gray-800">{m.body_fat_pct}%</strong> (Gordura)</span>}
                                        {m.muscle_mass_kg && <span><strong className="text-gray-800">{m.muscle_mass_kg}kg</strong> (Músculo)</span>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                    <FitnessForm
                                        profile={profile}
                                        initialBioData={m}
                                        triggerNode={
                                            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-gray-600 hover:text-dilq-accent">
                                                <Edit3 className="h-3.5 w-3.5" /> Editar
                                            </Button>
                                        }
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => {
                                            if (window.confirm('Excluir este registro permanentemente?')) {
                                                deleteMeasurement(m.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Body Measurements History */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                    <Ruler className="h-5 w-5 text-dilq-teal" />
                    <h3 className="font-bold text-gray-800">Histórico de Medidas (Fita)</h3>
                </div>

                {bodyMeasurements.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Nenhum registro de fita métrica encontrado.</div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {bodyMeasurements.map(m => (
                            <div key={m.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                                <div>
                                    <div className="font-bold text-gray-900 mb-1">
                                        {format(parseISO(m.measured_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                        {m.chest_cm && <span>Peito: <strong>{m.chest_cm}cm</strong></span>}
                                        {m.waist_cm && <span>Cintura: <strong>{m.waist_cm}cm</strong></span>}
                                        {m.abdomen_cm && <span>Abdômen: <strong>{m.abdomen_cm}cm</strong></span>}
                                        {m.hip_cm && <span>Quadril: <strong>{m.hip_cm}cm</strong></span>}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                    <FitnessForm
                                        profile={profile}
                                        initialBodyData={m}
                                        triggerNode={
                                            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-gray-600 hover:text-dilq-accent">
                                                <Edit3 className="h-3.5 w-3.5" /> Editar
                                            </Button>
                                        }
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => {
                                            if (window.confirm('Excluir estas medidas permanentemente?')) {
                                                deleteBodyMeasurement(m.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
