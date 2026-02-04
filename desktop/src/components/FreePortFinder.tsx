import { useState } from "react";
import { useFreePorts } from "../hooks/usePortman";

export function FreePortFinder() {
  const { ports, search } = useFreePorts();
  const [rangeStart, setRangeStart] = useState(3000);
  const [rangeEnd, setRangeEnd] = useState(8000);
  const [count, setCount] = useState(10);
  const [copied, setCopied] = useState<number | null>(null);

  const handleSearch = () => search(rangeStart, rangeEnd, count);

  const copyPort = async (port: number) => {
    await navigator.clipboard.writeText(String(port));
    setCopied(port);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="flex h-full flex-col overflow-auto p-6">
      {/* Search form */}
      <div className="flex items-end gap-4">
        <div>
          <label
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Start Port
          </label>
          <input
            type="number"
            value={rangeStart}
            onChange={(e) => setRangeStart(Number(e.target.value))}
            className="h-9 w-28 rounded-lg px-3 text-[13px] outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            End Port
          </label>
          <input
            type="number"
            value={rangeEnd}
            onChange={(e) => setRangeEnd(Number(e.target.value))}
            className="h-9 w-28 rounded-lg px-3 text-[13px] outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Count
          </label>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="h-9 w-20 rounded-lg px-2 text-[13px] outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)]"
            style={{
              backgroundColor: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <button
          onClick={handleSearch}
          className="h-9 rounded-lg px-5 text-[13px] font-medium text-white transition-colors"
          style={{ backgroundColor: "var(--accent)" }}
        >
          Search Available
        </button>
      </div>

      {/* Results */}
      {ports.length > 0 && (
        <div className="mt-6">
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Available Ports Found
          </p>
          <div className="grid grid-cols-5 gap-3">
            {ports.map((port) => (
              <button
                key={port}
                onClick={() => copyPort(port)}
                className="flex flex-col items-center gap-1.5 rounded-xl px-4 py-5 transition-colors"
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  className="font-mono text-[20px] font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {port}
                </span>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: copied === port ? "var(--accent)" : "var(--success)" }}
                >
                  {copied === port ? "Copied!" : "Available"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {ports.length === 0 && (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <div className="mb-3 text-3xl opacity-20" style={{ color: "var(--text-muted)" }}>@</div>
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            Scan results will appear here
          </p>
        </div>
      )}
    </div>
  );
}
