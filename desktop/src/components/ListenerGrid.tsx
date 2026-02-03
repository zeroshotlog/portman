import type { EnrichedListener, SetLabelArgs } from "../types";
import { ListenerCard } from "./ListenerCard";

interface Props {
  listeners: EnrichedListener[];
  onSetLabel: (args: SetLabelArgs) => Promise<void>;
  onRemoveLabel: (keyType: string, keyValue: string) => Promise<void>;
}

export function ListenerGrid({ listeners, onSetLabel, onRemoveLabel }: Props) {
  return (
    <div className="h-full overflow-auto p-5">
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
      >
        {listeners.map((item) => (
          <ListenerCard
            key={`${item.listener.port}-${item.listener.pid}`}
            item={item}
            onSetLabel={onSetLabel}
            onRemoveLabel={onRemoveLabel}
          />
        ))}
      </div>
    </div>
  );
}
