type ViewMode = "list" | "grid";

interface Props {
  tab: "ports" | "find";
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function Toolbar({ tab, viewMode, onViewModeChange, searchQuery, onSearchChange, onRefresh, loading }: Props) {
  return (
    <div
      className="flex h-12 shrink-0 items-center justify-between px-4"
      style={{
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {tab === "ports" ? "Active Listeners" : "Find Free Ports"}
        </h1>
        {tab === "ports" && loading && (
          <span
            className="rounded px-1.5 py-0.5 text-[10px]"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              color: "var(--text-label)",
            }}
          >
            REFRESHING
          </span>
        )}
      </div>

      {tab === "ports" && (
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <SearchInputIcon />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter ports, processes or labels..."
              className="h-8 w-56 rounded-md pl-8 pr-3 text-xs outline-none"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* View toggle */}
          <div className="flex overflow-hidden rounded-md" style={{ border: "1px solid var(--border)" }}>
            <ViewToggleBtn active={viewMode === "list"} onClick={() => onViewModeChange("list")} title="List view">
              <ListIcon />
            </ViewToggleBtn>
            <ViewToggleBtn active={viewMode === "grid"} onClick={() => onViewModeChange("grid")} title="Grid view" borderLeft>
              <GridIcon />
            </ViewToggleBtn>
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            style={{ border: "1px solid var(--border)", color: "var(--text-label)" }}
            title="Refresh"
          >
            <RefreshIcon />
          </button>
        </div>
      )}
    </div>
  );
}

function ViewToggleBtn({ active, onClick, title, borderLeft, children }: {
  active: boolean; onClick: () => void; title: string; borderLeft?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-8 w-9 items-center justify-center transition-colors"
      style={{
        backgroundColor: active ? "var(--accent-soft)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-label)",
        borderLeft: borderLeft ? "1px solid var(--border)" : undefined,
      }}
      title={title}
    >
      {children}
    </button>
  );
}

function SearchInputIcon() {
  return (
    <svg
      width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      className="absolute left-2.5 top-1/2 -translate-y-1/2"
      style={{ color: "var(--text-muted)" }}
    >
      <circle cx="7" cy="7" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="2" y1="4" x2="14" y2="4" />
      <line x1="2" y1="8" x2="14" y2="8" />
      <line x1="2" y1="12" x2="14" y2="12" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 8a5.5 5.5 0 0 1 9.5-3.5" />
      <path d="M13.5 8a5.5 5.5 0 0 1-9.5 3.5" />
      <polyline points="12 1 12 4.5 8.5 4.5" />
      <polyline points="4 15 4 11.5 7.5 11.5" />
    </svg>
  );
}
