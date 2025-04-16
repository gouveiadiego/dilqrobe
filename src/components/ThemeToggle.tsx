
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDarkMode } from "@/hooks/useDarkMode";
import { toast } from "sonner";

interface ThemeToggleProps {
  showLabel?: boolean;
  showToast?: boolean;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ThemeToggle({ 
  showLabel = false, 
  showToast = false,
  variant = "outline",
  size = "default"
}: ThemeToggleProps) {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const handleToggle = () => {
    toggleDarkMode(!isDarkMode);
    if (showToast) {
      toast.success(`${isDarkMode ? 'Modo claro' : 'Modo escuro'} ativado`);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      className="gap-2"
    >
      {isDarkMode ? (
        <>
          <Sun className="h-4 w-4" />
          {showLabel && <span>Modo Claro</span>}
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          {showLabel && <span>Modo Escuro</span>}
        </>
      )}
    </Button>
  );
}
