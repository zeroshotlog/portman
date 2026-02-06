import { useState } from "react";
import { open } from "@tauri-apps/plugin-shell";
import type { EnrichedListener, SetLabelArgs } from "../types";
import { TypeBadge } from "./TypeBadge";
import { LabelEditor } from "./LabelEditor";
import { ConfirmDialog } from "./ConfirmDialog";

interface Props {
  listeners: EnrichedListener[];
  onSetLabel: (args: SetLabelArgs) => Promise<void>;
  onRemoveLabel: (keyType: string, keyValue: string) => Promise<void>;
}

export function ListenerTable({ listeners, onSetLabel, onRemoveLabel }: Props) {
  const [editingPort, setEditingPort] = useState<number | null>(null);
  const [removingItem, setRemovingItem] = useState<EnrichedListener | null>(null);

  return (
    <table className="w-full table-fixed text-left" style={{ borderCollapse: "collapse" }}>
      <thead
        className="sticky top-0 z-10"
        style={{
          backgroundColor: "var(--bg-secondary)",
          boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)",
        }}
      >
        <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
          <th scope="col" className="w-20 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-tight" style={{ color: "var(--text-muted)" }}>
            Port
          </th>
          <th scope="col" className="w-32 px-4 py-2 text-[11px] font-bold uppercase tracking-tight" style={{ color: "var(--text-muted)" }}>
            Process
          </th>
          <th scope="col" className="w-32 px-4 py-2 text-center text-[11px] font-bold uppercase tracking-tight" style={{ color: "var(--text-muted)" }}>
            Type
          </th>
          <th scope="col" className="px-4 py-2 text-[11px] font-bold uppercase tracking-tight" style={{ color: "var(--text-muted)" }}>
            Label
          </th>
          <th scope="col" className="w-20 px-4 py-2 text-right font-mono text-[11px] font-bold uppercase tracking-tight" style={{ color: "var(--text-muted)" }}>
            PID
          </th>
        </tr>
      </thead>
      <tbody>
        {listeners.map((item) => (
          <tr
            key={`${item.listener.port}-${item.listener.pid}`}
            className="group transition-colors"
            style={{ borderBottom: "1px solid var(--border-light)" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-tertiary)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ""}
          >
            {/* Port */}
            <td className="px-4 py-2">
              <button
                onClick={() => open(item.listener.url)}
                className="font-mono text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ color: "var(--accent)" }}
                title={`Open ${item.listener.url}`}
              >
                {item.listener.port}
              </button>
            </td>

            {/* Process */}
            <td className="px-4 py-2">
              <span className="block truncate text-sm" style={{ color: "var(--text-secondary)" }}>
                {item.listener.process ?? "-"}
              </span>
            </td>

            {/* Type */}
            <td className="px-4 py-2 text-center">
              <TypeBadge type={item.listener.inferred_type} />
            </td>

            {/* Label */}
            <td className="px-4 py-2">
              {editingPort === item.listener.port ? (
                <LabelEditor
                  port={item.listener.port}
                  initialName={item.label?.name}
                  initialNote={item.label?.note ?? undefined}
                  onSave={(args) => onSetLabel(args)}
                  onCancel={() => setEditingPort(null)}
                />
              ) : item.label ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm" style={{ color: "var(--text-label)" }}>
                    <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                      {item.label.name}
                    </span>
                    {item.label.note && <> / {item.label.note}</>}
                  </span>
                  <button
                    onClick={() => setEditingPort(item.listener.port)}
                    className="invisible text-xs group-hover:visible group-focus-within:visible"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setRemovingItem(item)}
                    className="invisible text-xs group-hover:visible group-focus-within:visible"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <div>
                  <span
                    className="text-sm italic group-hover:hidden group-focus-within:hidden"
                    style={{ color: "var(--text-label)" }}
                  >
                    No Label
                  </span>
                  <button
                    onClick={() => setEditingPort(item.listener.port)}
                    className="hidden text-xs group-hover:inline group-focus-within:inline"
                    style={{ color: "var(--text-muted)" }}
                  >
                    + Add label
                  </button>
                </div>
              )}
            </td>

            {/* PID */}
            <td className="px-4 py-2 text-right">
              <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                {item.listener.pid ?? "-"}
              </span>
            </td>
          </tr>
        ))}
      </tbody>

      {removingItem && (
        <ConfirmDialog
          title="Delete Label"
          message={`Remove label "${removingItem.label?.name}" from port ${removingItem.listener.port}?`}
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            onRemoveLabel("Port", String(removingItem.listener.port));
            setRemovingItem(null);
          }}
          onCancel={() => setRemovingItem(null)}
        />
      )}
    </table>
  );
}
