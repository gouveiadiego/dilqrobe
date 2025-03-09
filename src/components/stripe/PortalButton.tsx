import { Button } from "@/components/ui/button"
import { createPortalSession } from "@/integrations/stripe/client"
import { useState } from "react"

interface PortalButtonProps {
  customerId?: string
  children?: React.ReactNode
  className?: string
}

export function PortalButton({ customerId, children, className }: PortalButtonProps) {
  const [loading, setLoading] = useState(false)

  const handlePortal = async () => {
    if (!customerId) {
      console.error('Customer ID is required')
      return
    }

    try {
      setLoading(true)
      const session = await createPortalSession({
        customerId,
        returnUrl: `${window.location.origin}/subscription`,
      })

      if (session.url) {
        window.location.href = session.url
      }
    } catch (error) {
      console.error('Error redirecting to portal:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handlePortal} 
      disabled={loading || !customerId}
      className={className}
    >
      {loading ? "Carregando..." : children || "Gerenciar Assinatura"}
    </Button>
  )
}
