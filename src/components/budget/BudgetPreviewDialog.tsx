import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Download, 
  Building2, 
  User, 
  FileText, 
  Calendar,
  Clock,
  CreditCard,
  MessageSquare,
  X
} from "lucide-react";
import { Budget } from "./types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface BudgetPreviewDialogProps {
  budget: Budget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownloadPDF: (budget: Budget) => void;
}

export function BudgetPreviewDialog({ 
  budget, 
  open, 
  onOpenChange,
  onDownloadPDF 
}: BudgetPreviewDialogProps) {
  if (!budget) return null;

  const isExpired = budget.valid_until && isPast(new Date(budget.valid_until));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              Orçamento #{budget.id.substring(0, 8).toUpperCase()}
            </DialogTitle>
            <Badge variant={isExpired ? "destructive" : "default"}>
              {isExpired ? "Expirado" : "Válido"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Company Info */}
          {(budget.company_name || budget.company_document) && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Dados da Empresa</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {budget.company_name && (
                  <div>
                    <span className="text-muted-foreground">Empresa:</span>
                    <p className="font-medium">{budget.company_name}</p>
                  </div>
                )}
                {budget.company_document && (
                  <div>
                    <span className="text-muted-foreground">CNPJ:</span>
                    <p className="font-medium">{budget.company_document}</p>
                  </div>
                )}
                {budget.company_address && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Endereço:</span>
                    <p className="font-medium">{budget.company_address}</p>
                  </div>
                )}
                {budget.company_phone && (
                  <div>
                    <span className="text-muted-foreground">Telefone:</span>
                    <p className="font-medium">{budget.company_phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Client Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Dados do Cliente</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Cliente:</span>
                <p className="font-medium">{budget.client_name}</p>
              </div>
              {budget.client_document && (
                <div>
                  <span className="text-muted-foreground">Documento:</span>
                  <p className="font-medium">{budget.client_document}</p>
                </div>
              )}
              {budget.client_email && (
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{budget.client_email}</p>
                </div>
              )}
              {budget.client_phone && (
                <div>
                  <span className="text-muted-foreground">Telefone:</span>
                  <p className="font-medium">{budget.client_phone}</p>
                </div>
              )}
              {budget.client_address && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Endereço:</span>
                  <p className="font-medium">{budget.client_address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Itens do Orçamento</h3>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-center w-20">Qtd</TableHead>
                    <TableHead className="text-right w-32">Valor Unit.</TableHead>
                    <TableHead className="text-right w-32">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budget.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-4">
              <div className="bg-primary/10 rounded-lg px-6 py-3 border border-primary/20">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(budget.total_amount)}</p>
              </div>
            </div>
          </div>

          {/* Conditions */}
          {(budget.delivery_time || budget.payment_terms || budget.valid_until) && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Condições Comerciais</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {budget.delivery_time && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-muted-foreground block">Prazo de Entrega</span>
                      <p className="font-medium">{budget.delivery_time}</p>
                    </div>
                  </div>
                )}
                {budget.payment_terms && (
                  <div className="flex items-start gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-muted-foreground block">Pagamento</span>
                      <p className="font-medium">{budget.payment_terms}</p>
                    </div>
                  </div>
                )}
                {budget.valid_until && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-muted-foreground block">Válido Até</span>
                      <p className="font-medium">
                        {format(new Date(budget.valid_until), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {budget.notes && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Observações</h3>
              </div>
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 whitespace-pre-wrap">
                {budget.notes}
              </p>
            </div>
          )}

          {/* Date info */}
          <div className="text-sm text-muted-foreground text-center pt-2 border-t">
            Orçamento criado em {format(new Date(budget.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Fechar
          </Button>
          <Button onClick={() => onDownloadPDF(budget)}>
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
