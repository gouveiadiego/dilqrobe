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
import { Search, Plus, ChevronLeft, ChevronRight, Maximize } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleNewTransaction = () => {
    console.log("Opening new transaction form");
    // We'll implement the new transaction form in a future update
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

  const formatMonth = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'short',
      year: 'numeric'
    }).format(date).replace('.', '').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        {/* Date Navigation */}
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
          >
            <Maximize className="h-4 w-4" />
          </Button>
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
      </div>

      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Pesquisar transações..."
            className="pl-9 bg-[#2A2F3C] border-none"
          />
        </div>
        <Button 
          onClick={handleNewTransaction}
          className="bg-black hover:bg-black/90 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      <div className="bg-[#221F26] rounded-lg p-6">
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
            {transactions.map((transaction) => (
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
            {transactions.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                  Nenhuma transação encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};