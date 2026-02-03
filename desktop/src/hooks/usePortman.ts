import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { EnrichedListener, Label, SetLabelArgs } from "../types";

export function useListeners(intervalMs = 5000) {
  const [listeners, setListeners] = useState<EnrichedListener[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scanTimeMs, setScanTimeMs] = useState<number | null>(null);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const start = performance.now();
      const data = await invoke<EnrichedListener[]>("scan_listeners");
      const elapsed = performance.now() - start;
      if (mountedRef.current) {
        setListeners(data);
        setScanTimeMs(elapsed);
        setError(null);
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(String(e));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    const timer = setInterval(refresh, intervalMs);
    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [refresh, intervalMs]);

  return { listeners, loading, error, refresh, scanTimeMs };
}

export function useLabels() {
  const [labels, setLabels] = useState<Label[]>([]);

  const refresh = useCallback(async () => {
    const data = await invoke<Label[]>("get_labels");
    setLabels(data);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setLabel = useCallback(
    async (args: SetLabelArgs) => {
      await invoke("set_label", { args });
      await refresh();
    },
    [refresh],
  );

  const removeLabel = useCallback(
    async (keyType: string, keyValue: string) => {
      await invoke("remove_label", { keyType, keyValue });
      await refresh();
    },
    [refresh],
  );

  return { labels, refresh, setLabel, removeLabel };
}

export function useFreePorts() {
  const [ports, setPorts] = useState<number[]>([]);

  const search = useCallback(
    async (rangeStart?: number, rangeEnd?: number, count?: number) => {
      const data = await invoke<number[]>("find_free_ports", {
        rangeStart,
        rangeEnd,
        count,
      });
      setPorts(data);
    },
    [],
  );

  return { ports, search };
}
