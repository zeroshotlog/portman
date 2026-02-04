import { useState, useCallback, useEffect } from "react";

export type ThemePreference = "light" | "dark" | "auto";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "portman-theme";

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(pref: ThemePreference): ResolvedTheme {
  return pref === "auto" ? getSystemTheme() : pref;
}

function getInitialPreference(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "auto") return stored;
  return "auto";
}

export function useTheme() {
  const [preference, setPreferenceRaw] = useState<ThemePreference>(getInitialPreference);
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolveTheme(preference));

  // Watch system theme changes (only matters when preference is "auto")
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (preference === "auto") {
        setTheme(getSystemTheme());
      }
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [preference]);

  // Resolve and persist when preference changes
  useEffect(() => {
    setTheme(resolveTheme(preference));
    localStorage.setItem(STORAGE_KEY, preference);
  }, [preference]);

  // Apply to DOM
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Dispatch event for menu sync
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("portman:theme-changed", { detail: preference }));
  }, [preference]);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceRaw(pref);
  }, []);

  return { preference, theme, setPreference } as const;
}
