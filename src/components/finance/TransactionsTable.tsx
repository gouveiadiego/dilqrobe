
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Transaction } from "@/hooks/useTransactions";
import { TextEllipsis } from "../ui/text-ellipsis";

interface TransactionsTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => Promise<void>;
  onToggleStatus: (id: string, current: boolean) => Promise<void>;
  onEdit: (transaction: Transaction) => void;
  loading: boolean;
  onDeleteRecurring?: (id: string, deleteAll: boolean) => Promise<void>;
}

export const TransactionsTable = ({
  transactions,
  onDelete,
  onToggleStatus,
  onEdit,
  loading,
  onDeleteRecurring
}: TransactionsTableProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openRecurringDialog, setOpenRecurringDialog] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedRecurringTransaction, setSelectedRecurringTransaction] = useState<Transaction | null>(null);

  const handleDelete = () => {
    if (selectedTransactionId) {
      onDelete(selectedTransactionId);
      setSelectedTransactionId(null);
    }
    setOpenDialog(false);
  };

  const handleDeleteRecurring = (deleteAll: boolean) => {
    if (selectedRecurringTransaction && onDeleteRecurring) {
      onDeleteRecurring(selectedRecurringTransaction.id, deleteAll);
      setSelectedRecurringTransaction(null);
    }
    setOpenRecurringDialog(false);
  };

  const confirmDelete = (transaction: Transaction) => {
    if (transaction.recurring && onDeleteRecurring) {
      setSelectedRecurringTransaction(transaction);
      setOpenRecurringDialog(true);
    } else {
      setSelectedTransactionId(transaction.id);
      setOpenDialog(true);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Recebido de/Pago para</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Forma de Pagamento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map(transaction => (
            <TableRow key={transaction.id} className="hover:bg-slate-50/50">
              <TableCell>{format(new Date(transaction.date), 'dd/MM/yyyy')}</TableCell>
              <TableCell>
                <TextEllipsis 
                  text={transaction.description}
                  maxLength={40}
                  className="block max-w-[200px]"
                />
                {transaction.recurring && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Recorrente
                  </span>
                )}
              </TableCell>
              <TableCell>
                <TextEllipsis 
                  text={transaction.received_from || ""}
                  maxLength={30}
                  className="block max-w-[150px]"
                />
              </TableCell>
              <TableCell>
                <CategoryBadge category={transaction.category} />
              </TableCell>
              <TableCell className={transaction.amount > 0 ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                {formatCurrency(transaction.amount)}
              </TableCell>
              <TableCell>{getPaymentTypeLabel(transaction.payment_type)}</TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  onClick={() => onToggleStatus(transaction.id, transaction.is_paid)}
                  className={`px-2 py-1 rounded-full text-xs ${
                    transaction.is_paid 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                >
                  {transaction.is_paid ? 'Pago' : 'Pendente'}
                </Button>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onEdit(transaction)} 
                    className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => confirmDelete(transaction)}
                    className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {transactions.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                Nenhuma transação encontrada
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={openRecurringDialog} onOpenChange={setOpenRecurringDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação recorrente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta é uma transação recorrente. Deseja excluir apenas esta ocorrência ou todas as ocorrências futuras?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="sm:mt-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDeleteRecurring(false)} 
              className="bg-amber-600 hover:bg-amber-700"
            >
              Apenas esta ocorrência
            </AlertDialogAction>
            <AlertDialogAction 
              onClick={() => handleDeleteRecurring(true)} 
              className="bg-red-600 hover:bg-red-700"
            >
              Todas as ocorrências
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const getPaymentTypeLabel = (paymentType: string): string => {
  switch (paymentType) {
    case "pix": return "PIX";
    case "credit": return "Cartão de Crédito";
    case "debit": return "Cartão de Débito";
    case "cash": return "Dinheiro";
    case "transfer": return "Transferência";
    default: return paymentType;
  }
};

const CategoryBadge = ({ category }: { category: string }) => {
  const colors: Record<string, { bg: string, text: string, icon: string }> = {
    'fixed': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '💳' },
    'variable': { bg: 'bg-purple-100', text: 'text-purple-800', icon: '🔄' },
    'people': { bg: 'bg-green-100', text: 'text-green-800', icon: '👥' },
    'taxes': { bg: 'bg-red-100', text: 'text-red-800', icon: '🧾' },
    'transfer': { bg: 'bg-amber-100', text: 'text-amber-800', icon: '↔️' },
    'income': { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '💰' },
  };

  const style = colors[category] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📂' };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${style.bg} ${style.text}`}>
      <span>{style.icon}</span>
      {getCategoryLabel(category)}
    </span>
  );
};

const getCategoryLabel = (categoryValue: string): string => {
  switch (categoryValue) {
    case "income": return "Recebimento";
    case "fixed": return "Despesa Fixa";
    case "variable": return "Despesa Variável";
    case "people": return "Pessoas";
    case "taxes": return "Impostos";
    case "transfer": return "Transferência";
    default: return categoryValue;
  }
};
