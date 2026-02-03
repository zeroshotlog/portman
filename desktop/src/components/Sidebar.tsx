import { useThemeContext } from "../contexts/ThemeContext";

type Tab = "ports" | "find";
type Filter = "all" | "labeled" | "unlabeled";

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
  counts: { all: number; labeled: number; unlabeled: number };
  listenerCount: number;
}

export function Sidebar({ activeTab, onTabChange, filter, onFilterChange, counts, listenerCount }: Props) {
  const { theme, toggleTheme } = useThemeContext();

  return (
    <aside
      className="flex w-56 shrink-0 flex-col gap-6 p-3"
      style={{ backgroundColor: "var(--bg-sidebar)", borderRight: "1px solid var(--border)" }}
    >
      {/* Navigation */}
      <div>
        <h3
          className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Main
        </h3>
        <nav className="space-y-1">
          <NavItem
            active={activeTab === "ports"}
            onClick={() => onTabChange("ports")}
            icon={<PortsIcon />}
            label="Active Ports"
          />
          <NavItem
            active={activeTab === "find"}
            onClick={() => onTabChange("find")}
            icon={<SearchIcon />}
            label="Find Free"
          />
        </nav>
      </div>

      {/* Filters (ports tab only) */}
      {activeTab === "ports" && (
        <div>
          <h3
            className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Filters
          </h3>
          <div className="space-y-1">
            <FilterItem active={filter === "all"} onClick={() => onFilterChange("all")} label="All" count={counts.all} />
            <FilterItem active={filter === "labeled"} onClick={() => onFilterChange("labeled")} label="Labeled" count={counts.labeled} />
            <FilterItem active={filter === "unlabeled"} onClick={() => onFilterChange("unlabeled")} label="Unlabeled" count={counts.unlabeled} />
          </div>
        </div>
      )}

      {/* Quick Stats — pushed to bottom */}
      <div className="mt-auto">
        <div className="rounded-lg px-3 py-4" style={{ backgroundColor: "var(--stats-bg)" }}>
          <p className="text-[11px]" style={{ color: "var(--text-label)" }}>Quick Stats</p>
          <div className="mt-2 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
            {listenerCount} listeners detected
          </div>
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: "var(--stats-bar)" }}
          >
            <div
              className="h-1.5 rounded-full"
              style={{ backgroundColor: "var(--success)", width: "65%" }}
            />
          </div>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="mt-3 flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
      </div>
    </aside>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors"
      style={active ? {
        backgroundColor: "var(--accent-soft)",
        color: "var(--accent)",
        fontWeight: 500,
      } : {
        color: "var(--text-secondary)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function FilterItem({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between px-3 py-1.5 text-sm transition-colors"
      style={{ color: "var(--text-secondary)" }}
    >
      <span className="flex items-center gap-2">
        <span
          className="inline-flex h-4 w-4 items-center justify-center rounded"
          style={active ? {
            backgroundColor: "var(--accent)",
            color: "#fff",
          } : {
            border: "1.5px solid var(--border-strong)",
            borderRadius: "4px",
          }}
        >
          {active && (
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="2 6 5 9 10 3" />
            </svg>
          )}
        </span>
        {label}
      </span>
      <span className="font-mono text-xs" style={{ opacity: 0.6 }}>
        {count}
      </span>
    </button>
  );
}

function PortsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <line x1="12" y1="3" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="21" />
      <line x1="3" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="10.5" cy="10.5" r="7" />
      <line x1="16" y1="16" x2="21" y2="21" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 8.5a5.5 5.5 0 0 1-7-7 5.5 5.5 0 1 0 7 7z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="3" />
      <line x1="8" y1="1" x2="8" y2="3" />
      <line x1="8" y1="13" x2="8" y2="15" />
      <line x1="1" y1="8" x2="3" y2="8" />
      <line x1="13" y1="8" x2="15" y2="8" />
      <line x1="3.05" y1="3.05" x2="4.46" y2="4.46" />
      <line x1="11.54" y1="11.54" x2="12.95" y2="12.95" />
      <line x1="3.05" y1="12.95" x2="4.46" y2="11.54" />
      <line x1="11.54" y1="4.46" x2="12.95" y2="3.05" />
    </svg>
  );
}
