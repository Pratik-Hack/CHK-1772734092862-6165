import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Hook that calls `fetcher` on mount and then every `intervalMs` milliseconds.
 * Automatically pauses when the browser tab is hidden and resumes when visible.
 * Returns `{ data, loading, refresh }`.
 */
export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const mountedRef = useRef(true);

  const run = useCallback(async () => {
    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
    } catch {
      if (mountedRef.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const startPolling = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(run, intervalMs);
  }, [run, intervalMs]);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  // Initial fetch + start interval
  useEffect(() => {
    mountedRef.current = true;
    run();
    startPolling();
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [run, startPolling, stopPolling]);

  // Pause when tab hidden, resume when visible
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        run(); // immediate fetch when returning to tab
        startPolling();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [run, startPolling, stopPolling]);

  return { data, loading, refresh: run };
}
