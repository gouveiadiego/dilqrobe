
import { useEffect, useState } from "react";

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if dark mode is already enabled
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = (enabled: boolean) => {
    setIsDarkMode(enabled);
    document.documentElement.classList.toggle('dark', enabled);
    localStorage.setItem('theme', enabled ? 'dark' : 'light');
  };

  return { isDarkMode, toggleDarkMode };
}
