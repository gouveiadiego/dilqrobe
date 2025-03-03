
import { toast as sonnerToast, type ExternalToast } from "sonner";

type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
};

export function toast(props: ToastProps): { id: string };
export function toast(message: string): void;
export function toast(props: ToastProps | string) {
  if (typeof props === 'string') {
    sonnerToast(props);
    return;
  }

  const { title, description, action, variant, duration } = props;
  
  sonnerToast(title || "", {
    description,
    action,
    duration,
    ...(variant === "destructive" ? { type: "error" as any } : {}),
  });
  
  return { id: crypto.randomUUID() };
}

// Add specific toast types
toast.error = (message: string) => {
  sonnerToast.error(message);
};

toast.success = (message: string) => {
  sonnerToast.success(message);
};

toast.info = (message: string) => {
  sonnerToast(message);
};

export function useToast() {
  const toasts: ToastProps[] = [];
  
  return {
    toast,
    toasts,
  };
}
