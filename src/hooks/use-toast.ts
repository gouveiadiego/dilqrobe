
import { toast as sonnerToast, type ExternalToast } from "sonner";

type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
};

// Create the base toast object with methods
const toastObject = {
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
  warning: (message: string) => {
    sonnerToast.warning(message);
  },
};

// Create a function that can be called directly with toast props
function toastFunction(props: ToastProps) {
  const { title, description, action, duration, variant } = props;
  
  if (variant === "destructive") {
    return sonnerToast.error(title || "", {
      description,
      action,
      duration,
    });
  } 
  
  return sonnerToast(title || "", {
    description,
    action,
    duration,
  });
}

// Create the toast object by merging the function and the object
export const toast = Object.assign(toastFunction, toastObject);

// Define the toast type with both function call and methods
export type Toast = typeof toast;

export const useToast = () => {
  const toasts: ToastProps[] = [];

  return {
    toast,
    toasts,
  };
};
