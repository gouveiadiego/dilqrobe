
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale/pt-BR";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
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

interface TransactionCalendarProps {
  transactions: Transaction[];
  onDateSelect: (date: Date) => void;
}

export const TransactionCalendar = ({ transactions, onDateSelect }: TransactionCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateSelect(date);
    }
  };

  const getTransactionsForDate = (date: Date) => {
    return transactions.filter(
      (transaction) =>
        new Date(transaction.date).toDateString() === date.toDateString()
    );
  };

  const getDayContent = (date: Date) => {
    const dayTransactions = getTransactionsForDate(date);
    if (dayTransactions.length === 0) return null;

    const hasIncome = dayTransactions.some(t => t.amount > 0);
    const hasExpense = dayTransactions.some(t => t.amount < 0);
    const hasTransfer = dayTransactions.some(t => t.category === 'transfer');

    return (
      <div className="w-full flex flex-col gap-0.5 mt-1">
        {hasIncome && <div className="h-1 bg-emerald-500 rounded-full" />}
        {hasExpense && <div className="h-1 bg-rose-500 rounded-full" />}
        {hasTransfer && <div className="h-1 bg-blue-500 rounded-full" />}
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleDateSelect}
        locale={ptBR}
        className="rounded-md"
        components={{
          DayContent: ({ date }) => (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full h-full p-0 hover:bg-transparent relative"
                >
                  <div className="flex flex-col items-center w-full">
                    <span>{date.getDate()}</span>
                    {getDayContent(date)}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-4" align="start">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">
                    {date.toLocaleDateString('pt-BR', { 
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </h3>
                  <Button variant="ghost" size="icon" className="h-auto p-1.5">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium mb-2">Transações</div>
                  {getTransactionsForDate(date).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="grid grid-cols-[2fr,1fr,1fr,auto] gap-4 items-center py-2 border-b border-gray-700 last:border-0"
                    >
                      <span className="text-sm">{transaction.description}</span>
                      <span className="text-sm">{transaction.category}</span>
                      <span className="text-sm">{transaction.received_from}</span>
                      <span className={`text-sm font-medium ${
                        transaction.amount > 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))}
                  {getTransactionsForDate(date).length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      Nenhuma transação para este dia
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          ),
        }}
      />
      <div className="flex gap-4 mt-4 text-xs">
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
  );
};
