import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleCreateCheckout = async (planType: 'monthly' | 'yearly') => {
    try {
      setLoading(true);
      
      // Get the current user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authData.user) {
        toast.error("Você precisa estar logado para prosseguir com a assinatura.");
        
        // Redirect to login page
        // window.location.href = "/login"; // Uncomment when login page is available
        return;
      }

      const userId = authData.user.id;
      
      // Generate the return URL (current origin)
      const returnUrl = window.location.origin;
      
      // Call the create-checkout function
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceType: planType, 
          userId, 
          returnUrl 
        }
      });

      if (error) {
        console.error("Error creating checkout session:", error);
        toast.error("Não foi possível criar a sessão de pagamento.");
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Error:", error);
      toast.error("Ocorreu um erro ao processar sua solicitação.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    "Acesso a todos os recursos",
    "Suporte prioritário",
    "Atualizações gratuitas",
    "Sem anúncios",
    "Recursos exclusivos"
  ];

  return (
    <section id="pricing" className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Planos Simples e Transparentes</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Escolha o plano perfeito para suas necessidades com período de teste gratuito de 3 dias.
          </p>
          
          <div className="flex items-center justify-center mt-8">
            <Label htmlFor="billing-toggle" className="mr-2">Mensal</Label>
            <Switch 
              id="billing-toggle" 
              checked={isAnnual} 
              onCheckedChange={setIsAnnual} 
            />
            <Label htmlFor="billing-toggle" className="ml-2">Anual</Label>
            {isAnnual && (
              <span className="ml-2 inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full dark:bg-green-900 dark:text-green-100">
                Economize 17%
              </span>
            )}
          </div>
        </div>
        
        <div className="max-w-md mx-auto">
          <Card className="relative border-2 dark:border-gray-800 shadow-lg">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 px-3 py-1 bg-blue-500 text-white text-xs rounded-full transform translate-x-2 -translate-y-2 dark:bg-dilq-accent">
              Mais Popular
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Plano Premium</CardTitle>
              <CardDescription>Todos os recursos que você precisa</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-3xl font-bold">
                  {isAnnual ? 'R$190' : 'R$19'}
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                    /{isAnnual ? 'ano' : 'mês'}
                  </span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Com 3 dias de teste grátis
                </p>
              </div>
              
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => handleCreateCheckout(isAnnual ? 'yearly' : 'monthly')}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Teste Grátis
              </Button>
            </CardFooter>
          </Card>
          
          <div className="text-center mt-6">
            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Pagamento seguro via Stripe
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
