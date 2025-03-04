
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  // Our current useToast hook returns { toast } and not { toasts }
  // Since we're using sonner directly in our app through the Toaster component from sonner,
  // we can simplify this component to just render a basic toast container
  
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  )
}
