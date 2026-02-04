import { useThemeContext } from "../contexts/ThemeContext";

const TYPE_STYLES: Record<string, { bg: string; color: string; border: string; darkBg: string; darkColor: string; darkBorder: string }> = {
  "react/next": { bg: "#cffafe", color: "#0e7490", border: "#a5f3fc", darkBg: "rgba(8,145,178,0.25)",  darkColor: "#67e8f9", darkBorder: "rgba(8,145,178,0.4)" },
  vite:         { bg: "#f3e8ff", color: "#7e22ce", border: "#e9d5ff", darkBg: "rgba(126,34,206,0.25)", darkColor: "#d8b4fe", darkBorder: "rgba(126,34,206,0.4)" },
  node:         { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0", darkBg: "rgba(21,128,61,0.25)",  darkColor: "#86efac", darkBorder: "rgba(21,128,61,0.4)" },
  python:       { bg: "#fef3c7", color: "#b45309", border: "#fde68a", darkBg: "rgba(180,83,9,0.25)",   darkColor: "#fcd34d", darkBorder: "rgba(180,83,9,0.4)" },
  "http-server":{ bg: "#fef3c7", color: "#b45309", border: "#fde68a", darkBg: "rgba(180,83,9,0.25)",   darkColor: "#fcd34d", darkBorder: "rgba(180,83,9,0.4)" },
  postgres:     { bg: "#d1fae5", color: "#047857", border: "#a7f3d0", darkBg: "rgba(4,120,87,0.25)",   darkColor: "#6ee7b7", darkBorder: "rgba(4,120,87,0.4)" },
  redis:        { bg: "#fee2e2", color: "#b91c1c", border: "#fecaca", darkBg: "rgba(185,28,28,0.25)",  darkColor: "#fca5a5", darkBorder: "rgba(185,28,28,0.4)" },
  mysql:        { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe", darkBg: "rgba(29,78,216,0.25)",  darkColor: "#93c5fd", darkBorder: "rgba(29,78,216,0.4)" },
  docker:       { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd", darkBg: "rgba(3,105,161,0.25)",  darkColor: "#7dd3fc", darkBorder: "rgba(3,105,161,0.4)" },
  worker:       { bg: "#e0e7ff", color: "#4338ca", border: "#c7d2fe", darkBg: "rgba(67,56,202,0.25)",  darkColor: "#a5b4fc", darkBorder: "rgba(67,56,202,0.4)" },
  app:          { bg: "#f4f4f5", color: "#71717a", border: "#e4e4e7", darkBg: "rgba(63,63,70,0.3)",    darkColor: "#a1a1aa", darkBorder: "rgba(63,63,70,0.5)" },
  system:       { bg: "#f4f4f5", color: "#71717a", border: "#e4e4e7", darkBg: "rgba(63,63,70,0.3)",    darkColor: "#a1a1aa", darkBorder: "rgba(63,63,70,0.5)" },
};

const FALLBACK = { bg: "#f4f4f5", color: "#71717a", border: "#e4e4e7", darkBg: "rgba(63,63,70,0.3)", darkColor: "#a1a1aa", darkBorder: "rgba(63,63,70,0.5)" };

export function TypeBadge({ type }: { type: string | null }) {
  const { theme } = useThemeContext();
  if (!type) return null;
  const s = TYPE_STYLES[type] ?? FALLBACK;
  const isDark = theme === "dark";

  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{
        backgroundColor: isDark ? s.darkBg : s.bg,
        color: isDark ? s.darkColor : s.color,
        border: `1px solid ${isDark ? s.darkBorder : s.border}`,
      }}
    >
      {type}
    </span>
  );
}
