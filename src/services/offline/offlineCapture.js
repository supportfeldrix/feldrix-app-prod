/**
 * ============================================================
 * Feldrix — Offline Capture
 * Version 1.0
 *
 * Wraps service write operations. When offline, stores the
 * operation in IndexedDB instead of sending to Supabase.
 * When online, calls the normal service function.
 *
 * Usage:
 *   Instead of directly calling addAnimal(data),
 *   call offlineCapture("insert", "livestock", "livestock", data)
 * ============================================================
 */

import { addToQueue } from "./offlineDb";
import { supabase } from "../supabase";

/**
 * Attempt a Supabase write. If offline, queue it locally.
 *
 * @param {string} action - "insert", "update", "delete"
 * @param {string} module - Display module name (e.g. "Livestock", "Health")
 * @param {string} table - Supabase table name
 * @param {object} payload - Data to write
 * @param {string} [recordId] - For updates/deletes
 * @returns {object} { queued: boolean, data: any }
 */
export async function offlineCapture({ action, module, table, payload, recordId }) {
  // Check connectivity
  if (!navigator.onLine) {
    await addToQueue({ action, module, table, payload, recordId });
    return { queued: true, data: null };
  }

  // Online — attempt the operation directly
  try {
    let result;

    switch (action) {
      case "insert": {
        // Ensure user_id is set
        const { data: { user } } = await supabase.auth.getUser();
        const withUser = user ? { ...payload, user_id: user.id } : payload;
        const { data, error } = await supabase.from(table).insert([withUser]).select().single();
        if (error) throw error;
        result = data;
        break;
      }
      case "update": {
        const { data, error } = await supabase.from(table).update(payload).eq("id", recordId).select().single();
        if (error) throw error;
        result = data;
        break;
      }
      case "delete": {
        const { error } = await supabase.from(table).delete().eq("id", recordId);
        if (error) throw error;
        result = null;
        break;
      }
    }

    return { queued: false, data: result };
  } catch (err) {
    // If the error looks like a network failure, queue it
    if (isNetworkError(err)) {
      await addToQueue({ action, module, table, payload, recordId });
      return { queued: true, data: null };
    }
    // Otherwise, rethrow (validation error, RLS, etc.)
    throw err;
  }
}

/**
 * Check if an error is likely a network/connectivity issue.
 */
function isNetworkError(err) {
  if (!navigator.onLine) return true;
  const msg = (err?.message || "").toLowerCase();
  return (
    msg.includes("networkerror") ||
    msg.includes("failed to fetch") ||
    msg.includes("network request failed") ||
    msg.includes("load failed") ||
    msg.includes("econnrefused") ||
    msg.includes("timeout")
  );
}
