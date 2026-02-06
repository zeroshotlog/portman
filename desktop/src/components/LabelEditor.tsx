import { useState } from "react";
import type { SetLabelArgs } from "../types";

interface Props {
  port: number;
  initialName?: string;
  initialNote?: string;
  onSave: (args: SetLabelArgs) => Promise<void>;
  onCancel: () => void;
}

export function LabelEditor({ port, initialName, initialNote, onSave, onCancel }: Props) {
  const [name, setName] = useState(initialName ?? "");
  const [note, setNote] = useState(initialNote ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        key_type: "Port",
        key_value: String(port),
        name: name.trim(),
        note: note.trim() || null,
      });
      setSaved(true);
      setTimeout(() => onCancel(), 500);
    } catch {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      {saved ? (
        <span
          className="flex h-7 items-center gap-1 text-[12px] font-medium"
          style={{ color: "var(--success)" }}
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
          </svg>
          Saved
        </span>
      ) : (
        <>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Label name"
            autoFocus
            className="h-7 min-w-[100px] max-w-[160px] flex-1 rounded-md px-2 text-[12px] outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="h-7 min-w-[100px] max-w-[160px] flex-1 rounded-md px-2 text-[12px] outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="h-7 shrink-0 rounded-md px-3 text-[11px] font-medium text-white disabled:opacity-40"
            style={{ backgroundColor: "var(--accent)" }}
          >
            {saving ? "..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-7 shrink-0 rounded-md px-2 text-[11px]"
            style={{ color: "var(--text-muted)" }}
          >
            Cancel
          </button>
        </>
      )}
    </form>
  );
}
