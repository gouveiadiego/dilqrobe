import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/utils";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SeriesDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (t: Transaction) => void;
}

export const SeriesDialog = ({ transaction, open, onOpenChange, onEdit }: SeriesDialogProps) => {
  const [seriesTransactions, setSeriesTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && transaction) {
      loadSeries();
    }
  }, [open, transaction]);

  const loadSeries = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("transactions")
        .select('*')
        .order("date", { ascending: true });

      if (transaction?.series_id) {
        query = query.eq('series_id', transaction.series_id);
      } else if (transaction) {
        query = query.eq('description', transaction.description)
                     .eq('user_id', transaction.user_id as string);
                     
        if (transaction.recurring) {
          query = query.eq('recurring', true);
        } else if (transaction.installments_total) {
          query = query.eq('installments_total', transaction.installments_total);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setSeriesTransactions(data as Transaction[]);
    } catch (err) {
      console.error("Error loading series:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto w-11/12 bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            Visão Geral da Série: {transaction?.description}
          </DialogTitle>
          <DialogDescription>
            Todas as parcelas ou assinaturas geradas para este grupo. Clique em 'Editar' numa parcela acima para alterá-la e reajustar futuras.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Carregando parcelas...</div>
        ) : (
          <div className="rounded-md border border-gray-100 overflow-hidden mt-4">
            <table className="w-full text-sm">
              <thead className="bg-[#40657E] text-white font-medium">
                <tr>
                  <th className="py-3 px-4 text-left font-medium">Parcela</th>
                  <th className="py-3 px-4 text-left font-medium">Data</th>
                  <th className="py-3 px-4 text-left font-medium">Valor</th>
                  <th className="py-3 px-4 text-left font-medium">Status</th>
                  <th className="py-3 px-4 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {seriesTransactions.map((t, idx) => {
                  const [year, month, day] = t.date.substring(0, 10).split('-').map(Number);
                  const dateStr = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
                  
                  return (
                  <tr key={t.id} className="border-t border-gray-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-gray-700">
                      {t.installments_total ? `${t.installment_number || (idx+1)} de ${t.installments_total}` : `Assinatura - Cód. ${idx+1}`}
                    </td>
                    <td className="py-3 px-4 text-gray-700">{dateStr}</td>
                    <td className={`py-3 px-4 font-semibold ${t.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="py-3 px-4">
                      {t.is_paid 
                        ? <span className="text-emerald-700 font-medium bg-emerald-100 px-3 py-1 rounded-full text-xs">Pago</span>
                        : <span className="text-amber-700 font-medium bg-amber-100 px-3 py-1 rounded-full text-xs">Pendente</span>
                      }
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="outline" size="sm" className="h-8 text-xs font-semibold" onClick={() => {
                        onOpenChange(false);
                        onEdit(t);
                      }}>Editar Parcela o Grupo</Button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
