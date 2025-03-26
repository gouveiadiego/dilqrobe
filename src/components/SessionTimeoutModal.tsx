
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface SessionTimeoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SessionTimeoutModal({ isOpen, onClose }: SessionTimeoutModalProps) {
  const navigate = useNavigate();

  const handleLogin = () => {
    onClose();
    navigate("/login", { replace: true });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-5 w-5 text-yellow-500" />
            Sessão Expirada
          </DialogTitle>
          <DialogDescription>
            Por segurança, sua sessão foi encerrada após inatividade.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-center text-gray-700 dark:text-gray-300">
            Para continuar usando o sistema, é necessário fazer login novamente.
          </p>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleLogin}
            className="w-full"
          >
            Retornar à Tela de Login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
