import { useState } from 'react';
import { useFitnessDailyLog } from '@/hooks/useFitnessDailyLog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Droplet, Moon, Footprints, Heart, Loader2, Plus, Minus } from 'lucide-react';

const MOODS = [
  { value: 1, emoji: '😣', label: 'Mal' },
  { value: 2, emoji: '😕', label: 'Baixo' },
  { value: 3, emoji: '😐', label: 'OK' },
  { value: 4, emoji: '🙂', label: 'Bom' },
  { value: 5, emoji: '🤩', label: 'Ótimo' },
];

export function FitnessDailyLog() {
  const { todayLog, targets, upsert, isSaving, isLoading } = useFitnessDailyLog();
  const [sleepInput, setSleepInput] = useState('');
  const [stepsInput, setStepsInput] = useState('');

  if (isLoading) {
    return (
      <Card><CardContent className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card>
    );
  }

  const water = todayLog?.water_ml ?? 0;
  const sleep = todayLog?.sleep_hours ?? null;
  const steps = todayLog?.steps ?? 0;
  const cardio = todayLog?.cardio_minutes ?? 0;
  const mood = todayLog?.mood ?? null;

  const pct = (val: number, target: number) => Math.min(100, (val / target) * 100);

  const Tile = ({
    icon, label, value, target, unit, color, bgColor, children,
  }: any) => (
    <div className={`rounded-xl border p-3 space-y-2 ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">meta {target}{unit}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>
        {value}<span className="text-sm font-medium text-muted-foreground ml-1">{unit}</span>
      </div>
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all`} style={{ width: `${pct(value || 0, target)}%`, backgroundColor: `var(--tw-${color})` }} />
      </div>
      <div className="flex gap-1 pt-1">{children}</div>
    </div>
  );

  return (
    <Card className="w-full shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            💧 Diário do Dia
          </h3>
          <span className="text-xs text-muted-foreground">hidratação · sono · passos · cardio</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* WATER */}
          <div className="rounded-xl border p-3 space-y-2 bg-blue-50/40 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Droplet className="h-3.5 w-3.5 text-blue-500" /> Água
              </div>
              <span className="text-[10px] text-muted-foreground">meta {targets.water_ml}ml</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {water}<span className="text-sm font-medium text-muted-foreground ml-1">ml</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct(water, targets.water_ml)}%` }} />
            </div>
            <div className="flex gap-1 pt-1">
              {[250, 500].map(ml => (
                <Button key={ml} size="sm" variant="outline" className="h-7 text-xs flex-1"
                  disabled={isSaving}
                  onClick={() => upsert({ water_ml: Math.max(0, water + ml) })}>
                  +{ml}
                </Button>
              ))}
              <Button size="sm" variant="ghost" className="h-7 px-2"
                disabled={isSaving || water === 0}
                onClick={() => upsert({ water_ml: Math.max(0, water - 250) })}>
                <Minus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* SLEEP */}
          <div className="rounded-xl border p-3 space-y-2 bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Moon className="h-3.5 w-3.5 text-indigo-500" /> Sono
              </div>
              <span className="text-[10px] text-muted-foreground">meta {targets.sleep_hours}h</span>
            </div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {sleep ?? '--'}<span className="text-sm font-medium text-muted-foreground ml-1">h</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct(sleep ?? 0, targets.sleep_hours)}%` }} />
            </div>
            <div className="flex gap-1 pt-1">
              <Input type="number" step="0.5" placeholder="7.5" className="h-7 text-xs"
                value={sleepInput}
                onChange={e => setSleepInput(e.target.value)}
                onBlur={() => {
                  if (sleepInput) {
                    upsert({ sleep_hours: parseFloat(sleepInput) });
                    setSleepInput('');
                  }
                }} />
            </div>
          </div>

          {/* STEPS */}
          <div className="rounded-xl border p-3 space-y-2 bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Footprints className="h-3.5 w-3.5 text-emerald-500" /> Passos
              </div>
              <span className="text-[10px] text-muted-foreground">meta {targets.steps.toLocaleString()}</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {steps.toLocaleString()}
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct(steps, targets.steps)}%` }} />
            </div>
            <div className="flex gap-1 pt-1">
              <Input type="number" placeholder="8000" className="h-7 text-xs"
                value={stepsInput}
                onChange={e => setStepsInput(e.target.value)}
                onBlur={() => {
                  if (stepsInput) {
                    upsert({ steps: parseInt(stepsInput) });
                    setStepsInput('');
                  }
                }} />
            </div>
          </div>

          {/* CARDIO */}
          <div className="rounded-xl border p-3 space-y-2 bg-rose-50/40 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Heart className="h-3.5 w-3.5 text-rose-500" /> Cardio
              </div>
              <span className="text-[10px] text-muted-foreground">meta {targets.cardio_minutes}min</span>
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {cardio}<span className="text-sm font-medium text-muted-foreground ml-1">min</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct(cardio, targets.cardio_minutes)}%` }} />
            </div>
            <div className="flex gap-1 pt-1">
              {[10, 20, 30].map(min => (
                <Button key={min} size="sm" variant="outline" className="h-7 text-xs flex-1"
                  disabled={isSaving}
                  onClick={() => upsert({ cardio_minutes: cardio + min })}>
                  +{min}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* MOOD */}
        <div className="flex items-center gap-3 pt-2 border-t">
          <span className="text-xs font-medium text-muted-foreground">Como você está hoje?</span>
          <div className="flex gap-1">
            {MOODS.map(m => (
              <button
                key={m.value}
                disabled={isSaving}
                onClick={() => upsert({ mood: m.value })}
                className={`text-xl px-2 py-1 rounded-lg transition-all ${mood === m.value ? 'bg-primary/10 scale-110' : 'hover:bg-secondary opacity-60 hover:opacity-100'}`}
                title={m.label}
              >
                {m.emoji}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
