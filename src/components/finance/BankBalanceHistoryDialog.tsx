import { useState, useMemo } from "react";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertCircle,
  CheckCircle2,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronDown,
  ChevronRight,
  CalendarRange,
  X,
} from "lucide-react";
import { useBankBalanceHistory } from "@/hooks/useBankBalanceHistory";
import { BankAccount } from "@/hooks/useBankAccounts";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtTime = (iso: string) => {
  try {
    return format(new Date(iso), "HH:mm");
  } catch {
    return "";
  }
};

interface Props {
  account: BankAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BankBalanceHistoryDialog = ({ account, open, onOpenChange }: Props) => {
  const { loading, history, saveSnapshot, deleteSnapshot } = useBankBalanceHistory({
    bankAccountId: account?.id ?? null,
    initialBalance: Number(account?.initial_balance ?? 0),
  });

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [real, setReal] = useState("");
  const [note, setNote] = useState("");
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});

  // Filtro de período
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const hasFilter = filterStart || filterEnd;

  const todayKey = format(new Date(), "yyyy-MM-dd");

  // First (most recent) day open by default
  const effectiveOpen = (d: string) => {
    if (openDays[d] !== undefined) return openDays[d];
    return d === history[0]?.date;
  };

  const filteredHistory = useMemo(() => {
    if (!hasFilter) return history;
    return history.filter((day) => {
      const d = parseISO(day.date);
      if (filterStart && filterEnd) {
        return isWithinInterval(d, {
          start: startOfDay(parseISO(filterStart)),
          end: endOfDay(parseISO(filterEnd)),
        });
      }
      if (filterStart) return d >= startOfDay(parseISO(filterStart));
      if (filterEnd) return d <= endOfDay(parseISO(filterEnd));
      return true;
    });
  }, [history, filterStart, filterEnd, hasFilter]);

  const clearFilter = () => {
    setFilterStart("");
    setFilterEnd("");
  };

  const handleSave = async () => {
    const v = parseFloat(real.replace(",", "."));
    if (isNaN(v)) return;
    await saveSnapshot({ date, real_balance: v, note: note || undefined });
    setReal("");
    setNote("");
  };

  const currentSystem = account ? Number(account.current_balance) : 0;
  const lastSnapshot = history.find((h) => h.real_balance !== null);
  const lastDiff = lastSnapshot?.diff ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Extrato — {account?.bank_name}</DialogTitle>
          <DialogDescription>
            Veja as entradas e saídas de cada dia. Registre o saldo real do banco para conciliar.
          </DialogDescription>
        </DialogHeader>

        {account && (
          <div className="space-y-6">
            {/* Status atual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Saldo Sistema (hoje)</p>
                <p className="text-xl font-bold">{fmt(currentSystem)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Último Saldo Real</p>
                <p className="text-xl font-bold">
                  {lastSnapshot ? fmt(lastSnapshot.real_balance!) : "—"}
                </p>
                {lastSnapshot && (
                  <p className="text-xs text-muted-foreground">
                    em {format(new Date(lastSnapshot.date + "T00:00:00"), "dd/MM/yyyy")}
                  </p>
                )}
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Diferença</p>
                {lastDiff === null ? (
                  <p className="text-xl font-bold">—</p>
                ) : Math.abs(lastDiff) < 0.01 ? (
                  <p className="text-xl font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-5 w-5" /> Bate
                  </p>
                ) : (
                  <p className="text-xl font-bold text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-5 w-5" /> {fmt(lastDiff)}
                  </p>
                )}
              </div>
            </div>

            {/* Form */}
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-medium">Registrar saldo real do banco</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label>Data</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Saldo real (R$)</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={real}
                    onChange={(e) => setReal(e.target.value)}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Observação (opcional)</Label>
                  <Input
                    placeholder="Ex: conferido no app do banco"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={!real}>
                  Salvar registro
                </Button>
              </div>
            </div>

            {/* Filtro de período */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Filtrar por período</h4>
                {hasFilter && (
                  <Button variant="ghost" size="sm" className="h-7 ml-auto" onClick={clearFilter}>
                    <X className="h-3 w-3 mr-1" /> Limpar
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Data inicial</Label>
                  <Input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Data final</Label>
                  <Input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Statement */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Movimentações por dia</h4>
                {hasFilter && (
                  <Badge variant="secondary">
                    {filteredHistory.length} {filteredHistory.length === 1 ? "dia" : "dias"}
                  </Badge>
                )}
              </div>

              {loading && (
                <p className="text-center text-sm text-muted-foreground py-6">Carregando...</p>
              )}

              {!loading && filteredHistory.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">
                  {hasFilter ? "Nenhuma movimentação no período selecionado." : "Sem movimentações ou registros ainda."}
                </p>
              )}

              {filteredHistory.map((day) => {
                const isOpen = effectiveOpen(day.date);
                const dateLabel = format(new Date(day.date + "T00:00:00"), "EEEE, dd 'de' MMMM", {
                  locale: ptBR,
                });
                return (
                  <Collapsible
                    key={day.date}
                    open={isOpen}
                    onOpenChange={(o) => setOpenDays((s) => ({ ...s, [day.date]: o }))}
                  >
                    <div className="rounded-lg border overflow-hidden">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between gap-3 p-3 hover:bg-muted/50 transition-colors text-left">
                          <div className="flex items-center gap-2 min-w-0">
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium capitalize truncate">
                                {dateLabel}
                                {day.date === todayKey && (
                                  <Badge variant="secondary" className="ml-2">Hoje</Badge>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {day.transactions.length}{" "}
                                {day.transactions.length === 1 ? "movimentação" : "movimentações"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right hidden sm:block">
                              <p className="text-[10px] uppercase text-muted-foreground">Entradas</p>
                              <p className="text-sm font-semibold text-emerald-600">
                                +{fmt(day.total_in)}
                              </p>
                            </div>
                            <div className="text-right hidden sm:block">
                              <p className="text-[10px] uppercase text-muted-foreground">Saídas</p>
                              <p className="text-sm font-semibold text-rose-600">
                                -{fmt(day.total_out)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] uppercase text-muted-foreground">Saldo</p>
                              <p className="text-sm font-bold">{fmt(day.closing_balance)}</p>
                            </div>
                            {day.real_balance !== null && (
                              <Badge
                                variant="outline"
                                className={
                                  Math.abs(day.diff ?? 0) < 0.01
                                    ? "text-emerald-600 border-emerald-600"
                                    : "text-amber-600 border-amber-600"
                                }
                              >
                                {Math.abs(day.diff ?? 0) < 0.01 ? "OK" : fmt(day.diff ?? 0)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="border-t bg-muted/20 px-3 py-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                          <span>Saldo inicial: <strong className="text-foreground">{fmt(day.opening_balance)}</strong></span>
                          <span className="sm:hidden">Entradas: <strong className="text-emerald-600">+{fmt(day.total_in)}</strong></span>
                          <span className="sm:hidden">Saídas: <strong className="text-rose-600">-{fmt(day.total_out)}</strong></span>
                          <span>Saldo final: <strong className="text-foreground">{fmt(day.closing_balance)}</strong></span>
                          {day.real_balance !== null && (
                            <span>
                              Saldo real banco:{" "}
                              <strong className="text-foreground">{fmt(day.real_balance)}</strong>
                              {day.note && <span className="ml-1">— {day.note}</span>}
                              {day.snapshot_id && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 ml-1"
                                  onClick={() => deleteSnapshot(day.snapshot_id!)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </span>
                          )}
                        </div>

                        {day.transactions.length === 0 ? (
                          <p className="px-4 py-4 text-sm text-muted-foreground">
                            Nenhuma transação neste dia (apenas registro de saldo).
                          </p>
                        ) : (
                          <ul className="divide-y">
                            {day.transactions.map((t) => {
                              const isIn = t.amount >= 0;
                              return (
                                <li
                                  key={t.id}
                                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30"
                                >
                                  {isIn ? (
                                    <ArrowUpCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <ArrowDownCircle className="h-5 w-5 text-rose-600 shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {t.description || t.received_from || "(sem descrição)"}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {fmtTime(t.created_at)}
                                      {t.received_from && t.description ? ` • ${t.received_from}` : ""}
                                      {t.payment_type ? ` • ${t.payment_type}` : ""}
                                    </p>
                                  </div>
                                  <p
                                    className={`text-sm font-semibold shrink-0 ${
                                      isIn ? "text-emerald-600" : "text-rose-600"
                                    }`}
                                  >
                                    {isIn ? "+" : "-"}
                                    {fmt(Math.abs(t.amount))}
                                  </p>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
