
import { Button } from "@/components/ui/button"
import { createPortalSession } from "@/integrations/stripe/client"
import { useState } from "react"
import { toast } from "sonner"

interface PortalButtonProps {
  customerId?: string
  children?: React.ReactNode
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null | undefined
  cancelMode?: boolean
  size?: "default" | "sm" | "lg" | "icon" | string
}

export function PortalButton({ 
  customerId, 
  children, 
  className,
  variant = "default",
  cancelMode = false,
  size
}: PortalButtonProps) {
  const [loading, setLoading] = useState(false)

  const handlePortal = async () => {
    if (!customerId) {
      console.error('Customer ID is required')
      toast.error("ID do cliente é necessário para acessar o portal")
      return
    }

    try {
      setLoading(true)
      
      // When in cancel mode, set returnUrl to the subscription page
      // This way, after cancellation they'll be redirected back to manage their subscription
      const returnUrl = `${window.location.origin}${cancelMode ? '/subscription' : '/dashboard'}`
      
      const response = await createPortalSession({
        customerId,
        returnUrl,
      })

      if (response?.error) {
        console.error('Error response:', response.error)
        toast.error(response.error === 'Stripe is not configured' 
          ? "Sistema de pagamento não configurado" 
          : "Não foi possível acessar o portal de gerenciamento")
        return
      }

      if (response?.url) {
        window.location.href = response.url
      } else {
        console.error('No URL returned from portal session')
        toast.error("Não foi possível acessar o portal de gerenciamento")
      }
    } catch (error) {
      console.error('Error redirecting to portal:', error)
      toast.error("Erro ao acessar o portal de gerenciamento")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handlePortal} 
      disabled={loading || !customerId}
      className={className}
      variant={variant}
      size={size}
    >
      {loading ? "Carregando..." : children || (cancelMode ? "Cancelar Assinatura" : "Gerenciar Assinatura")}
    </Button>
  )
}
