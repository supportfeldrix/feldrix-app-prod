/**
 * Feldrix — Broiler cycle calculations (pure functions, canonical kg).
 *
 * A flock row is one batch. All targets come from the farmer
 * (target_days, target_weight_kg); no breed growth standards are assumed.
 *
 * FCR here = total feed / live weight produced. Chick placement weight is
 * not recorded, so it is ignored (it is small next to the final weight).
 *   live:   feed so far / (latest average weight x birds alive)
 *   closed: feed for the cycle / total weight sold
 */

export const isBroiler = (flock) => (flock?.purpose || "").toLowerCase().startsWith("broiler");
export const isClosed = (flock) => flock?.status === "Closed";

// Dates are calendar days ("YYYY-MM-DD"), handled as UTC day numbers so no
// time zone shifts them. "Today" uses the same UTC date the app saves logs
// and deaths with (new Date().toISOString().slice(0, 10)).
const DAY_MS = 86400000;
const todayStr = () => new Date().toISOString().slice(0, 10);
const dayNum = (str) => {
  const [y, m, d] = String(str).slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d) / DAY_MS;
};
const fromDayNum = (n) => new Date(n * DAY_MS).toISOString().slice(0, 10);

/** Bird age in days on a given date (defaults to today, or the close date). */
export function birdAgeDays(flock, onDate = null) {
  if (!flock?.placed_date) return null;
  const end = onDate || (isClosed(flock) && flock.closed_date ? flock.closed_date : todayStr());
  const since = dayNum(end) - dayNum(flock.placed_date);
  return Math.max(0, since) + (Number(flock.age_at_placement_days) || 0);
}

/** Planned end date = placement + (target age - age at placement). */
export function expectedEndDate(flock) {
  if (!flock?.placed_date || !flock?.target_days) return null;
  return fromDayNum(dayNum(flock.placed_date) + Number(flock.target_days) - (Number(flock.age_at_placement_days) || 0));
}

/**
 * Everything the cycle card and the history list show.
 * logs / deaths / weighings: rows for THIS flock only.
 */
export function cycleStats(flock, { logs = [], deaths = [], weighings = [] } = {}) {
  const placed = Number(flock.initial_count ?? flock.bird_count) || 0;
  const alive = Number(flock.bird_count) || 0;
  const dead = deaths.reduce((s, d) => s + (Number(d.quantity) || 0), 0);
  const feedKg = logs.reduce((s, l) => s + (Number(l.feed_kg) || 0), 0);
  const waterL = logs.reduce((s, l) => s + (Number(l.water_l) || 0), 0);

  const age = birdAgeDays(flock);
  const target = Number(flock.target_days) || null;
  const progress = age != null && target ? Math.min(100, Math.round((age / target) * 100)) : null;
  const endDate = expectedEndDate(flock);
  const daysLeft = endDate ? dayNum(endDate) - dayNum(todayStr()) : null;

  const latest = [...weighings].sort((a, b) => String(b.weigh_date).localeCompare(String(a.weigh_date)))[0] || null;
  const avgWeightKg = latest ? Number(latest.total_weight_kg) / Number(latest.birds_weighed) : null;

  const closed = isClosed(flock);
  const soldKg = Number(flock.total_weight_sold_kg) || 0;
  const liveKg = avgWeightKg != null ? avgWeightKg * alive : null;
  const producedKg = closed ? (soldKg || null) : liveKg;
  const fcr = feedKg > 0 && producedKg ? feedKg / producedKg : null;

  // Today's deaths vs this cycle's own daily average on earlier days.
  const today = todayStr();
  const deathsToday = deaths.filter((d) => d.log_date === today).reduce((s, d) => s + d.quantity, 0);
  const daysSincePlaced = age != null ? age - (Number(flock.age_at_placement_days) || 0) : 0;
  const avgDailyDeaths = (dead - deathsToday) / Math.max(1, daysSincePlaced);
  const mortalitySpike = !closed && deathsToday >= 3 && deathsToday > 2 * avgDailyDeaths;

  return {
    placed,
    alive,
    dead,
    mortalityPct: placed > 0 ? (dead / placed) * 100 : null,
    deathsToday,
    mortalitySpike,
    feedKg,
    waterL,
    feedPerBirdKg: placed > 0 ? feedKg / placed : null,
    loggedToday: logs.some((l) => l.log_date === today),
    age,
    target,
    progress,
    endDate,
    daysLeft,
    avgWeightKg,
    latestWeighDate: latest?.weigh_date || null,
    targetWeightKg: Number(flock.target_weight_kg) || null,
    fcr,
    closed,
    birdsSold: Number(flock.birds_sold) || 0,
    avgSoldWeightKg: closed && flock.birds_sold > 0 && soldKg ? soldKg / flock.birds_sold : null,
    unaccounted: closed ? Math.max(0, placed - dead - (Number(flock.birds_sold) || 0)) : 0,
  };
}
