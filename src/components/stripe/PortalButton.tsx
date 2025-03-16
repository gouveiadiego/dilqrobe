
import { Button } from "@/components/ui/button"
import { createPortalSession } from "@/integrations/stripe/client"
import { useState } from "react"
import { toast } from "sonner"

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

      if (session?.url) {
        window.location.href = session.url
      } else {
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
    >
      {loading ? "Carregando..." : children || "Gerenciar Assinatura"}
    </Button>
  )
}
