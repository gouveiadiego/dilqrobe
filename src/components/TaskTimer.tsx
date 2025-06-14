
import { useState, useEffect } from "react";
import { Task, TaskUpdate } from "@/types/task";
import { Button } from "@/components/ui/button";

interface TaskTimerProps {
  task: Task;
  onUpdate: (updates: TaskUpdate) => void;
}

export function TaskTimer({ task, onUpdate }: TaskTimerProps) {
  const [seconds, setSeconds] = useState<number>(task.timer_value_seconds ?? 0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const handleStop = () => {
    setIsRunning(false);
    onUpdate({ timer_value_seconds: seconds });
  };
  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
    onUpdate({ timer_value_seconds: 0 });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs bg-gray-100 rounded px-2 py-1">
        {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, "0")}
      </span>
      <Button variant="ghost" size="sm" onClick={() => setIsRunning(r => !r)}>
        {isRunning ? "Pausar" : "Iniciar"}
      </Button>
      <Button variant="outline" size="sm" onClick={handleStop} disabled={!isRunning}>
        Salvar
      </Button>
      <Button variant="destructive" size="sm" onClick={handleReset}>
        Zerar
      </Button>
    </div>
  );
}
