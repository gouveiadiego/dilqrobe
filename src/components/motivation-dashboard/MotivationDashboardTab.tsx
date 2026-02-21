import React from "react";
import { useTasks } from "@/hooks/useTasks";
import { useProjectCompanies } from "@/hooks/useProjectCompanies";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CompanyTaskCard } from "./CompanyTaskCard";
import { Rocket, Target } from "lucide-react";

export const MotivationDashboardTab = () => {
    const { tasks, isLoading: tasksLoading, toggleTask } = useTasks();
    const { companies, isLoading: companiesLoading } = useProjectCompanies();

    if (tasksLoading || companiesLoading) {
        return <LoadingSpinner size="lg" text="Carregando o seu painel de foco..." className="h-[60vh]" />;
    }

    // Active tasks only
    const activeTasks = tasks.filter((t) => !t.completed && t.project_company_id);

    // Split companies by type (default to 'fixed_monthly' if type is not set, or treat as fixed)
    const fixedClients = companies.filter(
        (c) => !c.project_type || c.project_type === "fixed_monthly"
    );

    const parallelProjects = companies.filter(
        (c) => c.project_type === "parallel"
    );

    return (
        <div className="space-y-8 animate-fade-in p-2 md:p-6 bg-gray-50/50 min-h-screen rounded-xl">
            <div className="flex flex-col items-start gap-2">
                <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-[#9b87f5] to-[#33C3F0] bg-clip-text text-transparent">
                    Dashboard de Motivação
                </h1>
                <p className="text-gray-500 font-medium">
                    Acompanhe o que falta para fechar o mês com chave de ouro!
                </p>
            </div>

            {/* Fixed Clients Section */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-[#9b87f5] to-[#7E69AB] rounded-xl shadow-lg border border-purple-200">
                        <Rocket className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Clientes Fixos / Mensais</h2>
                </div>

                {fixedClients.length === 0 ? (
                    <p className="text-gray-500 italic ml-14">Nenhum cliente fixo encontrado.</p>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {fixedClients.map((company) => (
                            <CompanyTaskCard
                                key={company.id}
                                company={company}
                                tasks={activeTasks.filter(t => t.project_company_id === company.id)}
                                onToggleTask={toggleTask}
                                variant="premium"
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Parallel Projects Section */}
            <section className="space-y-6 pt-6 mt-8 border-t border-gray-200/60">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl shadow-lg border border-gray-600">
                        <Target className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-700">Projetos Paralelos</h2>
                </div>

                {parallelProjects.length === 0 ? (
                    <p className="text-gray-500 italic ml-14">Nenhum projeto paralelo no momento.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {parallelProjects.map((company) => (
                            <CompanyTaskCard
                                key={company.id}
                                company={company}
                                tasks={activeTasks.filter(t => t.project_company_id === company.id)}
                                onToggleTask={toggleTask}
                                variant="standard"
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};
