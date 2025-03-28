
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { toast } from "sonner"

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Show a success toast
    toast.success("Pagamento confirmado! Redirecionando para o dashboard...");

    // Immediately redirect to the dashboard
    navigate('/dashboard', { replace: true });
    
    // No timeout needed - redirect immediately
  }, [navigate]);

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-[420px]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Pagamento Confirmado!</CardTitle>
          <CardDescription>
            Seu pagamento foi processado com sucesso
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 items-center">
          <p className="text-center text-sm text-muted-foreground mb-2">
            Redirecionando para o dashboard...
          </p>
          <Button asChild className="w-full">
            <Link to="/dashboard">Ir para o Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
