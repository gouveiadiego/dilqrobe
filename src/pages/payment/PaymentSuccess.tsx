import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { Link } from "react-router-dom"

export default function PaymentSuccess() {
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
        <CardContent className="flex justify-center">
          <Button asChild>
            <Link to="/dashboard">Ir para o Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}