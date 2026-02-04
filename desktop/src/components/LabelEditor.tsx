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
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Label name"
        autoFocus
        className="h-7 rounded-md px-2 text-[12px] outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
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
        className="h-7 rounded-md px-2 text-[12px] outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
        style={{
          backgroundColor: "var(--bg-tertiary)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
        }}
      />
      <button
        type="submit"
        disabled={!name.trim() || saving}
        className="h-7 rounded-md px-3 text-[11px] font-medium text-white disabled:opacity-40"
        style={{ backgroundColor: "var(--accent)" }}
      >
        {saving ? "..." : "Save"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="h-7 rounded-md px-2 text-[11px]"
        style={{ color: "var(--text-muted)" }}
      >
        Cancel
      </button>
    </form>
  );
}
