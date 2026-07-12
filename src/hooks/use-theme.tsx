import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type Ctx = { theme: Theme; setTheme: (t: Theme) => void; resolved: "light" | "dark" };

const ThemeCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "abroad-compass-theme";

function applyTheme(t: Theme): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const resolved: "light" | "dark" =
    t === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : t;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  return resolved;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolved, setResolved] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const t = getInitialTheme();
    return t === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : t;
  });

  useEffect(() => {
    const t = getInitialTheme();
    setThemeState(t);
    setResolved(applyTheme(t));

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const currentT = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "light";
      if (currentT === "system") setResolved(applyTheme("system"));
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
    setResolved(applyTheme(t));
  }, []);

  return <ThemeCtx.Provider value={{ theme, setTheme, resolved }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme outside ThemeProvider");
  return ctx;
}
