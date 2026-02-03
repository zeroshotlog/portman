interface Props {
  scanTimeMs: number | null;
  error: string | null;
}

export function StatusBar({ scanTimeMs, error }: Props) {
  return (
    <footer
      className="flex h-8 shrink-0 items-center justify-between px-4"
      style={{
        backgroundColor: "var(--bg-sidebar)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-2">
        {error ? (
          <>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--danger)" }} />
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-label)" }}>
              Error
            </span>
          </>
        ) : (
          <>
            <span className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: "var(--success)" }} />
            <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-label)" }}>
              Engine Active
            </span>
          </>
        )}
      </div>
      {scanTimeMs !== null && (
        <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
          SCAN COMPLETE: {(scanTimeMs / 1000).toFixed(2)}s
        </span>
      )}
    </footer>
  );
}
