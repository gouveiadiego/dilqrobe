import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface BankBalanceSnapshot {
  id: string;
  user_id: string;
  bank_account_id: string;
  snapshot_date: string;
  real_balance: number;
  system_balance: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface StatementTransaction {
  id: string;
  date: string;
  created_at: string;
  description: string | null;
  received_from: string | null;
  payment_type: string | null;
  category: string | null;
  amount: number;
}

export interface BalanceHistoryRow {
  date: string;
  opening_balance: number;
  closing_balance: number;
  total_in: number;
  total_out: number;
  transactions: StatementTransaction[];
  real_balance: number | null;
  diff: number | null;
  note: string | null;
  snapshot_id: string | null;
}

interface Args {
  bankAccountId: string | null;
  initialBalance: number;
}

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
          .select("id, date, created_at, description, received_from, payment_type, category, amount, is_paid")
          .eq("user_id", user.id)
          .eq("bank_account_id", bankAccountId)
          .eq("is_paid", true)
          .order("date", { ascending: true })
          .order("created_at", { ascending: true }),
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

      // Group transactions by date
      const txByDate = new Map<string, StatementTransaction[]>();
      (txs || []).forEach((t: any) => {
        const d = t.date as string;
        const list = txByDate.get(d) || [];
        list.push({
          id: t.id,
          date: t.date,
          created_at: t.created_at,
          description: t.description,
          received_from: t.received_from,
          payment_type: t.payment_type,
          category: t.category,
          amount: Number(t.amount),
        });
        txByDate.set(d, list);
      });

      const dateSet = new Set<string>();
      txByDate.forEach((_v, k) => dateSet.add(k));
      (snaps || []).forEach((s: any) => dateSet.add(s.snapshot_date));
      const dates = Array.from(dateSet).sort();

      const snapByDate = new Map<string, BankBalanceSnapshot>();
      (snaps || []).forEach((s: any) => snapByDate.set(s.snapshot_date, s));

      let running = Number(initialBalance) || 0;
      const rows: BalanceHistoryRow[] = [];
      for (const d of dates) {
        const opening = running;
        const list = txByDate.get(d) || [];
        let totalIn = 0;
        let totalOut = 0;
        list.forEach((t) => {
          if (t.amount >= 0) totalIn += t.amount;
          else totalOut += Math.abs(t.amount);
        });
        running = opening + totalIn - totalOut;
        const snap = snapByDate.get(d) || null;
        const real = snap ? Number(snap.real_balance) : null;
        rows.push({
          date: d,
          opening_balance: opening,
          closing_balance: running,
          total_in: totalIn,
          total_out: totalOut,
          transactions: list,
          real_balance: real,
          diff: real !== null ? real - running : null,
          note: snap?.note ?? null,
          snapshot_id: snap?.id ?? null,
        });
      }

      setHistory(rows.reverse()); // newest first
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
