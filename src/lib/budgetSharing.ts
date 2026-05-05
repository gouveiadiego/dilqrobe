import { Budget } from "@/components/budget/types";
import { formatCurrency } from "@/lib/utils";

export function getPublicBudgetUrl(budget: Pick<Budget, "public_token" | "id">): string {
  const token = budget.public_token || budget.id;
  return `${window.location.origin}/orcamento/${token}`;
}

export function buildWhatsAppMessage(budget: Budget): string {
  const url = getPublicBudgetUrl(budget);
  const total =
    budget.total_amount > 0 ? formatCurrency(budget.total_amount) : "a combinar";
  const company = budget.company_name || "nossa equipe";
  const greeting = budget.client_name ? `Olá, ${budget.client_name}!` : "Olá!";
  const valid = budget.valid_until
    ? `\nVálido até: ${new Date(budget.valid_until).toLocaleDateString("pt-BR")}`
    : "";
  return (
    `${greeting}\n\n` +
    `Segue o orçamento preparado por *${company}*.\n` +
    `Valor: *${total}*${valid}\n\n` +
    `Você pode visualizar e aprovar pelo link abaixo:\n${url}`
  );
}

export function openWhatsApp(budget: Budget) {
  const text = encodeURIComponent(buildWhatsAppMessage(budget));
  const phone = (budget.client_phone || "").replace(/\D/g, "");
  const base = phone ? `https://wa.me/${phone}` : `https://wa.me/`;
  window.open(`${base}?text=${text}`, "_blank", "noopener,noreferrer");
}

export async function copyPublicLink(budget: Budget): Promise<void> {
  await navigator.clipboard.writeText(getPublicBudgetUrl(budget));
}
