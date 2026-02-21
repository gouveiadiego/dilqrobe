import React from "react";
import { ProjectCompany } from "@/hooks/useProjectCompanies";
import { Task } from "@/types/task";
import { CheckCircle2, Circle, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import confetti from "canvas-confetti";

interface CompanyTaskCardProps {
    company: ProjectCompany;
    tasks: Task[];
    onToggleTask: (id: string) => void;
    variant?: 'premium' | 'standard';
}

export const CompanyTaskCard = ({ company, tasks, onToggleTask, variant = 'standard' }: CompanyTaskCardProps) => {
    const pendingCount = tasks.length;

    // Just a visual representation assuming we are tracking all tasks done vs total
    const handleTaskComplete = (taskId: string) => {
        onToggleTask(taskId);

        // Animate confetti if doing premium motivation
        if (variant === 'premium') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#9b87f5', '#33C3F0', '#F97316']
            });
        }
    };

    const isPremium = variant === 'premium';

    return (
        <div className={`relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isPremium
                ? "bg-gradient-to-br from-white to-purple-50/50 border border-purple-100 shadow-md"
                : "bg-white border border-gray-100 shadow-sm"
            }`}>
            {/* Accent Top Border */}
            <div className={`h-2 w-full ${isPremium ? 'bg-gradient-to-r from-[#9b87f5] to-[#33C3F0]' : 'bg-gray-300'}`} />

            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className={`text-lg font-bold ${isPremium ? 'text-gray-900' : 'text-gray-700'}`}>{company.name}</h3>
                        {pendingCount === 0 ? (
                            <p className="text-sm font-medium text-emerald-600 mt-1 flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4" /> Todas as tarefas concluídas!
                            </p>
                        ) : (
                            <p className={`text-sm mt-1 font-medium ${isPremium ? 'text-purple-600' : 'text-gray-500'}`}>
                                Faltam {pendingCount} tarefa{pendingCount !== 1 ? 's' : ''} para finalizar
                            </p>
                        )}
                    </div>
                    {isPremium && (
                        <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-[#9b87f5]" />
                        </div>
                    )}
                </div>

                {/* Task List */}
                <div className="space-y-3 mt-6 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {tasks.map(task => (
                        <button
                            key={task.id}
                            onClick={() => handleTaskComplete(task.id)}
                            className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-black/5 transition-colors text-left group"
                        >
                            <Circle className={`h-5 w-5 mt-0.5 shrink-0 transition-colors ${isPremium ? 'text-purple-300 group-hover:text-[#9b87f5]' : 'text-gray-300 group-hover:text-gray-500'
                                }`} />
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium text-gray-700 truncate ${task.priority === 'high' ? 'text-orange-600' : ''}`}>
                                    {task.title}
                                </p>
                                {task.due_date && (
                                    <span className="text-xs text-gray-400">
                                        Geral • Prazo: {new Date(task.due_date).toLocaleDateString('pt-BR')}
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}

                    {tasks.length === 0 && (
                        <div className="py-6 flex flex-col items-center justify-center text-center opacity-70">
                            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Nada pendente aqui!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
