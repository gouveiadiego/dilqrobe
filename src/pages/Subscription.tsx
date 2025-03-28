
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Check } from "lucide-react";
import { Link } from "react-router-dom";

interface PriceTier {
  id: string;
  name: string;
  price: string;
  features: string[];
}

const priceTiers: PriceTier[] = [
  {
    id: "pro",
    name: "Pro",
    price: "R$ 19,90/mês",
    features: [
      "Gerenciamento completo de tarefas",
      "Projetos ilimitados",
      "Acesso a todos os recursos premium",
      "Suporte prioritário via chat",
      "Sem anúncios",
      "Recursos de produtividade avançados",
      "Relatórios detalhados de progresso",
      "Integração com outros aplicativos",
    ],
  },
];

export default function Subscription() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Plano Premium</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Desbloqueie todo o potencial do sistema com nosso plano Pro
        </p>
      </div>

      <div className="mb-8 rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-amber-500" />
          <div>
            <h3 className="text-lg font-medium">Pagamentos temporariamente indisponíveis</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nosso sistema de pagamentos está em manutenção. Por favor, tente novamente mais tarde.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-lg">
          {priceTiers.map((tier) => (
            <Card 
              key={tier.id} 
              className="overflow-hidden border-2 border-primary shadow-lg"
            >
              <div className="bg-primary px-4 py-1 text-center text-xs font-medium text-primary-foreground">
                RECOMENDADO
              </div>
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription>
                  <span className="mt-2 block text-2xl font-bold">{tier.price}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="bg-muted/50 p-4 text-center">
                <Button asChild variant="outline">
                  <Link to="/dashboard">Voltar ao Dashboard</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tem dúvidas sobre o plano? Entre em contato com nosso suporte.
        </p>
      </div>
    </div>
  );
}
