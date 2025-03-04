
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Subscription {
  id: string;
  status: string;
  productName: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSubscription(null);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('get-subscription', {
        body: {
          userId: user.id
        }
      });
      
      if (error) {
        console.error('Error fetching subscription:', error);
        setError('Erro ao buscar informações da assinatura');
        return;
      }
      
      setSubscription(data);
    } catch (err) {
      console.error('Error in fetchSubscription:', err);
      setError('Ocorreu um erro ao carregar sua assinatura');
    } finally {
      setLoading(false);
    }
  };

  const hasActiveSubscription = subscription?.status === 'active';

  return {
    subscription,
    loading,
    error,
    hasActiveSubscription,
    refreshSubscription: fetchSubscription
  };
}
