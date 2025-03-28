
import { Button } from "@/components/ui/button"
import { createStripeCheckout } from "@/integrations/supabase/client"
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
    if (!priceId) {
      toast.error("ID do preço é necessário para checkout");
      return;
    }
    
    try {
      setLoading(true)
      console.log("Iniciando checkout com priceId:", priceId);
      
      const response = await createStripeCheckout(priceId);
      
      if (response?.error) {
        console.error('Error response:', response.error)
        toast.error(response.error === 'Stripe is not configured' 
          ? "Sistema de pagamento não configurado" 
          : "Não foi possível criar a sessão de checkout: " + response.error)
        return
      }

      if (response?.url) {
        console.log("Redirecionando para URL de checkout:", response.url);
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
