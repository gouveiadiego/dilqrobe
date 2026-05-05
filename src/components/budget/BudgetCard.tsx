import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format, isPast, isAfter, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Download, 
  Copy, 
  Trash2, 
  Eye, 
  MoreHorizontal,
  Calendar,
  User,
  FileText,
  Clock,
  Pencil,
  Package,
  Wrench,
  MessageCircle,
  Link as LinkIcon,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { openWhatsApp, copyPublicLink } from "@/lib/budgetSharing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Budget } from "./types";

interface BudgetCardProps {
  budget: Budget;
  onView: (budget: Budget) => void;
  onEdit: (budget: Budget) => void;
  onDuplicate: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
  onDownloadPDF: (budget: Budget) => void;
}

export function BudgetCard({ 
  budget, 
  onView, 
  onEdit,
  onDuplicate, 
  onDelete, 
  onDownloadPDF 
}: BudgetCardProps) {
  const getStatus = () => {
    if (budget.status === 'approved') return { label: 'Aprovado', variant: 'default' as const, className: 'bg-green-600 hover:bg-green-600' };
    if (budget.status === 'rejected') return { label: 'Rejeitado', variant: 'destructive' as const, className: '' };
    if (!budget.valid_until) return { label: 'Ativo', variant: 'default' as const, className: '' };
    
    const validDate = new Date(budget.valid_until);
    const now = new Date();
    
    if (isPast(validDate)) {
      return { label: 'Expirado', variant: 'destructive' as const, className: '' };
    }
    
    if (isAfter(addDays(now, 7), validDate)) {
      return { label: 'Expira em breve', variant: 'secondary' as const, className: '' };
    }
    
    return { label: 'Válido', variant: 'default' as const, className: '' };
  };

  const handleCopyLink = async () => {
    try {
      await copyPublicLink(budget);
      toast.success("Link público copiado!");
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  };

  const status = getStatus();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-4">
          {/* Left side - Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-semibold text-lg truncate">{budget.client_name}</h3>
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant="outline" className="gap-1">
                {budget.budget_type === 'services' ? (
                  <><Wrench className="h-3 w-3" /> Serviços</>
                ) : (
                  <><Package className="h-3 w-3" /> Produtos</>
                )}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              {budget.client_email && (
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  <span className="truncate">{budget.client_email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>Criado em {format(new Date(budget.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
              {budget.valid_until && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Válido até {format(new Date(budget.valid_until), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                <span>{budget.items.length} {budget.items.length === 1 ? 'item' : 'itens'}</span>
              </div>
            </div>
          </div>

          {/* Right side - Value and actions */}
          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              {budget.total_amount > 0 ? (
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(budget.total_amount)}
                </p>
              ) : (
                <p className="text-sm font-medium text-muted-foreground italic">A combinar</p>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(budget)}
                className="gap-1.5"
              >
                <Eye className="h-4 w-4" />
                Ver
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onDownloadPDF(budget)}
                className="gap-1.5"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(budget)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDuplicate(budget)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(budget)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
