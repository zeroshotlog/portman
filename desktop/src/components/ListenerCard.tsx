import { useState } from "react";
import { open } from "@tauri-apps/plugin-shell";
import type { EnrichedListener, SetLabelArgs } from "../types";
import { TypeBadge } from "./TypeBadge";
import { LabelEditor } from "./LabelEditor";
import { ConfirmDialog } from "./ConfirmDialog";

interface Props {
  item: EnrichedListener;
  onSetLabel: (args: SetLabelArgs) => Promise<void>;
  onRemoveLabel: (keyType: string, keyValue: string) => Promise<void>;
}

export function ListenerCard({ item, onSetLabel, onRemoveLabel }: Props) {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  return (
    <div
      className="group flex flex-col rounded-xl p-5 transition-colors"
      style={{
        backgroundColor: "var(--bg-secondary)",
        border: hovered ? "1px solid var(--accent)" : "1px solid var(--border)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header: port + type */}
      <div className="flex items-start justify-between">
        <button
          onClick={() => open(item.listener.url)}
          className="font-mono text-[18px] font-bold transition-opacity hover:opacity-70"
          style={{ color: "var(--accent)" }}
          title={`Open ${item.listener.url}`}
        >
          :{item.listener.port}
        </button>
        <TypeBadge type={item.listener.inferred_type} />
      </div>

      {/* Label */}
      <div className="mt-3 min-h-[36px]">
        {editing ? (
          <LabelEditor
            port={item.listener.port}
            initialName={item.label?.name}
            initialNote={item.label?.note ?? undefined}
            onSave={(args) => onSetLabel(args)}
            onCancel={() => setEditing(false)}
          />
        ) : item.label ? (
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
              {item.label.name}
            </p>
            {item.label.note && (
              <p className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                {item.label.note}
              </p>
            )}
            <div className="mt-1.5 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <button
                onClick={() => setEditing(true)}
                className="text-xs transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                Edit
              </button>
              <button
                onClick={() => setShowRemoveConfirm(true)}
                className="text-xs transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] italic opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            style={{ color: "var(--text-muted)" }}
          >
            No Label
          </button>
        )}
      </div>

      {/* Footer: process + PID */}
      <div className="mt-auto flex items-center justify-between pt-4 text-[11px]">
        <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "var(--success)" }}
          />
          {item.listener.process ?? "-"}
        </span>
        <span className="font-mono" style={{ color: "var(--text-muted)" }}>
          PID: {item.listener.pid ?? "-"}
        </span>
      </div>

      {showRemoveConfirm && (
        <ConfirmDialog
          title="Delete Label"
          message={`Remove label "${item.label?.name}" from port ${item.listener.port}?`}
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            onRemoveLabel("Port", String(item.listener.port));
            setShowRemoveConfirm(false);
          }}
          onCancel={() => setShowRemoveConfirm(false)}
        />
      )}
    </div>
  );
}
