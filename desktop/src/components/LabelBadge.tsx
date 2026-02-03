import type { Label } from "../types";

export function LabelBadge({ label }: { label: Label }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[11px] text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
      <span className="font-medium">{label.name}</span>
      {label.note && (
        <span className="text-blue-500/70 dark:text-blue-400/60">/ {label.note}</span>
      )}
    </span>
  );
}
