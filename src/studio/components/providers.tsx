import { createContext, useContext, useState, useLayoutEffect, type ReactNode } from "react";
type Theme = "light" | "dark";
const ThemeContext = createContext({ resolvedTheme: "light" as Theme, setTheme: (_theme: Theme) => {} });
export function Providers({ children }: { children: ReactNode }) {
  const [theme, updateTheme] = useState<Theme>(() => {
    try { return localStorage.getItem("portfolio-studio-theme") === "dark" ? "dark" : "light"; }
    catch { return "light"; }
  });
  useLayoutEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);
  const setTheme = (value: Theme) => {
    updateTheme(value);
    try { localStorage.setItem("portfolio-studio-theme", value); } catch { /* Storage is optional. */ }
  };
  return <ThemeContext.Provider value={{ resolvedTheme: theme, setTheme }}>{children}</ThemeContext.Provider>;
}
// This provider and hook intentionally share one context.
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
