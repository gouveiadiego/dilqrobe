import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { ptBR } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
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

    const totalAmount = dayTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );

    return (
      <div className={`w-full h-full flex items-center justify-center ${
        totalAmount > 0 ? 'text-emerald-500' : 'text-rose-500'
      }`}>
        <div className="text-[10px] font-medium">
          {formatCurrency(totalAmount)}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#221F26] rounded-lg p-6">
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
                  className="w-full h-full p-0 hover:bg-transparent"
                >
                  <div className="flex flex-col items-center">
                    <span>{date.getDate()}</span>
                    {getDayContent(date)}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-4">
                  <h3 className="font-medium mb-2">
                    {date.toLocaleDateString('pt-BR', { 
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h3>
                  <div className="space-y-2">
                    {getTransactionsForDate(date).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex justify-between items-center text-sm"
                      >
                        <span>{transaction.description}</span>
                        <span className={transaction.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}>
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ),
        }}
      />
    </div>
  );
};