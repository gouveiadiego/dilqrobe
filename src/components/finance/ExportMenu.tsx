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
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportFinancePDF, fetchImageAsBase64 } from "@/utils/financeExport";
import { handleSuccess, handleApiError } from "@/utils/errorHandler";
import { supabase } from "@/integrations/supabase/client";
import type { Transaction } from "@/hooks/useTransactions";
import type { DateRange } from "./PeriodFilter";

interface ExportMenuProps {
  allTransactions: Transaction[];   // full list for the current date range (unfiltered)
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

// Fetch all transactions for a given date range from Supabase
async function fetchTransactionsForRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data, error } = await supabase
    .from("transactions")
    .select("id,date,description,received_from,category,amount,payment_type,is_paid,recurring,recurring_day,recurrence_type,bank_account_id")
    .eq("user_id", user.id)
    .gte("date", format(startDate, "yyyy-MM-dd"))
    .lte("date", format(endDate, "yyyy-MM-dd"))
    .order("date", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Transaction[];
}

function buildSummaries(txns: Transaction[]) {
  const income   = txns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = txns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  return {
    income,
    expenses,
    balance: income - expenses,
    pending: txns.filter(t => !t.is_paid).reduce((s, t) => s + Math.abs(t.amount), 0),
  };
}

export const ExportMenu = ({ allTransactions, currentDateRange }: ExportMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMonth, setLoadingMonth] = useState(false);

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

  // Summaries for current period (from already-loaded transactions)
  const fullSummaries = useMemo(() => buildSummaries(allTransactions), [allTransactions]);

  // ── Export current period (data already in memory) ──────────────────────────
  const handleExportCurrentPeriod = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name, company_logo")
        .eq("id", user?.id)
        .maybeSingle();

      let logoBase64 = null;
      if (profile?.company_logo) {
        logoBase64 = await fetchImageAsBase64(profile.company_logo);
      }

      exportFinancePDF({
        transactions: allTransactions,
        periodLabel: currentDateRange.label,
        startDate: currentDateRange.startDate,
        endDate: currentDateRange.endDate,
        appliedFilter: "all",
        searchQuery: "",
        summaries: fullSummaries,
        companyName: profile?.company_name,
        companyLogoBase64: logoBase64,
      });
      handleSuccess("PDF exportado com sucesso!");
      setIsOpen(false);
    } catch (err) {
      handleApiError(err, "Erro ao gerar PDF");
    } finally {
      setLoading(false);
    }
  };

  // ── Export specific month — fetches fresh from Supabase ─────────────────────
  const handleExportByMonth = async () => {
    setLoadingMonth(true);
    try {
      const startDate = startOfMonth(new Date(selectedYear, selectedMonth, 1));
      const endDate   = endOfMonth(startDate);
      const periodLabel = format(startDate, "MMMM 'de' yyyy", { locale: ptBR });

      const txns = await fetchTransactionsForRange(startDate, endDate);
      const sums = buildSummaries(txns);

      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name, company_logo")
        .eq("id", user?.id)
        .maybeSingle();

      let logoBase64 = null;
      if (profile?.company_logo) {
        logoBase64 = await fetchImageAsBase64(profile.company_logo);
      }

      exportFinancePDF({
        transactions: txns,
        periodLabel,
        startDate,
        endDate,
        appliedFilter: "all",
        searchQuery: "",
        summaries: sums,
        companyName: profile?.company_name,
        companyLogoBase64: logoBase64,
      });

      handleSuccess("PDF exportado com sucesso!");
      setIsOpen(false);
    } catch (err) {
      handleApiError(err, "Erro ao gerar PDF do mês");
    } finally {
      setLoadingMonth(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 border-dilq-purple/30 text-dilq-purple hover:bg-dilq-purple/10 hover:border-dilq-purple"
          disabled={loading || loadingMonth}
        >
          {(loading || loadingMonth) ? (
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
              disabled={loading || loadingMonth || allTransactions.length === 0}
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

          {/* Option 2: Specific Month – fetches fresh from DB */}
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
              disabled={loading || loadingMonth}
            >
              {loadingMonth ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
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
