import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

export type Theme = "light" | "dark";

/** テーマを localStorage に保存し、<html data-theme> に反映する。 */
export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>("theme", "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggle = () => setTheme(theme === "light" ? "dark" : "light");

  return { theme, toggle };
}
