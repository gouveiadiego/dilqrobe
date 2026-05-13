import "./hevy.css";
import { useHevyIntegration } from "@/hooks/useHevyIntegration";
import { HevySetupCard } from "./HevySetupCard";
import { HevyWorkoutFeed } from "./HevyWorkoutFeed";
import { HevyWeeklyHeatmap } from "./HevyWeeklyHeatmap";
import { HevyProgressChart } from "./HevyProgressChart";
import { Settings2 } from "lucide-react";
import { useState } from "react";

export function HevyDashboard() {
    const { isConnected, isLoading } = useHevyIntegration();
    const [showSettings, setShowSettings] = useState(false);

    if (isLoading) {
        return (
            <div className="hevy-dashboard">
                <div className="hevy-skeleton hevy-skeleton--wide" />
            </div>
        );
    }

    // Not connected — show setup prominently
    if (!isConnected) {
        return (
            <div className="hevy-dashboard">
                <div className="hevy-dashboard__onboarding">
                    <div className="hevy-dashboard__onboarding-icon">🏋️</div>
                    <h3 className="hevy-dashboard__onboarding-title">Conecte seu Hevy</h3>
                    <p className="hevy-dashboard__onboarding-desc">
                        Importe seus treinos automaticamente do app Hevy.
                        Acompanhe evolução de carga, histórico e streaks.
                    </p>
                    <div className="hevy-dashboard__setup-card-wrap">
                        <HevySetupCard />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="hevy-dashboard">
            {/* Settings toggle */}
            <div className="hevy-dashboard__topbar">
                <button
                    onClick={() => setShowSettings((v) => !v)}
                    className={`hevy-btn hevy-btn--ghost hevy-dashboard__settings-btn ${showSettings ? "hevy-dashboard__settings-btn--active" : ""}`}
                    id="hevy-settings-toggle"
                    aria-label="Configurações Hevy"
                >
                    <Settings2 className="hevy-btn__icon" />
                    Configurações Hevy
                </button>
            </div>

            {/* Setup card (collapsible) */}
            {showSettings && (
                <div className="hevy-dashboard__settings-panel">
                    <HevySetupCard />
                </div>
            )}

            {/* Main grid */}
            <div className="hevy-dashboard__grid">
                {/* Workout Feed — left column */}
                <div className="hevy-dashboard__feed-col">
                    <HevyWorkoutFeed />
                </div>

                {/* Right column: heatmap + chart */}
                <div className="hevy-dashboard__charts-col">
                    <HevyWeeklyHeatmap />
                    <HevyProgressChart />
                </div>
            </div>
        </div>
    );
}
