
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

interface TransactionsTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => Promise<void>;
  onToggleStatus: (id: string, current: boolean) => Promise<void>;
  onEdit: (transaction: Transaction) => void;
  loading: boolean;
}

export const TransactionsTable = ({
  transactions,
  onDelete,
  onToggleStatus,
  onEdit,
  loading
}: TransactionsTableProps) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  const handleDelete = () => {
    if (selectedTransactionId) {
      onDelete(selectedTransactionId);
      setSelectedTransactionId(null);
    }
    setOpenDialog(false);
  };

  const confirmDelete = (id: string) => {
    setSelectedTransactionId(id);
    setOpenDialog(true);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
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
            <TableRow key={transaction.id}>
              <TableCell>{format(new Date(transaction.date), 'dd/MM/yyyy')}</TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell>{transaction.received_from}</TableCell>
              <TableCell>
                <CategoryBadge category={transaction.category} />
              </TableCell>
              <TableCell className={transaction.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {formatCurrency(transaction.amount)}
              </TableCell>
              <TableCell>{transaction.payment_type}</TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  onClick={() => onToggleStatus(transaction.id, transaction.is_paid)}
                  className={`px-2 py-1 rounded-full text-xs ${
                    transaction.is_paid 
                      ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30' 
                      : 'bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30'
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
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => confirmDelete(transaction.id)}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
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
    </>
  );
};

// Helper component for category badges
const CategoryBadge = ({ category }: { category: string }) => {
  const colors: Record<string, { bg: string, text: string }> = {
    'fixed': { bg: 'bg-blue-100', text: 'text-blue-800' },
    'variable': { bg: 'bg-purple-100', text: 'text-purple-800' },
    'people': { bg: 'bg-green-100', text: 'text-green-800' },
    'taxes': { bg: 'bg-red-100', text: 'text-red-800' },
    'transfer': { bg: 'bg-amber-100', text: 'text-amber-800' },
  };

  const style = colors[category] || { bg: 'bg-gray-100', text: 'text-gray-800' };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${style.bg} ${style.text}`}>
      {category === 'fixed' && 'Fixo'}
      {category === 'variable' && 'Variável'}
      {category === 'people' && 'Pessoas'}
      {category === 'taxes' && 'Impostos'}
      {category === 'transfer' && 'Transferência'}
      {!['fixed', 'variable', 'people', 'taxes', 'transfer'].includes(category) && category}
    </span>
  );
};
