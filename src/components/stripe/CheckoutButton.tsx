
import { Button } from "@/components/ui/button"
import { createCheckoutSession } from "@/integrations/stripe/client"
import { useState } from "react"
import { toast } from "sonner"

interface CheckoutButtonProps {
  priceId: string
  customerId?: string
  children?: React.ReactNode
  className?: string
}

export function CheckoutButton({ priceId, customerId, children, className }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    try {
      setLoading(true)
      const response = await createCheckoutSession({
        priceId,
        customerId,
        successUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/canceled`,
      })

      if (response?.error) {
        console.error('Error response:', response.error)
        toast.error(response.error === 'Stripe is not configured' 
          ? "Sistema de pagamento não configurado" 
          : "Não foi possível criar a sessão de checkout")
        return
      }

      if (response?.url) {
        window.location.href = response.url
      } else {
        console.error('No URL returned from checkout session')
        toast.error("Não foi possível criar a sessão de checkout")
      }
    } catch (error) {
      console.error('Error during checkout:', error)
      toast.error("Erro ao processar pagamento. Por favor, tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleCheckout} 
      disabled={loading}
      className={className}
    >
      {loading ? "Processando..." : children || "Assinar"}
    </Button>
  )
}
