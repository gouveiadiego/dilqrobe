
import { toast as sonnerToast, type ExternalToast } from "sonner";

type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number; // Added duration property
};

// Export toast functions directly to match how they're called
export const toast = {
  // For plain messages without title/description structure
  error: (message: string) => {
    sonnerToast.error(message);
  },
  success: (message: string) => {
    sonnerToast.success(message);
  },
  info: (message: string) => {
    sonnerToast(message);
  },
  // For structured toast with title and description
  // This allows calling toast({ title: "...", description: "..." })
  __call: (props: ToastProps) => {
    sonnerToast(props.title || "", {
      description: props.description,
      action: props.action,
      duration: props.duration,
      // Map variant to sonner's type - using as any to bypass type checking
      ...(props.variant === "destructive" ? { type: "error" as any } : {})
    });
    return { id: crypto.randomUUID() };
  }
};

// Add call signature to make toast callable as a function
export type Toast = typeof toast & {
  (props: ToastProps): { id: string };
};

// Cast to add the call signature
const callableToast = toast as Toast;
Object.defineProperty(callableToast, "apply", {
  value: function(this: any, _: any, args: any[]) {
    return this.__call(args[0]);
  }
});

export const useToast = () => {
  const toasts: ToastProps[] = [];

  return {
    toast: callableToast,
    toasts,
  };
};
