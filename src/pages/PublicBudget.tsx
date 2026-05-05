import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Budget } from "@/components/budget/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, XCircle, Loader2, FileText, Building2, Calendar, Clock, Download } from "lucide-react";
import { toast } from "sonner";
import { generateBudgetPDF } from "@/components/budget/generateBudgetPDF";

export default function PublicBudget() {
  const { token } = useParams<{ token: string }>();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("public_token", token)
        .maybeSingle();
      if (error || !data) {
        setBudget(null);
      } else {
        setBudget(data as unknown as Budget);
      }
      setLoading(false);
    })();
  }, [token]);

  const handleAction = async (action: "approve" | "reject") => {
    if (!token) return;
    if (action === "approve" && !name.trim()) {
      toast.error("Por favor, informe seu nome para aprovar.");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("approve-budget", {
        body: { token, action, name: name.trim(), reason: reason.trim() },
      });
      if (error || (data as any)?.error) {
        toast.error((data as any)?.error || error?.message || "Erro ao processar");
        return;
      }
      toast.success(action === "approve" ? "Orçamento aprovado!" : "Orçamento rejeitado");
      // refresh
      const { data: refreshed } = await supabase
        .from("budgets")
        .select("*")
        .eq("public_token", token)
        .maybeSingle();
      if (refreshed) setBudget(refreshed as unknown as Budget);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-2">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-semibold">Orçamento não encontrado</h1>
            <p className="text-sm text-muted-foreground">
              O link pode estar incorreto ou ter sido removido.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expired = budget.valid_until && isPast(new Date(budget.valid_until));
  const isApproved = budget.status === "approved";
  const isRejected = budget.status === "rejected";
  const canRespond = !isApproved && !isRejected && !expired;

  const statusBadge = isApproved ? (
    <Badge className="bg-green-600 hover:bg-green-600">Aprovado</Badge>
  ) : isRejected ? (
    <Badge variant="destructive">Rejeitado</Badge>
  ) : expired ? (
    <Badge variant="destructive">Expirado</Badge>
  ) : (
    <Badge>Aguardando resposta</Badge>
  );

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                {budget.company_logo && (
                  <img
                    src={budget.company_logo}
                    alt={budget.company_name}
                    className="h-14 w-14 rounded object-contain bg-white border"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold">
                    {budget.company_name || "Orçamento"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Orçamento #{budget.id.substring(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateBudgetPDF(budget)}
                  className="gap-1.5"
                >
                  <Download className="h-4 w-4" /> PDF
                </Button>
              </div>
            </div>

            <Separator />

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" /> Para
                </p>
                <p>{budget.client_name}</p>
                {budget.client_document && (
                  <p className="text-muted-foreground">{budget.client_document}</p>
                )}
                {budget.client_email && (
                  <p className="text-muted-foreground">{budget.client_email}</p>
                )}
              </div>
              <div>
                {budget.valid_until && (
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> Válido até{" "}
                    {format(new Date(budget.valid_until), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                )}
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" /> Criado em{" "}
                  {format(new Date(budget.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="font-semibold mb-3 flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Itens
              </h2>
              <div className="space-y-3">
                {budget.items.map((item, idx) => (
                  <div key={item.id || idx} className="border rounded-lg p-3">
                    {budget.budget_type === "services" ? (
                      <>
                        {item.title && (
                          <p className="font-medium">{item.title}</p>
                        )}
                        <p className="text-sm whitespace-pre-line text-muted-foreground">
                          {item.description}
                        </p>
                        {item.has_value && item.total > 0 && (
                          <p className="text-right font-semibold mt-2">
                            {formatCurrency(item.total)}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="flex justify-between gap-3">
                        <div className="flex-1">
                          <p>{item.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} × {formatCurrency(item.unit_price || 0)}
                          </p>
                        </div>
                        <p className="font-semibold">{formatCurrency(item.total)}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {budget.total_amount > 0 && (
              <div className="flex justify-between items-center bg-primary/5 rounded-lg p-4">
                <span className="font-semibold">TOTAL</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(budget.total_amount)}
                </span>
              </div>
            )}

            {(budget.payment_terms || budget.delivery_time || budget.notes) && (
              <div className="space-y-2 text-sm">
                {budget.payment_terms && (
                  <p><strong>Condições de pagamento:</strong> {budget.payment_terms}</p>
                )}
                {budget.delivery_time && (
                  <p><strong>Prazo de entrega:</strong> {budget.delivery_time}</p>
                )}
                {budget.notes && (
                  <p className="whitespace-pre-line"><strong>Observações:</strong> {budget.notes}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {isApproved && (
          <Card className="border-green-600/30 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-6 space-y-1">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold">
                <CheckCircle2 className="h-5 w-5" /> Orçamento aprovado
              </div>
              <p className="text-sm text-muted-foreground">
                Aprovado por <strong>{budget.approved_name || "—"}</strong> em{" "}
                {budget.approved_at &&
                  format(new Date(budget.approved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
              {budget.approved_ip && (
                <p className="text-xs text-muted-foreground">IP registrado: {budget.approved_ip}</p>
              )}
            </CardContent>
          </Card>
        )}

        {isRejected && (
          <Card className="border-destructive/30">
            <CardContent className="p-6 space-y-1">
              <div className="flex items-center gap-2 text-destructive font-semibold">
                <XCircle className="h-5 w-5" /> Orçamento rejeitado
              </div>
              {budget.rejection_reason && (
                <p className="text-sm">{budget.rejection_reason}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Por <strong>{budget.approved_name || "—"}</strong> em{" "}
                {budget.rejected_at &&
                  format(new Date(budget.rejected_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </CardContent>
          </Card>
        )}

        {canRespond && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="font-semibold text-lg">Resposta do cliente</h2>
              <div className="space-y-2">
                <label className="text-sm font-medium">Seu nome completo *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome de quem está aprovando"
                  disabled={submitting}
                />
              </div>
              {showReject && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Motivo da rejeição (opcional)</label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    disabled={submitting}
                  />
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => handleAction("approve")}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 gap-1.5"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Aprovar orçamento
                </Button>
                {!showReject ? (
                  <Button variant="outline" onClick={() => setShowReject(true)} disabled={submitting}>
                    Rejeitar
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={() => handleAction("reject")}
                    disabled={submitting}
                    className="gap-1.5"
                  >
                    <XCircle className="h-4 w-4" /> Confirmar rejeição
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Ao aprovar, sua data, IP e navegador serão registrados como confirmação digital.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
