/**
 * ============================================================
 * Feldrix — Sync Engine
 * Version 1.0
 *
 * Processes the offline queue when internet returns.
 * Uploads queued records to Supabase one by one.
 * Handles retries and error tracking.
 * ============================================================
 */

import { supabase } from "../supabase";
import { getPendingQueue, updateQueueItem, removeFromQueue } from "./offlineDb";

const MAX_RETRIES = 5;

/**
 * Process all pending items in the offline queue.
 * Returns { synced, failed, total }.
 */
export async function processQueue() {
  const queue = await getPendingQueue();
  const pending = queue.filter((item) => item.status === "pending" || item.status === "failed");

  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    if (item.retryCount >= MAX_RETRIES) {
      await updateQueueItem(item.id, { status: "max_retries" });
      failed++;
      continue;
    }

    try {
      await syncItem(item);
      await removeFromQueue(item.id);
      synced++;
    } catch (err) {
      await updateQueueItem(item.id, {
        status: "failed",
        retryCount: (item.retryCount || 0) + 1,
        lastError: err?.message || "Unknown error",
      });
      failed++;
    }
  }

  return { synced, failed, total: pending.length };
}

/**
 * Sync a single queue item to Supabase.
 */
async function syncItem(item) {
  const { action, table, payload, recordId } = item;

  switch (action) {
    case "insert": {
      const { error } = await supabase.from(table).insert([payload]);
      if (error) throw error;
      break;
    }
    case "update": {
      if (!recordId) throw new Error("Missing recordId for update.");
      const { error } = await supabase.from(table).update(payload).eq("id", recordId);
      if (error) throw error;
      break;
    }
    case "delete": {
      if (!recordId) throw new Error("Missing recordId for delete.");
      const { error } = await supabase.from(table).delete().eq("id", recordId);
      if (error) throw error;
      break;
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

/**
 * Check if there are items waiting to sync.
 */
export async function hasPendingSync() {
  const queue = await getPendingQueue();
  return queue.some((item) => item.status === "pending" || item.status === "failed");
}
