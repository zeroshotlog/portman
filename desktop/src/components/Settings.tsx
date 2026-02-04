import { useEffect } from "react";
import { useThemeContext } from "../contexts/ThemeContext";
import type { ThemePreference } from "../hooks/useTheme";

interface Props {
  onClose: () => void;
}

const options: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "System" },
];

export function Settings({ onClose }: Props) {
  const { preference, setPreference } = useThemeContext();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-80 rounded-xl p-6"
        style={{
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md text-xs transition-colors"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div>
          <h3
            className="mb-3 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Appearance
          </h3>
          <div
            className="flex overflow-hidden rounded-lg"
            style={{ border: "1px solid var(--border)" }}
          >
            {options.map((opt, i) => (
              <button
                key={opt.value}
                onClick={() => setPreference(opt.value)}
                className="flex-1 py-2 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: preference === opt.value ? "var(--accent-soft)" : "transparent",
                  color: preference === opt.value ? "var(--accent)" : "var(--text-secondary)",
                  borderLeft: i > 0 ? "1px solid var(--border)" : undefined,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
