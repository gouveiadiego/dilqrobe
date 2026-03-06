import { useState, useMemo } from "react";
import { format, parseISO, subDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FitnessMeasurement } from "@/hooks/useFitness";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';

type Period = '30' | '90' | '180' | '365' | 'all';

export function FitnessCharts({
    profileId,
    measurements,
    goalWeight,
    goalBodyFat
}: {
    profileId: string,
    measurements: FitnessMeasurement[],
    goalWeight?: number | null,
    goalBodyFat?: number | null
}) {
    const [period, setPeriod] = useState<Period>('90');

    const chartData = useMemo(() => {
        // We want chronological order for the chart (oldest to newest)
        let filtered = [...measurements].reverse();

        if (period !== 'all') {
            const cutoffDate = subDays(new Date(), parseInt(period));
            filtered = filtered.filter(m => isAfter(parseISO(m.measured_at), cutoffDate));
        }

        return filtered.map(m => ({
            ...m,
            displayDate: format(parseISO(m.measured_at), "dd/MMM", { locale: ptBR })
        }));
    }, [measurements, period]);

    if (measurements.length < 2) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <h3 className="text-xl font-bold text-gray-700 mb-2">Gráficos de Evolução</h3>
                <p className="text-gray-500">Adicione pelo menos 2 medições para visualizar seus gráficos de progresso ao longo do tempo.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-2 justify-end">
                {(['30', '90', '180', '365', 'all'] as Period[]).map(p => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${period === p
                            ? 'bg-dilq-accent text-white shadow-sm'
                            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {p === '30' ? '1 Mês' : p === '90' ? '3 Meses' : p === '180' ? '6 Meses' : p === '365' ? '1 Ano' : 'Tudo'}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Weight Chart */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 h-80">
                    <h4 className="font-bold text-gray-700 text-sm mb-4">Peso (kg) e Massa Muscular</h4>
                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="displayDate" tick={{ fontSize: 12, fill: '#6B7280' }} tickMargin={10} axisLine={false} tickLine={false} />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            {goalWeight && (
                                <ReferenceLine y={goalWeight} label="Meta (kg)" stroke="#f59e0b" strokeDasharray="3 3" />
                            )}
                            <Line type="monotone" name="Peso (kg)" dataKey="weight_kg" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} />
                            <Line type="monotone" name="Massa Muscular (kg)" dataKey="muscle_mass_kg" stroke="#3b82f6" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Fat Chart */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 h-80">
                    <h4 className="font-bold text-gray-700 text-sm mb-4">Composição Corporal (%)</h4>
                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="displayDate" tick={{ fontSize: 12, fill: '#6B7280' }} tickMargin={10} axisLine={false} tickLine={false} />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            {goalBodyFat && (
                                <ReferenceLine y={goalBodyFat} label="Meta (%)" stroke="#f59e0b" strokeDasharray="3 3" />
                            )}
                            <Line type="monotone" name="% Gordura" dataKey="body_fat_pct" stroke="#ef4444" strokeWidth={3} activeDot={{ r: 6 }} />
                            <Line type="monotone" name="% Água" dataKey="water_pct" stroke="#0ea5e9" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
