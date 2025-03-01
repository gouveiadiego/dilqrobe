
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Plus, 
  Clock, 
  Filter, 
  LayoutDashboard, 
  List, 
  CalendarDays, 
  Download
} from "lucide-react";
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
    formatMonth,
    fetchTransactions
  } = useTransactions({ currentDate });

  const handleTransactionCreated = () => {
    setShowNewTransactionForm(false);
    setEditingTransaction(null);
    fetchTransactions();
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

  const handleExportData = () => {
    try {
      // Create CSV content
      const headers = ['Data', 'Descrição', 'Recebido de/Pago para', 'Valor', 'Tipo de Pagamento', 'Status'];
      const csvContent = [
        headers.join(','),
        ...filteredTransactions.map(t => [
          new Date(t.date).toLocaleDateString('pt-BR'),
          `"${t.description.replace(/"/g, '""')}"`,
          `"${t.received_from.replace(/"/g, '""')}"`,
          t.amount,
          t.payment_type,
          t.is_paid ? 'Pago' : 'Pendente'
        ].join(','))
      ].join('\n');
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Set download attributes and trigger download
      link.setAttribute('href', url);
      link.setAttribute('download', `transacoes-${formatMonth(currentDate).toLowerCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handlePreviousMonth} className="hover:bg-gray-100">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-white px-4 py-2 rounded-md bg-slate-950 hover:bg-slate-800 transition-colors">
            {formatMonth(currentDate)}
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="hover:bg-gray-100">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Lista</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Calendário</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button 
          variant="outline" 
          size="sm"
          className="md:ml-2 hidden md:flex"
          onClick={handleExportData}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
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
          <DropdownMenuContent align="end">
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
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Pesquisar transações..." 
              className="pl-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-500 w-full" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button 
              variant="outline" 
              size="sm"
              className="flex md:hidden"
              onClick={handleExportData}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button 
              className="bg-black hover:bg-black/90 text-white w-full md:w-auto" 
              onClick={() => {
                setEditingTransaction(null);
                setShowNewTransactionForm(!showNewTransactionForm);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </div>
        </div>

        {showNewTransactionForm && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
            <NewTransactionForm 
              selectedFilter={selectedFilter} 
              onTransactionCreated={handleTransactionCreated} 
              editingTransaction={editingTransaction} 
            />
          </div>
        )}

        {viewMode === "dashboard" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <FinancialSummaryView 
              income={summaries.income}
              expenses={summaries.expenses}
              balance={summaries.balance}
              pending={summaries.pending}
              chartData={chartData}
            />
          </div>
        )}

        {viewMode === "calendar" && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <TransactionCalendarView 
              transactions={filteredTransactions} 
              onDateSelect={() => {}} 
            />
          </div>
        )}

        {(viewMode === "list" || viewMode === "dashboard") && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
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
