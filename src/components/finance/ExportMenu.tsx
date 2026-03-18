import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown, ChevronDown, Calendar, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportFinancePDF, exportMonthPDF } from "@/utils/financeExport";
import { handleSuccess, handleApiError } from "@/utils/errorHandler";
import type { Transaction } from "@/hooks/useTransactions";
import type { DateRange } from "./PeriodFilter";

interface ExportMenuProps {
  transactions: Transaction[];
  currentDateRange: DateRange;
  appliedFilter?: string;
  searchQuery?: string;
  summaries: {
    income: number;
    expenses: number;
    balance: number;
    pending: number;
  };
}

export const ExportMenu = ({ transactions, currentDateRange, summaries, appliedFilter, searchQuery }: ExportMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Year/month selectors for the "by month" option
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => currentYear - i),
    [currentYear]
  );
  const monthOptions = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: format(new Date(2000, i, 1), "MMMM", { locale: ptBR }),
    })),
    []
  );

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const handleExportCurrentPeriod = async () => {
    setLoading(true);
    try {
      // Recalculate summaries for export (use the passed summaries)
      exportFinancePDF({
        transactions,
        periodLabel: currentDateRange.label,
        startDate: currentDateRange.startDate,
        endDate: currentDateRange.endDate,
        appliedFilter,
        searchQuery,
        summaries,
      });
      handleSuccess("PDF exportado com sucesso!");
      setIsOpen(false);
    } catch (err) {
      handleApiError(err, "Erro ao gerar PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleExportByMonth = async () => {
    setLoading(true);
    try {
      // We'll pass all transactions; the utility filters by the selected month
      exportMonthPDF(transactions, selectedYear, selectedMonth, appliedFilter, searchQuery);
      handleSuccess("PDF exportado com sucesso!");
      setIsOpen(false);
    } catch (err) {
      handleApiError(err, "Erro ao gerar PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 border-dilq-purple/30 text-dilq-purple hover:bg-dilq-purple/10 hover:border-dilq-purple"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Exportar PDF</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-dilq-purple to-dilq-accent px-4 py-3">
          <div className="flex items-center gap-2 text-white">
            <FileDown className="h-4 w-4" />
            <span className="font-semibold text-sm">Exportar Relatório PDF</span>
          </div>
          <p className="text-white/70 text-xs mt-0.5">Escolha o período desejado</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Option 1: Current Period */}
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-dilq-purple" />
              <span className="text-sm font-medium text-gray-800">Período atual</span>
            </div>
            <p className="text-xs text-gray-500 capitalize pl-6">
              {currentDateRange.label}
            </p>
            <Button
              size="sm"
              className="w-full bg-dilq-purple hover:bg-dilq-purple/90 text-white mt-1"
              onClick={handleExportCurrentPeriod}
              disabled={loading || transactions.length === 0}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Exportar este período
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400">ou por mês</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Option 2: Specific Month */}
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-dilq-purple" />
              <span className="text-sm font-medium text-gray-800">Mês específico</span>
            </div>

            <div className="flex gap-2">
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="w-[90px] bg-white border-gray-200 text-sm h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger className="flex-1 bg-white border-gray-200 text-sm h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      <span className="capitalize">{m.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="w-full border-dilq-purple/40 text-dilq-purple hover:bg-dilq-purple/10"
              onClick={handleExportByMonth}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Exportar{" "}
              <span className="capitalize ml-1">
                {format(new Date(selectedYear, selectedMonth, 1), "MMM/yyyy", {
                  locale: ptBR,
                })}
              </span>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
