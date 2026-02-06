import { useState, useMemo, useEffect, useRef } from "react";
import { ListenerTable } from "./components/ListenerTable";
import { ListenerGrid } from "./components/ListenerGrid";
import { FreePortFinder } from "./components/FreePortFinder";
import { Sidebar } from "./components/Sidebar";
import { Toolbar } from "./components/Toolbar";
import { StatusBar } from "./components/StatusBar";
import { Settings } from "./components/Settings";
import { useListeners, useLabels } from "./hooks/usePortman";
import { useThemeContext } from "./contexts/ThemeContext";
import type { EnrichedListener } from "./types";

type Tab = "ports" | "find";
type Filter = "all" | "labeled" | "unlabeled";
type ViewMode = "list" | "grid";

function dedup(items: EnrichedListener[]): EnrichedListener[] {
  const seen = new Map<number, EnrichedListener>();
  for (const item of items) {
    if (!seen.has(item.listener.port)) {
      seen.set(item.listener.port, item);
    }
  }
  return Array.from(seen.values());
}

function App() {
  const [tab, setTab] = useState<Tab>("ports");
  const [filter, setFilter] = useState<Filter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const { listeners, loading, error, refresh, scanTimeMs } = useListeners();
  const { setLabel, removeLabel } = useLabels();
  const { setPreference } = useThemeContext();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Menu event listeners
  useEffect(() => {
    const onRefresh = () => refresh();
    const onSetView = (e: Event) => setViewMode((e as CustomEvent).detail);
    const onFocusSearch = () => searchInputRef.current?.focus();
    const onOpenSettings = () => setShowSettings(true);
    const onSetTheme = (e: Event) => setPreference((e as CustomEvent).detail);

    window.addEventListener("portman:refresh", onRefresh);
    window.addEventListener("portman:set-view", onSetView);
    window.addEventListener("portman:focus-search", onFocusSearch);
    window.addEventListener("portman:open-settings", onOpenSettings);
    window.addEventListener("portman:set-theme", onSetTheme);

    return () => {
      window.removeEventListener("portman:refresh", onRefresh);
      window.removeEventListener("portman:set-view", onSetView);
      window.removeEventListener("portman:focus-search", onFocusSearch);
      window.removeEventListener("portman:open-settings", onOpenSettings);
      window.removeEventListener("portman:set-theme", onSetTheme);
    };
  }, [refresh, setPreference]);

  const unique = useMemo(() => dedup(listeners), [listeners]);

  const counts = useMemo(() => ({
    all: unique.length,
    labeled: unique.filter((i) => i.label !== null).length,
    unlabeled: unique.filter((i) => i.label === null).length,
  }), [unique]);

  const processed = useMemo(() => {
    let items = unique;
    if (filter === "labeled") items = items.filter((i) => i.label !== null);
    if (filter === "unlabeled") items = items.filter((i) => i.label === null);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) =>
        String(i.listener.port).includes(q) ||
        (i.listener.process?.toLowerCase().includes(q) ?? false) ||
        (i.label?.name.toLowerCase().includes(q) ?? false) ||
        (i.label?.note?.toLowerCase().includes(q) ?? false) ||
        (i.listener.inferred_type?.toLowerCase().includes(q) ?? false)
      );
    }
    return [...items].sort((a, b) => {
      if (a.label && !b.label) return -1;
      if (!a.label && b.label) return 1;
      return a.listener.port - b.listener.port;
    });
  }, [unique, filter, searchQuery]);

  return (
    <div className="flex h-screen flex-col" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Title bar drag region (macOS overlay) */}
      <div
        data-tauri-drag-region
        className="flex h-10 shrink-0 items-center justify-center select-none"
        style={{
          backgroundColor: "var(--bg-tertiary)",
          borderBottom: "1px solid var(--border-strong)",
        }}
      >
        <span
          className="text-sm font-medium"
          style={{ color: "var(--text-secondary)" }}
          data-tauri-drag-region
        >
          Portman
        </span>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={tab}
          onTabChange={setTab}
          filter={filter}
          onFilterChange={setFilter}
          counts={counts}
          listenerCount={unique.length}
        />

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden" style={{ backgroundColor: "var(--bg-secondary)" }}>
          <Toolbar
            tab={tab}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onRefresh={refresh}
            loading={loading}
            searchInputRef={searchInputRef}
          />

          <div className="min-h-0 flex-1 overflow-auto">
            {tab === "ports" ? (
              loading && listeners.length === 0 ? (
                <div className="flex h-full items-center justify-center" aria-live="polite">
                  <div className="flex items-center gap-3">
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5 animate-spin"
                      style={{ color: "var(--text-muted)" }}
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>Scanning ports...</span>
                  </div>
                </div>
              ) : processed.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <svg
                    aria-hidden="true"
                    className="h-12 w-12"
                    style={{ color: "var(--text-muted)", opacity: 0.5 }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {searchQuery ? "No matching ports found" : "No active ports detected"}
                  </span>
                </div>
              ) : viewMode === "list" ? (
                <ListenerTable
                  listeners={processed}
                  onSetLabel={setLabel}
                  onRemoveLabel={removeLabel}
                />
              ) : (
                <ListenerGrid
                  listeners={processed}
                  onSetLabel={setLabel}
                  onRemoveLabel={removeLabel}
                />
              )
            ) : (
              <FreePortFinder />
            )}
          </div>
        </main>
      </div>

      <StatusBar scanTimeMs={scanTimeMs} error={error} />

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default App;
