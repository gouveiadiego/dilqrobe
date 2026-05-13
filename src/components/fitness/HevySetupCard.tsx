import { useState } from "react";
import { useHevyIntegration } from "@/hooks/useHevyIntegration";
import { Key, Wifi, WifiOff, RefreshCw, Trash2, ExternalLink, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function HevySetupCard() {
    const {
        integration,
        isLoading,
        isConnected,
        saveKey,
        isSavingKey,
        testConnection,
        isTestingConnection,
        syncWorkouts,
        isSyncing,
        deleteIntegration,
    } = useHevyIntegration();

    const [apiKeyInput, setApiKeyInput] = useState("");
    const [showKey, setShowKey] = useState(false);
    const [mode, setMode] = useState<"view" | "edit">(isConnected ? "view" : "edit");

    const handleSave = async () => {
        if (!apiKeyInput.trim()) return;
        await saveKey(apiKeyInput.trim());
        setApiKeyInput("");
        setMode("view");
    };

    const handleTest = async () => {
        await testConnection();
    };

    if (isLoading) {
        return (
            <div className="hevy-setup-card hevy-setup-card--loading">
                <div className="hevy-setup-card__shimmer" />
            </div>
        );
    }

    return (
        <div className="hevy-setup-card">
            {/* Header */}
            <div className="hevy-setup-card__header">
                <div className="hevy-setup-card__brand">
                    <div className={`hevy-setup-card__status-dot ${isConnected ? "hevy-setup-card__status-dot--active" : "hevy-setup-card__status-dot--inactive"}`} />
                    <span className="hevy-setup-card__brand-name">HEVY</span>
                </div>
                <div className="hevy-setup-card__status-label">
                    {isConnected ? (
                        <span className="hevy-badge hevy-badge--active">
                            <CheckCircle2 className="hevy-badge__icon" />
                            Conectado
                        </span>
                    ) : (
                        <span className="hevy-badge hevy-badge--inactive">
                            <WifiOff className="hevy-badge__icon" />
                            Desconectado
                        </span>
                    )}
                </div>
            </div>

            {/* Stats (when connected) */}
            {isConnected && integration && mode === "view" && (
                <div className="hevy-setup-card__stats">
                    <div className="hevy-setup-card__stat">
                        <span className="hevy-setup-card__stat-value">{integration.workout_count}</span>
                        <span className="hevy-setup-card__stat-label">treinos</span>
                    </div>
                    <div className="hevy-setup-card__stat-divider" />
                    <div className="hevy-setup-card__stat">
                        <Clock className="hevy-setup-card__stat-icon" />
                        <span className="hevy-setup-card__stat-label">
                            {integration.last_sync_at
                                ? `Sync: ${format(new Date(integration.last_sync_at), "dd/MM HH:mm", { locale: ptBR })}`
                                : "Nunca sincronizado"}
                        </span>
                    </div>
                </div>
            )}

            {/* API Key Input (edit mode) */}
            {(!isConnected || mode === "edit") && (
                <div className="hevy-setup-card__form">
                    <label className="hevy-setup-card__label">
                        <Key className="hevy-setup-card__label-icon" />
                        API Key do Hevy
                    </label>
                    <p className="hevy-setup-card__hint">
                        Obtenha sua chave em{" "}
                        <a
                            href="https://hevy.com/settings?developer"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hevy-setup-card__link"
                        >
                            hevy.com/settings <ExternalLink className="hevy-setup-card__link-icon" />
                        </a>
                        {" "}(requer Hevy Pro)
                    </p>
                    <div className="hevy-setup-card__input-row">
                        <input
                            type={showKey ? "text" : "password"}
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            placeholder="Cole sua API Key aqui..."
                            className="hevy-setup-card__input"
                            onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey((v) => !v)}
                            className="hevy-setup-card__toggle-visibility"
                            aria-label={showKey ? "Ocultar key" : "Mostrar key"}
                        >
                            {showKey ? "●●●" : "···"}
                        </button>
                    </div>
                    <div className="hevy-setup-card__actions">
                        <button
                            onClick={handleSave}
                            disabled={!apiKeyInput.trim() || isSavingKey}
                            className="hevy-btn hevy-btn--primary"
                        >
                            {isSavingKey ? <RefreshCw className="hevy-btn__spinner" /> : <Key className="hevy-btn__icon" />}
                            {isSavingKey ? "Salvando..." : "Salvar & Conectar"}
                        </button>
                        {isConnected && (
                            <button onClick={() => setMode("view")} className="hevy-btn hevy-btn--ghost">
                                Cancelar
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Actions (connected mode) */}
            {isConnected && mode === "view" && (
                <div className="hevy-setup-card__connected-actions">
                    <button
                        onClick={() => syncWorkouts()}
                        disabled={isSyncing}
                        className="hevy-btn hevy-btn--primary hevy-btn--full"
                    >
                        <RefreshCw className={`hevy-btn__icon ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing ? "Sincronizando..." : "Sincronizar Treinos"}
                    </button>
                    <div className="hevy-setup-card__secondary-actions">
                        <button onClick={handleTest} disabled={isTestingConnection} className="hevy-btn hevy-btn--ghost">
                            <Wifi className="hevy-btn__icon" />
                            {isTestingConnection ? "Testando..." : "Testar"}
                        </button>
                        <button onClick={() => setMode("edit")} className="hevy-btn hevy-btn--ghost">
                            <Key className="hevy-btn__icon" />
                            Trocar Key
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm("Remover integração com Hevy? Os treinos em cache serão mantidos.")) {
                                    deleteIntegration();
                                }
                            }}
                            className="hevy-btn hevy-btn--danger"
                        >
                            <Trash2 className="hevy-btn__icon" />
                        </button>
                    </div>
                </div>
            )}

            <p className="hevy-setup-card__security-note">
                🔒 Sua API Key é armazenada com segurança no servidor. Nunca é exposta no browser.
            </p>
        </div>
    );
}
