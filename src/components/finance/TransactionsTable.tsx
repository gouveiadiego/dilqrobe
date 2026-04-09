
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, ArrowLeftRight } from "lucide-react";
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
import { SeriesDialog } from "./SeriesDialog";
import { Layers } from "lucide-react";

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
  const [seriesDialogOpen, setSeriesDialogOpen] = useState(false);
  const [seriesTransaction, setSeriesTransaction] = useState<Transaction | null>(null);

  const [dateFilter, setDateFilter] = useState('');
  const [descFilter, setDescFilter] = useState('');
  const [receiverFilter, setReceiverFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');

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

  const localFilteredTransactions = transactions.filter(t => {
    let match = true;
    if (dateFilter) {
      const [year, month, day] = t.date.split('-').map(Number);
      const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      if (!formattedDate.includes(dateFilter)) match = false;
    }
    if (descFilter && !t.description.toLowerCase().includes(descFilter.toLowerCase())) {
      match = false;
    }
    if (receiverFilter && (!t.received_from || !t.received_from.toLowerCase().includes(receiverFilter.toLowerCase()))) {
      match = false;
    }
    if (statusFilter === 'paid' && !t.is_paid) match = false;
    if (statusFilter === 'pending' && t.is_paid) match = false;
    return match;
  });

  const totalAmount = localFilteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <>
      <Table wrapperClassName="max-h-[500px] md:max-h-[600px] border border-slate-200 rounded-md">
        <TableHeader>
          <TableRow className="bg-slate-50 w-full align-top border-b-0">
            <TableHead className="sticky top-0 left-0 z-30 bg-slate-100 border-r border-b border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-[110px] py-3">
              <div className="flex flex-col gap-2">
                <span>Data</span>
                <Input 
                  placeholder="Ex: 10/04" 
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
                  className="h-7 w-full text-xs font-normal"
                />
              </div>
            </TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 min-w-[280px] py-3">
              <div className="flex flex-col gap-2">
                <span>Descrição e Contato</span>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Filtrar desc..." 
                    value={descFilter}
                    onChange={e => setDescFilter(e.target.value)}
                    className="h-7 w-full text-xs font-normal"
                  />
                  <Input 
                    placeholder="Filtrar contato..." 
                    value={receiverFilter}
                    onChange={e => setReceiverFilter(e.target.value)}
                    className="h-7 w-full text-xs font-normal"
                  />
                </div>
              </div>
            </TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 py-3 w-[150px] font-semibold">
              <div className="flex flex-col gap-2 h-full justify-start">
                <span className="pt-1">Categoria</span>
              </div>
            </TableHead>
            <TableHead className="sticky top-0 z-20 bg-slate-100 border-b border-slate-200 py-3 w-[160px] font-semibold">
              <div className="flex flex-col gap-2 h-full justify-start">
                <span className="pt-1">Valor & Status</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as 'all' | 'paid' | 'pending')}
                  className="h-7 w-full text-xs font-normal rounded-md border border-slate-200 bg-white px-2"
                >
                  <option value="all">Todos</option>
                  <option value="paid">✅ Pagos</option>
                  <option value="pending">⏳ Pendentes</option>
                </select>
              </div>
            </TableHead>
            <TableHead className="sticky top-0 right-0 z-30 bg-slate-100 border-l border-b border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] text-center w-[110px] py-3 font-semibold">
              <div className="flex justify-center items-start h-full pt-1">
                <span>Ações</span>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localFilteredTransactions.map(transaction => (
            <TableRow key={transaction.id} className={`group transition-colors ${transaction.is_paid ? '!bg-emerald-50/70 hover:!bg-emerald-100/70' : 'bg-white hover:bg-amber-50/40'}`}>
              <TableCell className={`sticky left-0 z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors whitespace-nowrap align-top ${transaction.is_paid ? '!bg-emerald-50/70 group-hover:!bg-emerald-100/70' : '!bg-white group-hover:!bg-amber-50/40'}`}>
                <div className="pt-1 text-slate-700 font-medium">
                  {(() => {
                    const [year, month, day] = transaction.date.split('-').map(Number);
                    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
                  })()}
                </div>
              </TableCell>
              <TableCell className="align-top py-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">
                      {transaction.description}
                    </span>
                    {transaction.recurring && (
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-sm uppercase font-semibold">
                        Recorrente
                      </span>
                    )}
                    {(transaction as any).is_transfer && (
                      <Badge variant="outline" className="text-[10px] bg-gradient-to-r from-dilq-purple/10 to-dilq-accent/10 py-0 h-4 border-dilq-purple/20">
                        <ArrowLeftRight className="h-2.5 w-2.5 mr-1" /> Transf.
                      </Badge>
                    )}
                  </div>
                  {transaction.received_from && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                      {transaction.received_from}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="align-top py-3">
                <CategoryBadge category={transaction.category} amount={transaction.amount} />
              </TableCell>
              <TableCell className="align-top py-3">
                <div className="flex flex-col gap-1.5 items-start">
                  <span className={transaction.amount > 0 ? 'text-emerald-600 font-bold text-[15px]' : 'text-rose-600 font-bold text-[15px]'}>
                    {formatCurrency(transaction.amount)}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] py-0 h-[18px] text-slate-500 uppercase bg-slate-50">
                      {getPaymentTypeLabel(transaction.payment_type)}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] py-0 h-[18px] cursor-pointer hover:opacity-80 transition-opacity ${transaction.is_paid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                      onClick={() => onToggleStatus(transaction.id, transaction.is_paid)}
                    >
                      {transaction.is_paid ? 'Pago' : 'Pendente'}
                    </Badge>
                  </div>
                </div>
              </TableCell>
              <TableCell className={`sticky right-0 z-10 border-l border-slate-100 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors align-top py-3 ${transaction.is_paid ? '!bg-emerald-50/70 group-hover:!bg-emerald-100/70' : '!bg-white group-hover:!bg-amber-50/40'}`}>
                <div className="flex items-center justify-center gap-1">
                  {(transaction.series_id || transaction.installments_total || transaction.recurring) ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSeriesTransaction(transaction);
                        setSeriesDialogOpen(true);
                      }}
                      className="h-8 w-8 text-[#40657E] hover:bg-[#40657E]/10"
                      title="Ver série"
                    >
                      <Layers className="h-4 w-4" />
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(transaction);
                    }}
                    className="h-8 w-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDelete(transaction);
                    }}
                    className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {localFilteredTransactions.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-slate-500 py-12">
                Nenhuma transação encontrada com os filtros atuais.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter className="sticky bottom-0 z-20 shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
          <TableRow className="bg-slate-100 hover:bg-slate-100">
            <TableCell className="sticky left-0 z-30 bg-slate-100 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"></TableCell>
            <TableCell colSpan={2} className="text-right font-bold text-slate-700 text-sm md:text-base border-t border-slate-200 py-4">
              Total no período:
            </TableCell>
            <TableCell className={`font-bold text-sm md:text-base border-t border-slate-200 whitespace-nowrap py-4 ${totalAmount > 0 ? 'text-emerald-600' : totalAmount < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
              {formatCurrency(totalAmount)}
            </TableCell>
            <TableCell className="sticky right-0 z-30 bg-slate-100 border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] border-t"></TableCell>
          </TableRow>
        </TableFooter>
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

      <SeriesDialog
        transaction={seriesTransaction}
        open={seriesDialogOpen}
        onOpenChange={setSeriesDialogOpen}
        onEdit={onEdit}
      />
    </>
  );
};

const getPaymentTypeLabel = (paymentType: string): string => {
  switch (paymentType) {
    case "pix": return "PIX";
    case "credit": return "Cartão de Crédito";
    case "debit": return "Cartão de Débito";
    case "cash": return "Dinheiro";
    case "boleto": return "Boleto";
    case "cheque": return "Cheque";
    case "transfer": return "Transferência";
    default: return paymentType;
  }
};

const CategoryBadge = ({ category, amount }: { category: string; amount?: number }) => {
  const colors: Record<string, { bg: string, text: string, icon: string }> = {
    'fixed': { bg: 'bg-blue-100', text: 'text-blue-800', icon: '💳' },
    'variable': { bg: 'bg-purple-100', text: 'text-purple-800', icon: '🔄' },
    'people': { bg: 'bg-green-100', text: 'text-green-800', icon: '👥' },
    'taxes': { bg: 'bg-red-100', text: 'text-red-800', icon: '🧾' },
    'transfer': { bg: 'bg-amber-100', text: 'text-amber-800', icon: '↔️' },
    'income': { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '💰' },
  };

  const incomeDefault = { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '💰' };
  const expenseDefault = { bg: 'bg-gray-100', text: 'text-gray-800', icon: '📂' };

  const style = colors[category] || (amount && amount > 0 ? incomeDefault : expenseDefault);

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
