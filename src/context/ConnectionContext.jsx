/**
 * ============================================================
 * Feldrix — Connection Context
 * Version 1.1
 *
 * Provides connection status (online/offline/syncing).
 * CRITICAL: This context must NEVER prevent the app from loading.
 * All operations are wrapped in try/catch. If offline features
 * fail to initialize, the app continues normally in online mode.
 * ============================================================
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";

const ConnectionContext = createContext({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  triggerSync: () => {},
});

export function ConnectionProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const wasOfflineRef = useRef(false);
  const initRef = useRef(false);

  // Safe initialization — never blocks render
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    try {
      setIsOnline(navigator.onLine);
    } catch {
      setIsOnline(true);
    }
  }, []);

  // Track online/offline events
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      if (wasOfflineRef.current) {
        try { toast.success("Connection restored. Synchronizing..."); } catch {}
        triggerSync();
      }
    }

    function handleOffline() {
      setIsOnline(false);
      wasOfflineRef.current = true;
      try { toast("You are offline. Changes will be saved locally.", { icon: "📡" }); } catch {}
    }

    try {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    } catch {
      // Event listeners not available — continue without offline detection
    }

    return () => {
      try {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      } catch {}
    };
  }, []);

  // Refresh pending count periodically — completely safe
  useEffect(() => {
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 15000);
    return () => clearInterval(interval);
  }, []);

  async function refreshPendingCount() {
    try {
      const { getPendingCount } = await import("../services/offline/offlineDb");
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {
      // IndexedDB unavailable or import failed — offline mode disabled, that's OK
      setPendingCount(0);
    }
  }

  const triggerSync = useCallback(async () => {
    if (isSyncing) return;

    try {
      if (!navigator.onLine) return;
    } catch {
      return;
    }

    setIsSyncing(true);
    try {
      const { processQueue } = await import("../services/offline/syncEngine");
      const result = await processQueue();

      if (result.synced > 0) {
        toast.success(`Synchronization complete. ${result.synced} record${result.synced !== 1 ? "s" : ""} uploaded.`);
      }

      if (result.failed > 0) {
        toast.error(`${result.failed} record${result.failed !== 1 ? "s" : ""} failed to sync. Will retry later.`);
      }

      wasOfflineRef.current = false;
    } catch {
      // Sync failed — silently continue, will retry next time
    } finally {
      setIsSyncing(false);
      refreshPendingCount();
    }
  }, [isSyncing]);

  return (
    <ConnectionContext.Provider value={{ isOnline, isSyncing, pendingCount, triggerSync }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  return useContext(ConnectionContext);
}
