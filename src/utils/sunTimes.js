/**
 * Feldrix — Sunrise / Sunset calculator (USA-3)
 *
 * Pure, dependency-free NOAA sunrise/sunset approximation from a coordinate
 * and date. Returns ABSOLUTE instants (ISO strings / epoch ms), so day/night
 * comparisons remain timezone-correct regardless of the viewer's browser
 * timezone — the same instant-based rule the rest of the app already uses
 * (see utils/weatherBackground.isDaytime).
 *
 * WHY THIS EXISTS
 *   The OpenWeatherMap provider supplies sunrise/sunset directly. The NWS
 *   (api.weather.gov) forecast/observation endpoints do NOT, but the Weather
 *   page, dashboard card and atmosphere all rely on current.sunrise/sunset to
 *   decide DAY vs NIGHT. This computes them from the farm's coordinates so US
 *   farms get correct, farm-local day/night without any provider dependency.
 *
 * Accuracy: within ~1 minute for typical latitudes — more than sufficient for
 * a day/night toggle. Uses the standard NOAA solar position algorithm.
 */

const DEG = Math.PI / 180;
const ZENITH = 90.833; // official sunrise/sunset zenith (accounts for refraction)

function toDays(date) {
  // Day of year (1-366)
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const diff = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start;
  return Math.floor(diff / 86400000);
}

/**
 * Compute sunrise or sunset (UTC) for a coordinate on a given date.
 * @param {number} lat
 * @param {number} lon
 * @param {Date} date - the local calendar date to compute for (UTC date parts used)
 * @param {boolean} rising - true = sunrise, false = sunset
 * @returns {Date|null} instant, or null if sun never rises/sets that day
 */
function calcSunEvent(lat, lon, date, rising) {
  const N = toDays(date);
  const lngHour = lon / 15;
  const t = rising ? N + (6 - lngHour) / 24 : N + (18 - lngHour) / 24;

  // Sun's mean anomaly
  const M = 0.9856 * t - 3.289;
  // Sun's true longitude
  let L = M + 1.916 * Math.sin(M * DEG) + 0.020 * Math.sin(2 * M * DEG) + 282.634;
  L = ((L % 360) + 360) % 360;

  // Right ascension
  let RA = Math.atan(0.91764 * Math.tan(L * DEG)) / DEG;
  RA = ((RA % 360) + 360) % 360;
  // RA into the same quadrant as L
  const Lquadrant = Math.floor(L / 90) * 90;
  const RAquadrant = Math.floor(RA / 90) * 90;
  RA = RA + (Lquadrant - RAquadrant);
  RA = RA / 15; // into hours

  // Sun's declination
  const sinDec = 0.39782 * Math.sin(L * DEG);
  const cosDec = Math.cos(Math.asin(sinDec));

  // Sun's local hour angle
  const cosH = (Math.cos(ZENITH * DEG) - sinDec * Math.sin(lat * DEG)) / (cosDec * Math.cos(lat * DEG));
  if (cosH > 1) return null;  // sun never rises on this location (day)
  if (cosH < -1) return null; // sun never sets on this location (day)

  let H = rising ? 360 - Math.acos(cosH) / DEG : Math.acos(cosH) / DEG;
  H = H / 15;

  const T = H + RA - 0.06571 * t - 6.622;
  let UT = T - lngHour;
  UT = ((UT % 24) + 24) % 24;

  // UT is a UTC time-of-day (hours). Anchor it to the target UTC calendar date.
  // For western-hemisphere longitudes the local sunset can compute to an
  // early-UTC-hour that belongs to the NEXT UTC day, so callers must normalise
  // the returned instant to the true local day (see normaliseToLocalDay).
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() + UT * 3600000);
}

/**
 * Shift an event instant by whole days so it lands closest to the farm's local
 * midday for the reference date. `lon/15` hours approximates the local UTC
 * offset; we pick the ±24h copy of the event nearest that local noon. This
 * makes sunrise/sunset land on the correct calendar day for ALL longitudes
 * (the raw UT-of-day math otherwise wraps western sunsets to the wrong UTC day).
 */
function normaliseToLocalDay(eventDate, refDate, lon) {
  if (!eventDate) return null;
  const localNoonUtc = new Date(Date.UTC(
    refDate.getUTCFullYear(), refDate.getUTCMonth(), refDate.getUTCDate(), 12, 0, 0
  )).getTime() - (lon / 15) * 3600000; // shift noon by local offset
  const DAY = 86400000;
  let t = eventDate.getTime();
  while (t - localNoonUtc > DAY / 2) t -= DAY;
  while (localNoonUtc - t > DAY / 2) t += DAY;
  return new Date(t);
}

/**
 * Sunrise/sunset instants for a coordinate for the day containing `at`.
 * @param {number} lat
 * @param {number} lon
 * @param {Date|number|string} [at=now] - reference instant (used for the date)
 * @returns {{ sunrise: string|null, sunset: string|null }} ISO strings (absolute instants)
 */
export function getSunTimes(lat, lon, at = Date.now()) {
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) {
    return { sunrise: null, sunset: null };
  }
  const date = new Date(at);
  const L = Number(lon);
  let sunrise = normaliseToLocalDay(calcSunEvent(Number(lat), L, date, true), date, L);
  let sunset = normaliseToLocalDay(calcSunEvent(Number(lat), L, date, false), date, L);
  // Guarantee ordering: sunset must follow sunrise on the same local day.
  if (sunrise && sunset && sunset.getTime() <= sunrise.getTime()) {
    sunset = new Date(sunset.getTime() + 86400000);
  }
  return {
    sunrise: sunrise ? sunrise.toISOString() : null,
    sunset: sunset ? sunset.toISOString() : null,
  };
}
