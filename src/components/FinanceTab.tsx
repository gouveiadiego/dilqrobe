import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Maximize, Plus, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NewTransactionForm } from "./NewTransactionForm";
import { TransactionCalendar } from "./TransactionCalendar";
import { FinancialSummary } from "./FinancialSummary";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
interface Transaction {
  id: string;
  date: string;
  description: string;
  received_from: string;
  category: string;
  amount: number;
  payment_type: string;
  is_paid: boolean;
}
export const FinanceTab = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewTransactionForm, setShowNewTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  useEffect(() => {
    fetchTransactions();
  }, [currentDate]);
  const fetchTransactions = async () => {
    try {
      console.log("Fetching transactions for:", formatMonth(currentDate));
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const {
        data,
        error
      } = await supabase.from("transactions").select(`
          id,
          date,
          description,
          received_from,
          category,
          amount,
          payment_type,
          is_paid
        `).gte("date", startOfMonth.toISOString()).lte("date", endOfMonth.toISOString()).order("date", {
        ascending: false
      });
      if (error) throw error;
      console.log("Fetched transactions:", data);
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Erro ao carregar transações");
    } finally {
      setLoading(false);
    }
  };
  const handleTransactionCreated = () => {
    console.log("Transaction created/updated, refreshing list...");
    fetchTransactions();
    setShowNewTransactionForm(false);
    setEditingTransaction(null);
  };
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowNewTransactionForm(true);
  };
  const handleDeleteTransaction = async (id: string) => {
    try {
      const {
        error
      } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      toast.success("Transação excluída com sucesso");
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error("Erro ao excluir transação");
    }
  };
  const togglePaymentStatus = async (id: string, currentStatus: boolean) => {
    try {
      const {
        error
      } = await supabase.from('transactions').update({
        is_paid: !currentStatus
      }).eq('id', id);
      if (error) throw error;
      toast.success("Status de pagamento atualizado");
      fetchTransactions();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error("Erro ao atualizar status de pagamento");
    }
  };
  useEffect(() => {
    filterTransactions();
  }, [transactions, selectedFilter, searchQuery]);
  const filterTransactions = () => {
    let filtered = [...transactions];
    if (selectedFilter !== "all") {
      filtered = filtered.filter(transaction => {
        switch (selectedFilter) {
          case "recebimentos":
            return transaction.amount > 0;
          case "despesas-fixas":
            return transaction.amount < 0 && transaction.category === "fixed";
          case "despesas-variaveis":
            return transaction.amount < 0 && transaction.category === "variable";
          case "pessoas":
            return transaction.category === "people";
          case "impostos":
            return transaction.category === "taxes";
          case "transferencias":
            return transaction.category === "transfer";
          default:
            return true;
        }
      });
    }
    if (searchQuery) {
      filtered = filtered.filter(transaction => transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) || transaction.received_from.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    setFilteredTransactions(filtered);
  };
  const formatMonth = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      month: 'short',
      year: 'numeric'
    }).replace('.', '').toUpperCase();
  };
  const handlePreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };
  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };
  const handleFullscreen = () => {
    console.log("Toggle fullscreen view");
  };
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-white px-4 py-2 rounded-md bg-slate-950 hover:bg-slate-800">
            {formatMonth(currentDate)}
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="ml-2" onClick={handleFullscreen}>
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2">
        <Button variant={selectedFilter === "recebimentos" ? "default" : "outline"} className={`${selectedFilter === "recebimentos" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}`} onClick={() => setSelectedFilter("recebimentos")}>
          Recebimentos
        </Button>
        <Button variant={selectedFilter === "despesas-fixas" ? "default" : "outline"} className={`${selectedFilter === "despesas-fixas" ? "bg-rose-500 hover:bg-rose-600 text-white" : "text-rose-600 border-rose-200 hover:bg-rose-50"}`} onClick={() => setSelectedFilter("despesas-fixas")}>
          Despesas fixas
        </Button>
        <Button variant={selectedFilter === "despesas-variaveis" ? "default" : "outline"} className={`${selectedFilter === "despesas-variaveis" ? "bg-rose-500 hover:bg-rose-600 text-white" : "text-rose-600 border-rose-200 hover:bg-rose-50"}`} onClick={() => setSelectedFilter("despesas-variaveis")}>
          Despesas variáveis
        </Button>
        <Button variant={selectedFilter === "pessoas" ? "default" : "outline"} className={`${selectedFilter === "pessoas" ? "bg-rose-500 hover:bg-rose-600 text-white" : "text-rose-600 border-rose-200 hover:bg-rose-50"}`} onClick={() => setSelectedFilter("pessoas")}>
          Pessoas
        </Button>
        <Button variant={selectedFilter === "impostos" ? "default" : "outline"} className={`${selectedFilter === "impostos" ? "bg-rose-500 hover:bg-rose-600 text-white" : "text-rose-600 border-rose-200 hover:bg-rose-50"}`} onClick={() => setSelectedFilter("impostos")}>
          Impostos
        </Button>
        <Button variant={selectedFilter === "transferencias" ? "default" : "outline"} className={`${selectedFilter === "transferencias" ? "bg-blue-500 hover:bg-blue-600 text-white" : "text-blue-600 border-blue-200 hover:bg-blue-50"}`} onClick={() => setSelectedFilter("transferencias")}>
          Transferências
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Pesquisar transações..." className="pl-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-500" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <Button className="bg-black hover:bg-black/90 text-white" onClick={() => {
        setEditingTransaction(null);
        setShowNewTransactionForm(!showNewTransactionForm);
      }}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      {showNewTransactionForm && <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <NewTransactionForm selectedFilter={selectedFilter} onTransactionCreated={handleTransactionCreated} editingTransaction={editingTransaction} />
        </div>}

      <FinancialSummary transactions={filteredTransactions} />

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
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
            {filteredTransactions.map(transaction => <TableRow key={transaction.id}>
                <TableCell>{new Date(transaction.date).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{transaction.received_from}</TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                <TableCell>{transaction.payment_type}</TableCell>
                <TableCell>
                  <Button variant="ghost" onClick={() => togglePaymentStatus(transaction.id, transaction.is_paid)} className={`px-2 py-1 rounded-full text-xs ${transaction.is_paid ? 'bg-green-500/20 text-green-700 hover:bg-green-500/30' : 'bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30'}`}>
                    {transaction.is_paid ? 'Pago' : 'Pendente'}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditTransaction(transaction)} className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                  if (confirm('Deseja realmente excluir esta transação?')) {
                    handleDeleteTransaction(transaction.id);
                  }
                }} className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>)}
            {filteredTransactions.length === 0 && !loading && <TableRow>
                <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                  Nenhuma transação encontrada
                </TableCell>
              </TableRow>}
          </TableBody>
        </Table>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <TransactionCalendar transactions={filteredTransactions} onDateSelect={() => {}} />
      </div>
    </div>;
};