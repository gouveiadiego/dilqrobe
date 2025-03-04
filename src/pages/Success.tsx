
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function Success() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error("Você precisa estar logado para visualizar esta página");
          setLoading(false);
          return;
        }
        
        // Wait a bit for the webhook to process
        setTimeout(async () => {
          const { data, error } = await supabase.functions.invoke('get-subscription', {
            body: {
              userId: user.id
            }
          });
          
          if (error) {
            console.error('Error fetching subscription:', error);
            toast.error("Erro ao buscar informações da assinatura");
            return;
          }
          
          setSubscription(data);
          setLoading(false);
        }, 2000);
      } catch (error) {
        console.error('Error in checkSubscription:', error);
        toast.error("Ocorreu um erro ao verificar sua assinatura");
        setLoading(false);
      }
    };
    
    checkSubscription();
  }, []);

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md border-green-200">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            {loading ? (
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            ) : (
              <CheckCircle className="h-8 w-8 text-green-600" />
            )}
          </div>
          <CardTitle className="text-2xl">Pagamento Confirmado</CardTitle>
          <CardDescription>
            Obrigado por assinar nosso serviço
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {loading ? (
            <p>Verificando sua assinatura...</p>
          ) : subscription ? (
            <div className="space-y-2">
              <p className="font-medium">Você agora tem acesso ao plano {subscription.productName}</p>
              <p className="text-sm text-gray-500">
                Sua assinatura será renovada automaticamente em {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ) : (
            <p>Sua assinatura ainda está sendo processada. Isso pode levar alguns minutos.</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link to="/index">Ir para o Dashboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
