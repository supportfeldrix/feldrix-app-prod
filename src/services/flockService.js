import { supabase } from "./supabase";
import { syncFlockPurchaseFinanceRecord, syncFlockSaleFinanceRecord } from "./autoFinanceService";

/**
 * Feldrix — Poultry Flock Service
 *
 * A flock = one coop/house tracked by head count (e.g. 1000 chickens).
 * Daily logs record feed (kg) and water (L) per coop per day.
 * Values are stored in canonical kg / litres; the UI converts for display.
 */

async function currentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in.");
  return user.id;
}

/**
 * Total live birds across all of the user's flocks. Fails soft (returns 0) so a
 * missing table or network issue never breaks the dashboard/report counts.
 */
export async function getTotalPoultryBirds() {
  try {
    const { data, error } = await supabase.from("livestock_flocks").select("bird_count");
    if (error) throw error;
    return (data || []).reduce((sum, f) => sum + (Number(f.bird_count) || 0), 0);
  } catch (e) {
    console.warn("getTotalPoultryBirds failed:", e.message || e);
    return 0;
  }
}

export async function getFlocks() {
  const { data, error } = await supabase
    .from("livestock_flocks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function addFlock(flock) {
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("livestock_flocks")
    .insert([{ ...flock, initial_count: flock.bird_count, user_id }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  // Log the purchase in Finance. The flock is already saved, so a finance
  // failure is reported without losing the flock (re-saving the flock retries).
  try {
    await syncFlockPurchaseFinanceRecord(data);
  } catch (e) {
    data._financeError = e.message;
  }
  return data;
}

export async function updateFlock(id, updates) {
  const { data, error } = await supabase
    .from("livestock_flocks").update(updates).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  try {
    await syncFlockPurchaseFinanceRecord(data);
  } catch (e) {
    return { _financeError: e.message };
  }
  return {};
}

export async function deleteFlock(id) {
  const { error } = await supabase.from("livestock_flocks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Daily logs for all flocks, or one flock when flockId is given (newest first). */
export async function getFlockLogs(flockId = null) {
  let q = supabase
    .from("flock_daily_logs")
    .select("*")
    .order("log_date", { ascending: false });
  if (flockId) q = q.eq("flock_id", flockId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data || [];
}

/** Insert or update the log for (flock, date). */
export async function saveFlockLog(log) {
  const user_id = await currentUserId();
  const { error } = await supabase
    .from("flock_daily_logs")
    .upsert([{ ...log, user_id }], { onConflict: "flock_id,log_date" });
  if (error) throw new Error(error.message);
}

export async function deleteFlockLog(id) {
  const { error } = await supabase.from("flock_daily_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Mortality (bird deaths). The DB trigger adjusts bird_count on insert/delete. */
export async function getFlockMortality() {
  const { data, error } = await supabase
    .from("flock_mortality")
    .select("*")
    .order("log_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function addFlockMortality(entry) {
  const user_id = await currentUserId();
  const { error } = await supabase.from("flock_mortality").insert([{ ...entry, user_id }]);
  if (error) throw new Error(error.message);
}

export async function deleteFlockMortality(id) {
  const { error } = await supabase.from("flock_mortality").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Cost of one bird when the flock was bought: total purchase price divided by
 * the original head count. null when there is no price or count.
 */
export function costPerBird(flock) {
  const price = Number(flock?.purchase_price);
  const count = Number(flock?.initial_count ?? flock?.bird_count);
  if (!price || price <= 0 || !count || count <= 0) return null;
  return price / count;
}

/**
 * Poultry overview for the dashboard, daily briefing and Finance.
 * Fails soft to an empty summary so those pages still load.
 *
 * lossValue = deaths × cost per bird. It is part of the flock purchase that is
 * already an expense in Finance, so it is reported for information only and is
 * never added to expenses again (that would double-count the purchase).
 */
export async function getPoultrySummary() {
  const empty = { birds: 0, coops: 0, coopsWithoutLogToday: 0, deaths: 0, lossValue: 0 };
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [flocksRes, logsRes, deathsRes] = await Promise.all([
      supabase.from("livestock_flocks").select("id, bird_count, initial_count, purchase_price, status"),
      supabase.from("flock_daily_logs").select("flock_id").eq("log_date", today),
      supabase.from("flock_mortality").select("flock_id, quantity"),
    ]);
    if (flocksRes.error) throw flocksRes.error;
    const flocks = flocksRes.data || [];
    const loggedToday = new Set((logsRes.data || []).map((l) => l.flock_id));
    const deathsByFlock = {};
    (deathsRes.data || []).forEach((d) => { deathsByFlock[d.flock_id] = (deathsByFlock[d.flock_id] || 0) + d.quantity; });
    const active = flocks.filter((f) => (f.bird_count || 0) > 0);
    return {
      birds: flocks.reduce((s, f) => s + (Number(f.bird_count) || 0), 0),
      coops: active.length,
      coopsWithoutLogToday: active.filter((f) => !loggedToday.has(f.id)).length,
      deaths: Object.values(deathsByFlock).reduce((s, n) => s + n, 0),
      lossValue: flocks.reduce((s, f) => s + (deathsByFlock[f.id] || 0) * (costPerBird(f) || 0), 0),
    };
  } catch (e) {
    console.warn("getPoultrySummary failed:", e.message || e);
    return empty;
  }
}

/** Sample weighings (all flocks, newest first). */
export async function getFlockWeighings() {
  const { data, error } = await supabase
    .from("flock_weighings")
    .select("*")
    .order("weigh_date", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function addFlockWeighing(entry) {
  const user_id = await currentUserId();
  const { error } = await supabase.from("flock_weighings").insert([{ ...entry, user_id }]);
  if (error) throw new Error(error.message);
}

export async function deleteFlockWeighing(id) {
  const { error } = await supabase.from("flock_weighings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * End a broiler cycle: mark the batch Closed, store the sale, set the live
 * bird count to 0 (the birds have left the coop) and log the income in Finance.
 * Returns { _financeError } if the cycle closed but Finance failed.
 */
export async function closeFlockCycle(flock, { closed_date, birds_sold, total_weight_sold_kg, sale_amount }) {
  if (birds_sold > flock.bird_count) {
    throw new Error(`Only ${flock.bird_count} birds are in this batch.`);
  }
  const { data, error } = await supabase
    .from("livestock_flocks")
    .update({
      status: "Closed",
      closed_date,
      birds_sold,
      total_weight_sold_kg,
      sale_amount,
      bird_count: 0,
    })
    .eq("id", flock.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  try {
    await syncFlockSaleFinanceRecord(data);
  } catch (e) {
    return { _financeError: e.message };
  }
  return {};
}
