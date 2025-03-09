import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle } from "lucide-react"
import { Link } from "react-router-dom"

export default function PaymentCanceled() {
  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-[420px]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="w-12 h-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Pagamento Cancelado</CardTitle>
          <CardDescription>
            O processo de pagamento foi cancelado
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link to="/">Voltar ao Início</Link>
          </Button>
          <Button asChild>
            <Link to="/subscription">Tentar Novamente</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}