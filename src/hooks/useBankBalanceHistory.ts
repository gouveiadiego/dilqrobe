import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface BankBalanceSnapshot {
  id: string;
  user_id: string;
  bank_account_id: string;
  snapshot_date: string; // yyyy-MM-dd
  real_balance: number;
  system_balance: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface BalanceHistoryRow {
  date: string; // yyyy-MM-dd
  system_balance: number;
  real_balance: number | null;
  diff: number | null;
  note: string | null;
  snapshot_id: string | null;
}

interface Args {
  bankAccountId: string | null;
  initialBalance: number;
}

/**
 * Builds a daily balance history for a given bank account:
 * - system_balance: derived from initial_balance + sum(paid transactions up to date)
 * - real_balance: from manual snapshots saved by the user
 * - diff: real - system (for reconciliation)
 */
export const useBankBalanceHistory = ({ bankAccountId, initialBalance }: Args) => {
  const [loading, setLoading] = useState(false);
  const [snapshots, setSnapshots] = useState<BankBalanceSnapshot[]>([]);
  const [history, setHistory] = useState<BalanceHistoryRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!bankAccountId) return;
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      setUserId(user.id);

      const [{ data: txs, error: txErr }, { data: snaps, error: snapErr }] = await Promise.all([
        supabase
          .from("transactions")
          .select("date, amount, is_paid")
          .eq("user_id", user.id)
          .eq("bank_account_id", bankAccountId)
          .eq("is_paid", true)
          .order("date", { ascending: true }),
        supabase
          .from("bank_balance_snapshots")
          .select("*")
          .eq("user_id", user.id)
          .eq("bank_account_id", bankAccountId)
          .order("snapshot_date", { ascending: false }),
      ]);

      if (txErr) throw txErr;
      if (snapErr) throw snapErr;

      setSnapshots((snaps || []) as BankBalanceSnapshot[]);

      // Aggregate transactions per day
      const perDay = new Map<string, number>();
      (txs || []).forEach((t: any) => {
        const d = t.date as string;
        perDay.set(d, (perDay.get(d) || 0) + Number(t.amount));
      });

      // Build union of relevant dates: each tx date + each snapshot date
      const dateSet = new Set<string>();
      perDay.forEach((_v, k) => dateSet.add(k));
      (snaps || []).forEach((s: any) => dateSet.add(s.snapshot_date));
      const dates = Array.from(dateSet).sort();

      // Running system balance
      let running = Number(initialBalance) || 0;
      const cumulative = new Map<string, number>();
      dates.forEach((d) => {
        running += perDay.get(d) || 0;
        cumulative.set(d, running);
      });

      const snapByDate = new Map<string, BankBalanceSnapshot>();
      (snaps || []).forEach((s: any) => snapByDate.set(s.snapshot_date, s));

      const rows: BalanceHistoryRow[] = dates
        .map((d) => {
          const sys = cumulative.get(d) ?? 0;
          const snap = snapByDate.get(d) || null;
          const real = snap ? Number(snap.real_balance) : null;
          return {
            date: d,
            system_balance: sys,
            real_balance: real,
            diff: real !== null ? real - sys : null,
            note: snap?.note ?? null,
            snapshot_id: snap?.id ?? null,
          };
        })
        .reverse(); // newest first

      setHistory(rows);
    } catch (e: any) {
      console.error("Erro carregando histórico:", e);
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [bankAccountId, initialBalance]);

  useEffect(() => {
    load();
  }, [load]);

  const saveSnapshot = async (args: { date: string; real_balance: number; note?: string }) => {
    if (!bankAccountId || !userId) return;
    try {
      const { error } = await supabase
        .from("bank_balance_snapshots")
        .upsert(
          {
            user_id: userId,
            bank_account_id: bankAccountId,
            snapshot_date: args.date,
            real_balance: args.real_balance,
            note: args.note ?? null,
          },
          { onConflict: "user_id,bank_account_id,snapshot_date" }
        );
      if (error) throw error;
      toast({ title: "Snapshot salvo", description: `Saldo registrado em ${args.date}` });
      await load();
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const deleteSnapshot = async (id: string) => {
    try {
      const { error } = await supabase.from("bank_balance_snapshots").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Registro removido" });
      await load();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  return { loading, snapshots, history, saveSnapshot, deleteSnapshot, reload: load };
};
