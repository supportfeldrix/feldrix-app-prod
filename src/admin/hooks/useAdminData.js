/**
 * ============================================================
 * Feldrix Control Centre — Generic Data Fetching Hook
 * Sprint 46.2
 *
 * Provides loading, error, data, and refresh for any async fetch.
 * ============================================================
 */

import { useState, useEffect, useCallback } from "react";

export function useAdminData(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      console.warn("[Admin] Data fetch failed:", err?.message);
      setError(err?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
