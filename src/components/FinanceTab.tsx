import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Maximize, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NewTransactionForm } from "./NewTransactionForm";
import { TransactionCalendar } from "./TransactionCalendar";
import { FinancialSummary } from "./FinancialSummary";
import { formatCurrency } from "@/lib/utils";

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
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  useEffect(() => {
    fetchTransactions();
  }, [currentDate]); // Refetch when month changes

  const fetchTransactions = async () => {
    try {
      console.log("Fetching transactions for:", formatMonth(currentDate));
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .gte("date", startOfMonth.toISOString())
        .lte("date", endOfMonth.toISOString())
        .order("date", { ascending: false });

      if (error) throw error;
      console.log("Fetched transactions:", data);
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterTransactions();
  }, [transactions, selectedFilter, searchQuery]);

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Apply category filter
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

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.received_from.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleTransactionCreated = () => {
    console.log("Transaction created, refreshing list...");
    fetchTransactions();
    setShowNewTransactionForm(false);
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
    // Implement fullscreen toggle in a future update
  };

  const formatMonth = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'short',
      year: 'numeric'
    }).format(date).replace('.', '').toUpperCase();
  };

  const handleCalendarDateSelect = (date: Date) => {
    setCurrentDate(date);
    // You could also add specific filtering for the selected date if needed
  };

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="bg-violet-600 text-white px-4 py-2 rounded-md">
            {formatMonth(currentDate)}
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="ml-2"
            onClick={handleFullscreen}
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <Button
          variant={selectedFilter === "recebimentos" ? "default" : "outline"}
          className={`${selectedFilter === "recebimentos" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}`}
          onClick={() => setSelectedFilter("recebimentos")}
        >
          Recebimentos
        </Button>
        <Button
          variant={selectedFilter === "despesas-fixas" ? "default" : "outline"}
          className={`${selectedFilter === "despesas-fixas" ? "bg-rose-500 hover:bg-rose-600 text-white" : "text-rose-600 border-rose-200 hover:bg-rose-50"}`}
          onClick={() => setSelectedFilter("despesas-fixas")}
        >
          Despesas fixas
        </Button>
        <Button
          variant={selectedFilter === "despesas-variaveis" ? "default" : "outline"}
          className={`${selectedFilter === "despesas-variaveis" ? "bg-rose-500 hover:bg-rose-600 text-white" : "text-rose-600 border-rose-200 hover:bg-rose-50"}`}
          onClick={() => setSelectedFilter("despesas-variaveis")}
        >
          Despesas variáveis
        </Button>
        <Button
          variant={selectedFilter === "pessoas" ? "default" : "outline"}
          className={`${selectedFilter === "pessoas" ? "bg-rose-500 hover:bg-rose-600 text-white" : "text-rose-600 border-rose-200 hover:bg-rose-50"}`}
          onClick={() => setSelectedFilter("pessoas")}
        >
          Pessoas
        </Button>
        <Button
          variant={selectedFilter === "impostos" ? "default" : "outline"}
          className={`${selectedFilter === "impostos" ? "bg-rose-500 hover:bg-rose-600 text-white" : "text-rose-600 border-rose-200 hover:bg-rose-50"}`}
          onClick={() => setSelectedFilter("impostos")}
        >
          Impostos
        </Button>
        <Button
          variant={selectedFilter === "transferencias" ? "default" : "outline"}
          className={`${selectedFilter === "transferencias" ? "bg-blue-500 hover:bg-blue-600 text-white" : "text-blue-600 border-blue-200 hover:bg-blue-50"}`}
          onClick={() => setSelectedFilter("transferencias")}
        >
          Transferências
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Pesquisar transações..."
            className="pl-9 bg-[#2A2F3C] border-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button 
          className="bg-black hover:bg-black/90 text-white"
          onClick={() => setShowNewTransactionForm(!showNewTransactionForm)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      {showNewTransactionForm && (
        <div className="bg-[#221F26] rounded-lg p-6 mb-6">
          <NewTransactionForm 
            selectedFilter={selectedFilter}
            onTransactionCreated={handleTransactionCreated}
          />
        </div>
      )}

      {/* Financial Summary Section */}
      <FinancialSummary transactions={filteredTransactions} />

      {/* Transactions List Section */}
      <div className="bg-[#221F26] rounded-lg p-6 mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Recebido de</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Forma de Pagamento</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{new Date(transaction.date).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{transaction.received_from}</TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                <TableCell>{transaction.payment_type}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    transaction.is_paid 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-yellow-500/20 text-yellow-500'
                  }`}>
                    {transaction.is_paid ? 'Pago' : 'Pendente'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {filteredTransactions.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                  Nenhuma transação encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Calendar Section */}
      <div className="bg-[#221F26] rounded-lg">
        <TransactionCalendar 
          transactions={filteredTransactions}
          onDateSelect={handleCalendarDateSelect}
        />
      </div>
    </div>
  );
};