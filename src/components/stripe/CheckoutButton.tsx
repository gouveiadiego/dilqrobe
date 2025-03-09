import { Button } from "@/components/ui/button"
import { createCheckoutSession } from "@/integrations/stripe/client"
import { useState } from "react"

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
      const session = await createCheckoutSession({
        priceId,
        customerId,
        successUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/canceled`,
      })

      if (session.url) {
        window.location.href = session.url
      }
    } catch (error) {
      console.error('Error during checkout:', error)
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