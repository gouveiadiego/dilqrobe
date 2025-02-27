
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { pt } from "date-fns/locale";
import { addDays, isBefore, isToday } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

interface TransactionCalendarProps {
  transactions: Transaction[];
  onDateSelect: (date: Date) => void;
}

export const TransactionCalendar = ({ transactions, onDateSelect }: TransactionCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(transactions);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateSelect(date);
    }
  };

  const handleTogglePayment = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ is_paid: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setLocalTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id 
            ? { ...transaction, is_paid: !currentStatus } 
            : transaction
        )
      );
      
      toast.success(`Transação ${!currentStatus ? 'marcada como paga' : 'marcada como pendente'}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error("Erro ao atualizar status de pagamento");
    }
  };

  // Use local state for filtering transactions
  const getTransactionsForDate = (date: Date) => {
    return localTransactions.filter(
      (transaction) =>
        new Date(transaction.date).toDateString() === date.toDateString()
    );
  };

  const getUpcomingTransactions = () => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    
    return localTransactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return !transaction.is_paid && 
               (isToday(transactionDate) || 
                (isBefore(today, transactionDate) && isBefore(transactionDate, nextWeek)));
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getOverdueTransactions = () => {
    const today = new Date();
    
    return localTransactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return !transaction.is_paid && isBefore(transactionDate, today);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getDayContent = (date: Date) => {
    const dayTransactions = getTransactionsForDate(date);
    if (dayTransactions.length === 0) return null;

    const totalIncome = dayTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = dayTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const hasIncome = totalIncome > 0;
    const hasExpense = totalExpense > 0;
    const hasTransfer = dayTransactions.some(t => t.category === 'transfer');

    return (
      <div className="w-full flex flex-col gap-0.5 mt-1">
        {hasIncome && <div className="h-1 bg-emerald-500 rounded-full" />}
        {hasExpense && <div className="h-1 bg-rose-500 rounded-full" />}
        {hasTransfer && <div className="h-1 bg-blue-500 rounded-full" />}
      </div>
    );
  };

  const upcomingTransactions = getUpcomingTransactions();
  const overdueTransactions = getOverdueTransactions();

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr,300px,300px] gap-6">
      <div className="p-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          locale={pt}
          className="rounded-md mx-auto"
          components={{
            DayContent: ({ date }) => {
              const dayTransactions = getTransactionsForDate(date);
              
              return (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`w-full h-full p-0 hover:bg-transparent relative ${
                        dayTransactions.length > 0 ? 'font-medium' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center w-full">
                        <span>{date.getDate()}</span>
                        {getDayContent(date)}
                      </div>
                    </Button>
                  </PopoverTrigger>
                  {dayTransactions.length > 0 && (
                    <PopoverContent 
                      className="w-80 p-0" 
                      align="center"
                      sideOffset={5}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">
                            {date.toLocaleDateString('pt-BR', { 
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </h3>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {dayTransactions.map((transaction) => (
                            <div
                              key={transaction.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex-1 min-w-0 mr-4">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {transaction.description}
                                </p>
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  {transaction.received_from}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    transaction.is_paid 
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {transaction.is_paid ? 'Pago' : 'Pendente'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {transaction.payment_type}
                                  </span>
                                </div>
                              </div>
                              <span className={`text-sm font-medium whitespace-nowrap ${
                                transaction.amount > 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}>
                                {formatCurrency(transaction.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  )}
                </Popover>
              );
            },
          }}
        />
        <div className="flex gap-4 mt-4 text-xs justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-emerald-500 rounded-full" />
            <span>Recebimentos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-rose-500 rounded-full" />
            <span>Despesas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-blue-500 rounded-full" />
            <span>Transferências</span>
          </div>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h3 className="font-medium">Próximos Vencimentos</h3>
        </div>
        {upcomingTransactions.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {upcomingTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Vence em: {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {transaction.received_from}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {transaction.payment_type}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-sm font-medium whitespace-nowrap ${
                        transaction.amount > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {formatCurrency(Math.abs(transaction.amount))}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 text-xs"
                        onClick={() => handleTogglePayment(transaction.id, transaction.is_paid)}
                      >
                        <Check className="w-3 h-3" />
                        Marcar como pago
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            Nenhum vencimento próximo
          </p>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <h3 className="font-medium">Atrasados</h3>
        </div>
        {overdueTransactions.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {overdueTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-3 rounded-lg bg-rose-50 hover:bg-rose-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-rose-600 mt-0.5 font-medium">
                        Venceu em: {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {transaction.received_from}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {transaction.payment_type}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-sm font-medium whitespace-nowrap ${
                        transaction.amount > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {formatCurrency(Math.abs(transaction.amount))}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1 text-xs"
                        onClick={() => handleTogglePayment(transaction.id, transaction.is_paid)}
                      >
                        <Check className="w-3 h-3" />
                        Marcar como pago
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            Nenhum pagamento atrasado
          </p>
        )}
      </Card>
    </div>
  );
};
