/**
 * ============================================================
 * Feldrix — Connection Context
 * Version 1.0
 *
 * Provides connection status (online/offline/syncing) to the
 * entire application. Automatically triggers sync when
 * connectivity is restored.
 * ============================================================
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { processQueue } from "../services/offline/syncEngine";
import { getPendingCount } from "../services/offline/offlineDb";

const ConnectionContext = createContext({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  triggerSync: () => {},
});

export function ConnectionProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const wasOfflineRef = useRef(false);

  // Track online/offline events
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      if (wasOfflineRef.current) {
        toast.success("Connection restored. Synchronizing...");
        triggerSync();
      }
    }

    function handleOffline() {
      setIsOnline(false);
      wasOfflineRef.current = true;
      toast("You are offline. Changes will be saved locally.", { icon: "📡" });
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Refresh pending count periodically
  useEffect(() => {
    refreshPendingCount();
    const interval = setInterval(refreshPendingCount, 10000);
    return () => clearInterval(interval);
  }, []);

  async function refreshPendingCount() {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {
      // IndexedDB may not be available
    }
  }

  const triggerSync = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;

    setIsSyncing(true);
    try {
      const result = await processQueue();

      if (result.synced > 0) {
        toast.success(`Synchronization complete. ${result.synced} record${result.synced !== 1 ? "s" : ""} uploaded.`);
      }

      if (result.failed > 0) {
        toast.error(`${result.failed} record${result.failed !== 1 ? "s" : ""} failed to sync. Will retry later.`);
      }

      wasOfflineRef.current = false;
    } catch (err) {
      toast.error("Synchronization failed. Will retry automatically.");
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
