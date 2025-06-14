
import { useEffect } from "react";
import { toast } from "sonner";

// Configuração do seu App OneSignal
const APP_ID = "8f8ac965-5df1-4256-93cf-b408ffb39bbf";
const SAFARI_WEB_ID = "web.onesignal.auto.165f55d2-2c2b-457d-b7b8-8b89270f4464";

// Inicialização do OneSignal para Web
export function useOneSignalPush() {
  useEffect(() => {
    // Previne execução no SSR/build
    if (typeof window === "undefined" || !(window as any)) return;

    // Já carregado?
    if ((window as any).OneSignal) {
      setupOneSignal();
    } else {
      // Carrega SDK OneSignal se não estiver presente
      const script = document.createElement("script");
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        setupOneSignal();
      };
    }

    function setupOneSignal() {
      (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
      (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
        await OneSignal.init({
          appId: APP_ID,
          safari_web_id: SAFARI_WEB_ID,
          notifyButton: {
            enable: true,
            size: 'medium',
            theme: 'default',
            prenotify: true,
            text: {
              'tip.state.unsubscribed': 'Ativar notificações',
              'tip.state.subscribed': 'Você já vai receber avisos!',
              'tip.state.blocked': 'Você bloqueou notificações',
              'message.prenotify': 'Clique para ativar as notificações',
              'message.action.subscribed': "Você vai receber notificações 👌",
              'message.action.resubscribed': "Você está de volta! 👋",
              'message.action.unsubscribed': "Você não receberá mais notificações",
              'dialog.main.title': 'Ativar notificações?',
              'dialog.main.button.subscribe': 'Ativar',
              'dialog.main.button.unsubscribe': 'Desativar'
            }
          }
        });

        // Solicita permissão do usuário automaticamente ao abrir a página Dashboard
        const permission = await OneSignal.getNotificationPermission();
        if (permission === "granted") {
          toast.success("Notificações push ativadas! Você receberá alertas no navegador.");
        } else if (permission === "denied") {
          toast.error("As notificações foram bloqueadas pelo navegador.");
        } else {
          // Solicita explicitamente (somente se ainda não pediu)
          await OneSignal.showSlidedownPrompt();
        }
      });
    }
    // Não remover o script
    // eslint-disable-next-line
  }, []);
}
