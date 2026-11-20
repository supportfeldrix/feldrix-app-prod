/**
 * Feldrix — Egg production totals for layer flocks (pure functions).
 *
 * "Laid" = good + damaged eggs. Lay % = eggs laid / birds alive.
 * Lay % uses the flock's CURRENT bird count, so after deaths it is a close
 * estimate for earlier days, not an exact historical figure.
 */
export const isLayer = (flock) => (flock?.purpose || "").toLowerCase().startsWith("layer");

/** Standard egg tray size used for the "trays" figure. */
export const EGGS_PER_TRAY = 30;

const DAY_MS = 86400000;
const todayStr = () => new Date().toISOString().slice(0, 10);
const dayNum = (str) => {
  const [y, m, d] = String(str).slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d) / DAY_MS;
};
const laid = (l) => (Number(l.eggs_collected) || 0) + (Number(l.eggs_damaged) || 0);

/**
 * Totals for one flock. eggLogs: rows for THIS flock only.
 * Day windows are calendar days ending today (UTC date, same as saved logs).
 */
export function eggStats(flock, eggLogs = [], feedLogs = []) {
  const today = todayStr();
  const todayN = dayNum(today);
  const monthPrefix = today.slice(0, 7);
  const birds = Number(flock?.bird_count) || 0;

  const inLastDays = (l, n) => {
    const diff = todayN - dayNum(l.log_date);
    return diff >= 0 && diff < n;
  };
  const sum = (rows, f) => rows.reduce((s, r) => s + f(r), 0);
  const good = (r) => Number(r.eggs_collected) || 0;

  const todayLog = eggLogs.find((l) => l.log_date === today) || null;
  const week = eggLogs.filter((l) => inLastDays(l, 7));
  const month = eggLogs.filter((l) => String(l.log_date).startsWith(monthPrefix));

  const weekLaid = sum(week, laid);
  const weekDamaged = sum(week, (r) => Number(r.eggs_damaged) || 0);
  // Previous 6 days (excluding today), to compare today's lay % against.
  const prior = week.filter((l) => l.log_date !== today);
  const layPctPrior = prior.length > 0 && birds > 0 ? (sum(prior, laid) / prior.length / birds) * 100 : null;
  // Feed per dozen eggs over the last 7 days (only days with an egg count).
  const eggDays = new Set(week.map((l) => l.log_date));
  const feed7 = sum(feedLogs.filter((l) => inLastDays(l, 7) && eggDays.has(l.log_date)), (r) => Number(r.feed_kg) || 0);

  return {
    today: todayLog ? good(todayLog) : null,
    todayDamaged: todayLog ? Number(todayLog.eggs_damaged) || 0 : null,
    week: sum(week, good),
    month: sum(month, good),
    total: sum(eggLogs, good),
    loggedToday: !!todayLog,
    layPctToday: todayLog && birds > 0 ? (laid(todayLog) / birds) * 100 : null,
    // Average over the days that were actually logged in the last 7.
    layPct7: week.length > 0 && birds > 0 ? (weekLaid / week.length / birds) * 100 : null,
    damagedPct7: weekLaid > 0 ? (weekDamaged / weekLaid) * 100 : null,
    daysLogged7: week.length,
    layPctPrior,
    // Today well below the recent average (10+ percentage points).
    layDrop: todayLog && layPctPrior != null && birds > 0
      && (laid(todayLog) / birds) * 100 < layPctPrior - 10,
    feedPerDozenKg: feed7 > 0 && weekLaid > 0 ? (feed7 / weekLaid) * 12 : null,
  };
}

/** Last `n` calendar days (oldest first) for a chart: good and damaged per day. */
export function eggSeries(eggLogs = [], n = 14) {
  const byDate = Object.fromEntries(eggLogs.map((l) => [l.log_date, l]));
  const todayN = dayNum(todayStr());
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const key = new Date((todayN - i) * DAY_MS).toISOString().slice(0, 10);
    const l = byDate[key];
    out.push({
      date: key.slice(5),
      good: l ? Number(l.eggs_collected) || 0 : 0,
      damaged: l ? Number(l.eggs_damaged) || 0 : 0,
      logged: !!l,
    });
  }
  return out;
}

export const trays = (eggs) => Math.floor((Number(eggs) || 0) / EGGS_PER_TRAY);
