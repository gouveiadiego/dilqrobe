
import { toast } from "sonner";

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export const handleApiError = (error: any, customMessage?: string) => {
  console.error('API Error:', error);
  
  let errorMessage = customMessage || 'Ocorreu um erro inesperado';
  
  if (error?.message) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }
  
  toast.error(errorMessage);
  return errorMessage;
};

export const handleSuccess = (message: string) => {
  toast.success(message);
};

export const handleInfo = (message: string) => {
  toast.info(message);
};

export const handleWarning = (message: string) => {
  toast.warning(message);
};
