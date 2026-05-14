import { useState } from "react";
import { useHevyIntegration } from "@/hooks/useHevyIntegration";
import { Key, Wifi, WifiOff, RefreshCw, Trash2, ExternalLink, CheckCircle2, Clock, Copy, Webhook } from "lucide-react";
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
        syncAllWorkouts,
        isSyncingAll,
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
                        disabled={isSyncing || isSyncingAll}
                        className="hevy-btn hevy-btn--primary hevy-btn--full"
                    >
                        <RefreshCw className={`hevy-btn__icon ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing ? "Sincronizando..." : "Sincronizar Recentes"}
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm("Isso pode levar alguns segundos dependendo do tamanho do seu histórico. Deseja continuar?")) {
                                syncAllWorkouts();
                            }
                        }}
                        disabled={isSyncing || isSyncingAll}
                        className="hevy-btn hevy-btn--ghost hevy-btn--full"
                        style={{ marginTop: '-4px', borderColor: 'var(--hevy-line)' }}
                    >
                        <RefreshCw className={`hevy-btn__icon ${isSyncingAll ? "animate-spin" : ""}`} />
                        {isSyncingAll ? "Buscando histórico..." : "Sincronizar Todo o Histórico"}
                    </button>
                    <div className="hevy-setup-card__secondary-actions mt-2">
                        <button onClick={handleTest} disabled={isTestingConnection} className="hevy-btn hevy-btn--ghost">
                            <Wifi className="hevy-btn__icon" />
                            {isTestingConnection ? "Testando..." : "Testar API"}
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

                    {/* Webhook Configuration Section */}
                    {integration?.webhook_secret && (
                        <div className="mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200 text-left">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
                                <Webhook className="w-4 h-4 text-orange-500" />
                                Webhook (Sincronização Automática)
                            </h4>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                Cole as informações abaixo na seção "Webhooks" no site do Hevy para receber seus treinos instantaneamente no DilQ Orbe.
                            </p>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        URL onde pretendes receber notificações:
                                    </label>
                                    <div className="flex bg-white border border-gray-200 rounded text-xs p-2 justify-between items-center group">
                                        <span className="truncate text-gray-600 font-mono">
                                            https://wgnvrxubwifcscrbkimm.supabase.co/functions/v1/hevy-webhook
                                        </span>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText("https://wgnvrxubwifcscrbkimm.supabase.co/functions/v1/hevy-webhook");
                                                toast.success("URL copiada!");
                                            }}
                                            className="text-gray-400 hover:text-orange-500 p-1"
                                            title="Copiar URL"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        Cabeçalho de autorização (exatamente assim):
                                    </label>
                                    <div className="flex bg-white border border-gray-200 rounded text-xs p-2 justify-between items-center group">
                                        <span className="truncate text-gray-600 font-mono">
                                            Bearer {integration.webhook_secret}
                                        </span>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(`Bearer ${integration.webhook_secret}`);
                                                toast.success("Token copiado!");
                                            }}
                                            className="text-gray-400 hover:text-orange-500 p-1"
                                            title="Copiar Token"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <p className="hevy-setup-card__security-note">
                🔒 Sua API Key é armazenada com segurança no servidor. Nunca é exposta no browser.
            </p>
        </div>
    );
}
