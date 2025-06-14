
import { supabase } from "./client";

// Envia uma notificação importante: user_id = do usuário destino, notificationText = mensagem relevante
export async function sendImportantNotification(user_id: string, notificationText: string) {
  const { data, error } = await supabase.functions.invoke("send-important-notification", {
    body: {
      user_id,
      notification_text: notificationText,
    },
  });
  if (error) {
    console.error("Erro ao enviar notificação:", error);
    return { sent: false, error };
  }
  return data;
}
