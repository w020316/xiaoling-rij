"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Theme, DEFAULT_THEME } from "@/lib/themes";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // 惰性初始化：首次渲染即从 localStorage 读取，避免 mount 后才切换导致的二次闪烁。
  // 注意：layout.tsx 的内联脚本已保证 <html> className 在 hydrate 前就正确，
  // 这里只需让 React state 与之一致即可。
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return DEFAULT_THEME;
    return (localStorage.getItem("xiaolin-diary-theme") as Theme) || DEFAULT_THEME;
  });

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem("xiaolin-diary-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
