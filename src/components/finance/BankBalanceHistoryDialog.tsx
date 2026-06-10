import { useState, useMemo } from "react";
import { format } from "date-fns";
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { useBankBalanceHistory } from "@/hooks/useBankBalanceHistory";
import { BankAccount } from "@/hooks/useBankAccounts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

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

  const chartData = useMemo(
    () =>
      [...history]
        .reverse()
        .map((h) => ({
          date: format(new Date(h.date + "T00:00:00"), "dd/MM", { locale: ptBR }),
          Sistema: Number(h.system_balance.toFixed(2)),
          Real: h.real_balance !== null ? Number(h.real_balance.toFixed(2)) : null,
        })),
    [history]
  );

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
          <DialogTitle>Histórico de Saldo — {account?.bank_name}</DialogTitle>
          <DialogDescription>
            Compare o saldo do sistema com o saldo real do banco para reconciliar lançamentos.
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

            {/* Chart */}
            {chartData.length > 0 && (
              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-3">Evolução do saldo</h4>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(v) => fmt(v).replace("R$", "")} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Sistema"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="Real"
                        stroke="#10b981"
                        strokeWidth={2}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Sistema</TableHead>
                    <TableHead className="text-right">Real</TableHead>
                    <TableHead className="text-right">Diferença</TableHead>
                    <TableHead>Obs.</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  )}
                  {!loading && history.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Sem movimentações ou registros ainda.
                      </TableCell>
                    </TableRow>
                  )}
                  {history.map((h) => (
                    <TableRow key={h.date}>
                      <TableCell>
                        {format(new Date(h.date + "T00:00:00"), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-right">{fmt(h.system_balance)}</TableCell>
                      <TableCell className="text-right">
                        {h.real_balance !== null ? fmt(h.real_balance) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {h.diff === null ? (
                          "—"
                        ) : Math.abs(h.diff) < 0.01 ? (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-600">
                            OK
                          </Badge>
                        ) : (
                          <span className={h.diff > 0 ? "text-emerald-600" : "text-rose-600"}>
                            {fmt(h.diff)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{h.note || "—"}</TableCell>
                      <TableCell>
                        {h.snapshot_id && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteSnapshot(h.snapshot_id!)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
