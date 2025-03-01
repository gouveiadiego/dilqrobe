
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Maximize, Plus, Clock, Filter } from "lucide-react";
import { NewTransactionForm } from "./NewTransactionForm";
import { TransactionCalendarView } from "./finance/TransactionCalendarView";
import { FinancialSummaryView } from "./finance/FinancialSummaryView";
import { TransactionsTable } from "./finance/TransactionsTable";
import { useTransactions } from "@/hooks/useTransactions";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const FinanceTab = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNewTransactionForm, setShowNewTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "dashboard">("dashboard");

  const {
    filteredTransactions,
    loading,
    selectedFilter,
    setSelectedFilter,
    searchQuery,
    setSearchQuery,
    summaries,
    chartData,
    handleDeleteTransaction,
    togglePaymentStatus,
    formatMonth
  } = useTransactions({ currentDate });

  const handleTransactionCreated = () => {
    setShowNewTransactionForm(false);
    setEditingTransaction(null);
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setShowNewTransactionForm(true);
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
    // Esta funcionalidade poderia ser implementada com integração de API de tela cheia
    console.log("Toggle fullscreen view");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
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

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-wrap md:flex-nowrap space-x-0 md:space-x-2 space-y-2 md:space-y-0 overflow-x-auto pb-2">
        <Button 
          variant={selectedFilter === "all" ? "default" : "outline"} 
          className="min-w-[120px]"
          onClick={() => setSelectedFilter("all")}
        >
          Todos
        </Button>
        <Button 
          variant={selectedFilter === "recebimentos" ? "default" : "outline"} 
          className={`min-w-[120px] ${selectedFilter === "recebimentos" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}`} 
          onClick={() => setSelectedFilter("recebimentos")}
        >
          Recebimentos
        </Button>
        <Button 
          variant={selectedFilter === "despesas-fixas" ? "default" : "outline"} 
          className={`min-w-[120px] ${selectedFilter === "despesas-fixas" ? "bg-rose-500 hover:bg-rose-600 text-white" : "text-rose-600 border-rose-200 hover:bg-rose-50"}`} 
          onClick={() => setSelectedFilter("despesas-fixas")}
        >
          Despesas fixas
        </Button>
        <Button 
          variant={selectedFilter === "despesas-variaveis" ? "default" : "outline"} 
          className={`min-w-[120px] ${selectedFilter === "despesas-variaveis" ? "bg-rose-500 hover:bg-rose-600 text-white" : "text-rose-600 border-rose-200 hover:bg-rose-50"}`} 
          onClick={() => setSelectedFilter("despesas-variaveis")}
        >
          Despesas variáveis
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Mais filtros
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSelectedFilter("pessoas")}>
              Pessoas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedFilter("impostos")}>
              Impostos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedFilter("transferencias")}>
              Transferências
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Pesquisar transações..." 
              className="pl-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-500" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
            />
          </div>
          <Button 
            className="bg-black hover:bg-black/90 text-white" 
            onClick={() => {
              setEditingTransaction(null);
              setShowNewTransactionForm(!showNewTransactionForm);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>

        {showNewTransactionForm && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <NewTransactionForm 
              selectedFilter={selectedFilter} 
              onTransactionCreated={handleTransactionCreated} 
              editingTransaction={editingTransaction} 
            />
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <FinancialSummaryView 
            income={summaries.income}
            expenses={summaries.expenses}
            balance={summaries.balance}
            pending={summaries.pending}
            chartData={chartData}
          />
        </div>

        {viewMode === "calendar" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <TransactionCalendarView 
              transactions={filteredTransactions} 
              onDateSelect={() => {}} 
            />
          </div>
        )}

        {(viewMode === "list" || viewMode === "dashboard") && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <TransactionsTable 
              transactions={filteredTransactions}
              onDelete={handleDeleteTransaction}
              onToggleStatus={togglePaymentStatus}
              onEdit={handleEditTransaction}
              loading={loading}
            />
          </div>
        )}
      </div>
    </div>
  );
};
