/**
 * ============================================================
 * Feldrix — Offline Capture
 * Version 1.1
 *
 * Queues write operations to IndexedDB when offline.
 * CRITICAL: If IndexedDB is unavailable, this function does NOT
 * prevent the operation — it simply skips offline storage.
 * The service layer handles the Supabase write directly.
 * ============================================================
 */

import { addToQueue } from "./offlineDb";

/**
 * Queue an operation for offline sync.
 * Returns true if queued, false if queueing failed.
 * Never throws.
 */
export async function offlineCapture({ action, module, table, payload, recordId }) {
  try {
    const queued = await addToQueue({ action, module, table, payload, recordId });
    return queued === true;
  } catch {
    return false;
  }
}
