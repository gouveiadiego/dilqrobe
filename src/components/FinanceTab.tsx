
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Download,
  LayoutDashboard, 
  List, 
  CalendarDays
} from "lucide-react";
import { NewTransactionForm } from "./NewTransactionForm";
import { TransactionCalendarView } from "./finance/TransactionCalendarView";
import { FinancialSummaryView } from "./finance/FinancialSummaryView";
import { TransactionsTable } from "./finance/TransactionsTable";
import { useTransactions } from "@/hooks/useTransactions";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { handleApiError, handleSuccess } from "@/utils/errorHandler";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

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

  const handleDeleteRecurringTransaction = async (id: string, deleteAll: boolean) => {
    try {
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching transaction:', fetchError);
        handleApiError(fetchError, "Erro ao buscar detalhes da transação");
        return;
      }
      
      if (!transaction) {
        handleApiError("Transação não encontrada");
        return;
      }
      
      if (deleteAll && transaction.recurring) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          handleApiError("Usuário não autenticado");
          return;
        }
        
        const { error: deleteError } = await supabase
          .from('transactions')
          .delete()
          .eq('user_id', user.id)
          .eq('description', transaction.description)
          .eq('received_from', transaction.received_from)
          .eq('payment_type', transaction.payment_type)
          .eq('recurring', true)
          .eq('recurring_day', transaction.recurring_day);
          
        if (deleteError) {
          console.error('Error deleting recurring transactions:', deleteError);
          handleApiError(deleteError, "Erro ao excluir todas as transações recorrentes");
          return;
        }
        
        handleSuccess("Todas as transações recorrentes foram excluídas");
      } else {
        const { error: deleteError } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id);
          
        if (deleteError) {
          console.error('Error deleting transaction:', deleteError);
          handleApiError(deleteError, "Erro ao excluir transação");
          return;
        }
        
        handleSuccess("Transação excluída com sucesso");
      }
      
      fetchTransactions();
    } catch (error) {
      console.error('Error in handleDeleteRecurringTransaction:', error);
      handleApiError(error, "Erro ao processar a exclusão da transação");
    }
  };

  const handleExportData = () => {
    try {
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
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.setAttribute('href', url);
      link.setAttribute('download', `transacoes-${formatMonth(currentDate).toLowerCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      handleSuccess("Dados exportados com sucesso");
    } catch (error) {
      console.error('Error exporting data:', error);
      handleApiError(error, "Erro ao exportar dados");
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Carregando transações..." className="h-64" />;
  }

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-0">
      {/* Header responsivo */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex items-center justify-center md:justify-start space-x-2">
          <Button variant="ghost" size="icon" onClick={handlePreviousMonth} className="hover:bg-gray-100">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-white px-3 py-2 rounded-md bg-dilq-purple hover:bg-dilq-accent transition-colors text-sm md:text-base">
            {formatMonth(currentDate)}
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="hover:bg-gray-100">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs responsivas */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-3 w-full md:w-[300px] bg-white/10 border border-white/20">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-1 text-xs md:text-sm data-[state=active]:bg-dilq-purple data-[state=active]:text-white hover:bg-white/10"
            >
              <LayoutDashboard className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="list" 
              className="flex items-center gap-1 text-xs md:text-sm data-[state=active]:bg-dilq-purple data-[state=active]:text-white hover:bg-white/10"
            >
              <List className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Lista</span>
            </TabsTrigger>
            <TabsTrigger 
              value="calendar" 
              className="flex items-center gap-1 text-xs md:text-sm data-[state=active]:bg-dilq-purple data-[state=active]:text-white hover:bg-white/10"
            >
              <CalendarDays className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Calendário</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Controles e filtros */}
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col space-y-3 md:flex-row md:justify-between md:items-center md:space-y-0">
          <div className="relative flex-1 max-w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Pesquisar transações..." 
              className="pl-9 bg-white border-gray-200 text-gray-900 placeholder:text-gray-500" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button 
              variant="outline" 
              size="sm"
              className="flex md:hidden order-2 sm:order-1"
              onClick={handleExportData}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="hidden md:flex order-2 sm:order-1"
              onClick={handleExportData}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            
            <Button 
              className="bg-black hover:bg-black/90 text-white order-1 sm:order-2" 
              onClick={() => {
                setEditingTransaction(null);
                setShowNewTransactionForm(!showNewTransactionForm);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nova Transação</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
        </div>

        {/* Formulário */}
        {showNewTransactionForm && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm">
            <NewTransactionForm 
              selectedFilter={selectedFilter} 
              onTransactionCreated={handleTransactionCreated} 
              editingTransaction={editingTransaction} 
            />
          </div>
        )}

        {/* Conteúdo por visualização */}
        {viewMode === "dashboard" && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm">
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
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm">
            <TransactionCalendarView 
              transactions={filteredTransactions} 
              onDateSelect={() => {}} 
            />
          </div>
        )}

        {(viewMode === "list" || viewMode === "dashboard") && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm overflow-x-auto">
            {filteredTransactions.length === 0 ? (
              <EmptyState
                title="Nenhuma transação encontrada"
                description="Adicione sua primeira transação para começar a gerenciar suas finanças."
                action={{
                  label: "Nova Transação",
                  onClick: () => setShowNewTransactionForm(true)
                }}
              />
            ) : (
              <TransactionsTable 
                transactions={filteredTransactions}
                onDelete={handleDeleteTransaction}
                onToggleStatus={togglePaymentStatus}
                onEdit={handleEditTransaction}
                onDeleteRecurring={handleDeleteRecurringTransaction}
                loading={loading}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
