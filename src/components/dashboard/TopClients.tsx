
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransactions } from "@/hooks/useTransactions";
import { useClients } from "@/hooks/useClients";
import { useMeetings } from "@/hooks/useMeetings";
import { Users, TrendingUp } from "lucide-react";

interface ClientScore {
  id: string;
  name: string;
  revenue: number;
  meetingsCount: number;
  lastInteraction: Date | null;
  score: number;
}

export const TopClients = () => {
  const [currentDate] = useState(new Date());
  const { transactions } = useTransactions({ currentDate });
  const { clients } = useClients();
  const { meetings } = useMeetings();
  const [topClients, setTopClients] = useState<ClientScore[]>([]);

  useEffect(() => {
    if (!clients.length) return;

    // Create a scoring system for clients
    const clientScores: ClientScore[] = clients.map(client => {
      // Calculate revenue from this client
      const clientTransactions = transactions.filter(
        t => t.received_from === client.name && t.amount > 0
      );
      const revenue = clientTransactions.reduce(
        (sum, t) => sum + Number(t.amount), 0
      );
      
      // Calculate number of meetings with this client
      const clientMeetings = meetings.filter(m => m.client_id === client.id);
      const meetingsCount = clientMeetings.length;
      
      // Find last interaction (meeting or transaction)
      const meetingDates = clientMeetings.map(m => new Date(m.meeting_date));
      const transactionDates = clientTransactions.map(t => t.date ? new Date(t.date) : null).filter(Boolean) as Date[];
      const allDates = [...meetingDates, ...transactionDates];
      const lastInteraction = allDates.length 
        ? new Date(Math.max(...allDates.map(d => d.getTime())))
        : null;
        
      // Create a score based on revenue and activity
      const revenueScore = revenue * 0.6; // 60% weight to revenue
      const activityScore = meetingsCount * 200; // Each meeting is worth 200 points
      const recencyScore = lastInteraction 
        ? Math.max(0, 5000 - (Date.now() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)) 
        : 0; // More recent interactions get higher score
        
      const totalScore = revenueScore + activityScore + recencyScore;
      
      return {
        id: client.id,
        name: client.name,
        revenue,
        meetingsCount,
        lastInteraction,
        score: totalScore
      };
    });
    
    // Sort by score and take top 5
    const sorted = clientScores
      .sort((a, b) => b.score - a.score)
      .filter(client => client.revenue > 0 || client.meetingsCount > 0)
      .slice(0, 4);
      
    setTopClients(sorted);
  }, [clients, transactions, meetings]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-dilq-accent/10 dark-hover-glow h-full">
      <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-purple-100/50 dark:from-indigo-900/20 dark:to-purple-900/20 pb-3 border-b dark:border-gray-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Principais Clientes</CardTitle>
          <div className="h-7 w-7 rounded-lg bg-white/80 dark:bg-gray-800/80 shadow-sm flex items-center justify-center">
            <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {topClients.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Nenhum cliente com atividade recente</span>
          </div>
        ) : (
          <div className="space-y-3">
            {topClients.map((client) => (
              <div key={client.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-all duration-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm">{client.name}</span>
                  <div className="flex items-center gap-1 text-green-500">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-xs font-semibold">{formatCurrency(client.revenue)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{client.meetingsCount} reuniões</span>
                  <span>
                    {client.lastInteraction 
                      ? `Última interação: ${client.lastInteraction.toLocaleDateString('pt-BR')}` 
                      : 'Sem interações recentes'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
