import { supabase } from "./supabase";
import { offlineCapture } from "./offline/offlineCapture";

/**
 * Feldrix — Rainfall Logging Service
 *
 * CRUD + summary for FARMER-RECORDED rainfall (`rainfall_logs`).
 * This is completely separate from the weather-service precipitation
 * data — no weather API values are ever mixed into these totals.
 *
 * Mirrors existing Feldrix service conventions (cropService /
 * groundSamplingService):
 *   - tenant isolation via user_id (set from the authenticated session)
 *   - Supabase RLS enforces ownership server-side as well
 *   - offline capture on insert
 *
 * Unit: amount_mm is millimetres (mm). 0 is allowed (dry day).
 */

/**
 * 🌧️ All rainfall logs for the current farmer (newest first).
 */
export async function getRainfallLogs() {
  const { data, error } = await supabase
    .from("rainfall_logs")
    .select("*")
    .order("rainfall_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getRainfallLogs error:", error);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * 🌧️ Add a rainfall log.
 * user_id is taken from the authenticated session (never trusted from the UI).
 */
export async function addRainfallLog(log) {
  if (!navigator.onLine) {
    const queued = await offlineCapture({
      action: "insert",
      module: "Weather",
      table: "rainfall_logs",
      payload: log,
    });
    if (queued) return { ...log, id: `offline-${Date.now()}`, _offline: true };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not logged in.");
  }

  const { data, error } = await supabase
    .from("rainfall_logs")
    .insert([{ ...log, user_id: user.id }])
    .select();

  if (error) {
    console.error("addRainfallLog error:", error);
    throw new Error(error.message);
  }

  return data?.[0];
}

/**
 * ✏️ Update a rainfall log. Ownership enforced by RLS.
 */
export async function updateRainfallLog(id, updates) {
  const { data, error } = await supabase
    .from("rainfall_logs")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) {
    console.error("updateRainfallLog error:", error);
    throw new Error(error.message);
  }

  return data?.[0];
}

/**
 * 🗑 Delete a rainfall log. Ownership enforced by RLS.
 */
export async function deleteRainfallLog(id) {
  const { error } = await supabase
    .from("rainfall_logs")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteRainfallLog error:", error);
    throw new Error(error.message);
  }

  return true;
}

// Local-date helpers (avoid UTC drift; rainfall_date is a plain date).
function toDateOnly(d) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function localTodayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 📊 Rainfall summary — today / last 7 days / this month.
 * Computed EXCLUSIVELY from rainfall_logs (never weather API).
 *
 * @param {Array} [logs] - optionally pass already-loaded logs to avoid a fetch.
 * @returns {Promise<{today:number, last7Days:number, thisMonth:number}>}
 */
export async function getRainfallSummary(logs) {
  const rows = logs || (await getRainfallLogs());

  const today = toDateOnly(new Date());
  const todayISO = localTodayISO();

  const sevenDaysAgo = toDateOnly(new Date());
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // inclusive 7-day window

  const monthStart = toDateOnly(new Date());
  monthStart.setDate(1);

  let todayTotal = 0;
  let last7Total = 0;
  let monthTotal = 0;

  for (const r of rows) {
    if (!r.rainfall_date) continue;
    const amount = Number(r.amount_mm) || 0;
    const d = toDateOnly(r.rainfall_date + "T00:00:00");

    if (r.rainfall_date === todayISO) todayTotal += amount;
    if (d >= sevenDaysAgo && d <= today) last7Total += amount;
    if (d >= monthStart && d <= today) monthTotal += amount;
  }

  const round1 = (n) => Math.round(n * 10) / 10;

  return {
    today: round1(todayTotal),
    last7Days: round1(last7Total),
    thisMonth: round1(monthTotal),
  };
}
