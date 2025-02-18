
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { pt } from "date-fns/locale";
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

  return (
    <div className="p-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleDateSelect}
        locale={pt}
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
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-4">
                  <h3 className="font-medium mb-2">
                    {date.toLocaleDateString('pt-BR', { 
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {getTransactionsForDate(date).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {transaction.received_from}
                          </p>
                        </div>
                        <span className={`text-sm font-medium ml-4 ${
                          transaction.amount > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    ))}
                    {getTransactionsForDate(date).length === 0 && (
                      <p className="text-center py-2 text-gray-500 text-sm">
                        Nenhuma transação neste dia
                      </p>
                    )}
                  </div>
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
