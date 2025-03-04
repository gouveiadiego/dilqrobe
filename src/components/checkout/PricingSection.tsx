
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { CheckoutForm } from "./CheckoutForm";

// Define the pricing plans
const pricingPlans = [
  {
    id: "basic",
    name: "Básico",
    price: "R$ 9,90",
    description: "Para quem está começando",
    priceId: "price_1Oxgh8ImO1HWK8eHnJuEtv4r", // Replace with your actual Stripe Price ID
    features: [
      "Acesso a todos os módulos básicos",
      "Acompanhamento semanal",
      "Suporte por email"
    ]
  },
  {
    id: "pro",
    name: "Profissional",
    price: "R$ 29,90",
    description: "Para profissionais",
    priceId: "price_1OxgiUImO1HWK8eHYQvO3Dsp", // Replace with your actual Stripe Price ID
    features: [
      "Tudo do plano básico",
      "Módulos avançados",
      "Suporte prioritário",
      "Acesso a comunidade exclusiva",
      "Consultas mensais"
    ],
    popular: true
  }
];

export function PricingSection() {
  return (
    <div className="container py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Escolha o melhor plano para você
        </h2>
        <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-3xl mx-auto">
          Invista no seu futuro com nossos planos de assinatura. Cancele a qualquer momento.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {pricingPlans.map((plan) => (
          <Card key={plan.id} className={`relative overflow-hidden ${plan.popular ? 'border-purple-500 shadow-lg' : 'border-gray-200'}`}>
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                Popular
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">/mês</span>
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter>
              <CheckoutForm priceId={plan.priceId} productName={plan.name} />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
