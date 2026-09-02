/**
 * Feldrix — Weather Background Atmosphere Mapper
 *
 * Pure, dependency-free helper that turns the EXISTING weather data
 * (condition string from weatherService.mapCondition + day/night state)
 * into a rich visual "atmosphere" descriptor used by the Dashboard Weather
 * card.
 *
 * IMPORTANT
 *   - Reuses the existing condition vocabulary only. It does NOT invent a
 *     new weather classification system.
 *   - No external image URLs, no network, no assets. Backgrounds are built
 *     purely from CSS gradients so they always render (and work offline).
 *   - Every state has a sensible fallback (neutral atmosphere).
 *
 * Condition vocabulary produced by weatherService.mapCondition():
 *   Clear, Partly Cloudy, Mostly Cloudy, Cloudy, Light Rain, Rain,
 *   Heavy Rain, Drizzle, Thunderstorm, Snow, Misty, Foggy, Hazy, Dusty,
 *   Tornado, Unknown
 */

/**
 * Buckets the fine-grained condition string into a small set of visual
 * families. Matching is done on lowercase substrings so it is resilient to
 * minor wording differences ("Light Rain", "Heavy Rain" → rain).
 *
 * @param {string} condition
 * @returns {"clear"|"partly"|"cloudy"|"rain"|"storm"|"snow"|"fog"|"neutral"}
 */
export function classifyCondition(condition) {
  const c = (condition || "").toLowerCase();

  if (!c || c === "unknown") return "neutral";
  if (c.includes("thunder") || c.includes("storm") || c.includes("tornado")) return "storm";
  if (c.includes("snow")) return "snow";
  if (c.includes("rain") || c.includes("drizzle")) return "rain";
  if (c.includes("mist") || c.includes("fog") || c.includes("haze") || c.includes("dust")) return "fog";
  if (c.includes("partly")) return "partly";
  if (c.includes("cloud")) return "cloudy"; // "Cloudy", "Mostly Cloudy"
  if (c.includes("clear")) return "clear";
  return "neutral";
}

/**
 * Determine day vs night using the SAME rule as the Weather page.
 * current >= sunrise AND current < sunset = DAY.
 * Fallback (missing sunrise/sunset) = DAY (matches existing behaviour).
 *
 * @param {string|null} sunrise - ISO string
 * @param {string|null} sunset - ISO string
 * @param {number} [now=Date.now()]
 * @returns {boolean} true if day
 */
export function isDaytime(sunrise, sunset, now = Date.now()) {
  const sunriseTime = sunrise ? new Date(sunrise).getTime() : null;
  const sunsetTime = sunset ? new Date(sunset).getTime() : null;
  if (!sunriseTime || !sunsetTime) return true;
  return now >= sunriseTime && now < sunsetTime;
}

// ─────────────────────────────────────────────────────────────────────────────
// FARM LANDSCAPE PALETTE
// Three depth planes (far hills, mid fields, foreground field). Colours shift
// with day/night and are tinted per mood so the land reads correctly under
// each sky.
// ─────────────────────────────────────────────────────────────────────────────
function farmLandscape(isDay, mood = "bright") {
  const palettes = {
    bright: {
      day: { far: "#7fb069", mid: "#5c9a4d", near: "#3f7d3a", detail: "#2c5e2a", haze: "#cfe8d6" },
      night: { far: "#1d3a27", mid: "#16301f", near: "#0f2418", detail: "#0a1a11", haze: "#26456a" },
    },
    muted: {
      day: { far: "#8ba585", mid: "#6f8f66", near: "#54744d", detail: "#3f5c3a", haze: "#d3dcd6" },
      night: { far: "#212f26", mid: "#19261d", near: "#121d16", detail: "#0c140f", haze: "#2a3b4d" },
    },
    dark: {
      day: { far: "#54685a", mid: "#3f5648", near: "#2d4438", detail: "#1f322a", haze: "#aeb9bc" },
      night: { far: "#182420", mid: "#111c17", near: "#0b1310", detail: "#070d0a", haze: "#1c2a33" },
    },
    cold: {
      day: { far: "#dbe6e8", mid: "#c2d1d4", near: "#a6b8bc", detail: "#8ba0a4", haze: "#eef4f5" },
      night: { far: "#3a4750", mid: "#2c3841", near: "#212c34", detail: "#18212a", haze: "#3d4b58" },
    },
  };
  const p = palettes[mood] || palettes.bright;
  return p[isDay ? "day" : "night"];
}

/**
 * Natural cloud field: many soft, varied radial gradients at different sizes,
 * positions and opacities so it reads as clouds rather than repeated circles.
 * Returns { background, blur, opacity } or null.
 *
 * @param {boolean} isDay
 * @param {"few"|"some"|"many"|"storm"|"none"} density
 */
function cloudLayer(isDay, density) {
  if (!density || density === "none") return null;

  // Tone ramp for cloud bodies.
  const hi = isDay ? "rgba(255,255,255,0.95)" : "rgba(214,224,240,0.34)";
  const mid = isDay ? "rgba(246,249,252,0.72)" : "rgba(190,203,224,0.24)";
  const lo = isDay ? "rgba(232,238,244,0.5)" : "rgba(160,176,200,0.18)";
  const grey = isDay ? "rgba(206,214,222,0.92)" : "rgba(150,164,184,0.26)";
  const dark = isDay ? "rgba(126,138,150,0.92)" : "rgba(78,90,104,0.6)";

  // Each cloud is 2–3 overlapping ellipses to get a lumpy, natural silhouette.
  const cloud = (cx, cy, w, h, tone) =>
    `radial-gradient(${w}px ${h}px at ${cx}% ${cy}%, ${tone} 0%, ${tone} 42%, transparent 74%)`;

  const sets = {
    few: [
      cloud(24, 26, 78, 30, hi),
      cloud(31, 30, 54, 24, hi),
      cloud(72, 20, 66, 26, mid),
      cloud(80, 24, 44, 20, lo),
    ],
    some: [
      cloud(20, 26, 90, 34, hi),
      cloud(28, 31, 60, 26, hi),
      cloud(57, 19, 104, 38, hi),
      cloud(66, 24, 66, 28, mid),
      cloud(87, 30, 66, 26, lo),
    ],
    many: [
      cloud(18, 24, 108, 40, grey),
      cloud(27, 29, 72, 30, hi),
      cloud(52, 17, 128, 46, grey),
      cloud(62, 23, 84, 34, mid),
      cloud(86, 27, 92, 34, lo),
      cloud(40, 34, 80, 30, mid),
    ],
    storm: [
      cloud(20, 22, 128, 46, dark),
      cloud(30, 28, 84, 34, dark),
      cloud(58, 16, 150, 52, dark),
      cloud(68, 23, 96, 38, grey),
      cloud(90, 26, 104, 40, dark),
      cloud(44, 32, 92, 34, grey),
    ],
  };

  return {
    background: (sets[density] || sets.some).join(", "),
    blur: density === "storm" ? 3 : 4,
    opacity: isDay ? (density === "storm" ? 0.95 : 0.92) : 0.7,
  };
}

/**
 * Build the full atmosphere descriptor for a given condition + day/night.
 *
 * @param {string} condition
 * @param {boolean} isDay
 * @returns {object} atmosphere descriptor consumed by WeatherSummary
 */
export function getWeatherAtmosphere(condition, isDay) {
  const family = classifyCondition(condition);

  const moodByFamily = {
    clear: "bright",
    partly: "bright",
    cloudy: "muted",
    fog: "muted",
    rain: "dark",
    storm: "dark",
    snow: "cold",
    neutral: "bright",
  };
  const landscape = farmLandscape(isDay, moodByFamily[family] || "bright");

  const cloudsByFamily = {
    clear: "few",
    partly: "some",
    cloudy: "many",
    fog: "many",
    rain: "many",
    storm: "storm",
    snow: "some",
    neutral: "some",
  };
  const clouds = cloudLayer(isDay, cloudsByFamily[family] || "some");

  // ── Readability tokens ──────────────────────────────────────────────────
  const dayText = { textColor: "#0F2233", subTextColor: "rgba(15,34,51,0.72)" };
  const nightText = { textColor: "#F1F5F9", subTextColor: "rgba(226,232,240,0.80)" };

  const daySurface = { surface: "rgba(255,255,255,0.30)", surfaceBorder: "rgba(255,255,255,0.48)" };
  const nightSurface = { surface: "rgba(15,23,42,0.38)", surfaceBorder: "rgba(148,163,184,0.30)" };

  const dayOverlay = "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 45%, rgba(255,255,255,0.22) 100%)";
  const nightOverlay = "linear-gradient(180deg, rgba(2,6,23,0.22) 0%, rgba(2,6,23,0.30) 45%, rgba(2,6,23,0.55) 100%)";

  const base = isDay
    ? { ...dayText, ...daySurface, overlay: dayOverlay }
    : { ...nightText, ...nightSurface, overlay: nightOverlay };

  // ── Skies: three-stop atmospheric gradients (zenith → mid → horizon) ─────
  const skies = {
    clear: {
      day: "linear-gradient(180deg, #2f8fe6 0%, #63b4f2 46%, #bfe4fb 82%, #e6f4fc 100%)",
      night: "linear-gradient(180deg, #071634 0%, #102a5c 48%, #1c3a6e 84%, #24406f 100%)",
    },
    partly: {
      day: "linear-gradient(180deg, #4d9fe4 0%, #86c0ee 46%, #cbe6f8 82%, #e9f3fb 100%)",
      night: "linear-gradient(180deg, #0d1e3e 0%, #1b3360 48%, #2a3f66 84%, #32476b 100%)",
    },
    cloudy: {
      day: "linear-gradient(180deg, #7f95a8 0%, #9fb1c0 46%, #c6d1da 82%, #dde4e9 100%)",
      night: "linear-gradient(180deg, #171f2a 0%, #232d3a 48%, #2f3a48 84%, #384350 100%)",
    },
    rain: {
      day: "linear-gradient(180deg, #4f5f6c 0%, #6c7d89 46%, #8a99a4 82%, #9fadb6 100%)",
      night: "linear-gradient(180deg, #0d141c 0%, #17212c 48%, #212c38 84%, #28333f 100%)",
    },
    storm: {
      day: "linear-gradient(180deg, #29353f 0%, #3c4753 46%, #515c68 82%, #5f6a75 100%)",
      night: "linear-gradient(180deg, #05080d 0%, #0f151e 48%, #191f2a 84%, #202730 100%)",
    },
    snow: {
      day: "linear-gradient(180deg, #a2b6c3 0%, #c0cfd9 46%, #dde7ec 82%, #f0f5f7 100%)",
      night: "linear-gradient(180deg, #1a232f 0%, #28323f 48%, #37424f 84%, #46515d 100%)",
    },
    fog: {
      day: "linear-gradient(180deg, #93a1a8 0%, #b2bcc1 46%, #ccd3d6 82%, #e0e5e7 100%)",
      night: "linear-gradient(180deg, #171d24 0%, #242c34 48%, #313a42 84%, #3c454d 100%)",
    },
    neutral: {
      day: "linear-gradient(180deg, #4f9be0 0%, #86c0ee 46%, #cbe6f8 82%, #e9f3fb 100%)",
      night: "linear-gradient(180deg, #0b162e 0%, #172647 48%, #23335098 84%, #2a3a58 100%)",
    },
  };

  const effectByFamily = {
    clear: isDay ? "sun" : "stars",
    partly: isDay ? "sun" : "stars",
    cloudy: null,
    rain: "rain",
    storm: "storm",
    snow: "snow",
    fog: "fog",
    neutral: null,
  };

  // Rain/storm skies are dark even during the day — force light text and a
  // stronger overlay for contrast against streaks.
  const forceLight = family === "rain" || family === "storm";
  const readability = forceLight
    ? {
        ...nightText,
        ...(isDay ? daySurface : nightSurface),
        overlay: isDay
          ? "linear-gradient(180deg, rgba(2,6,23,0.12) 0%, rgba(2,6,23,0.18) 45%, rgba(2,6,23,0.44) 100%)"
          : nightOverlay,
      }
    : base;

  const sky = (skies[family] || skies.neutral)[isDay ? "day" : "night"];

  // Horizon haze — soft band where sky meets land (atmospheric depth).
  const haze = landscape.haze;

  // Vignette for framing.
  const vignette = isDay
    ? "radial-gradient(135% 105% at 50% 26%, transparent 52%, rgba(15,23,42,0.18) 100%)"
    : "radial-gradient(135% 105% at 50% 26%, transparent 42%, rgba(2,6,23,0.48) 100%)";

  // Fog veil — extra soft white/grey wash for mist states.
  const fogVeil = family === "fog"
    ? (isDay
        ? "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.42) 60%, rgba(255,255,255,0.30) 100%)"
        : "linear-gradient(180deg, rgba(180,196,214,0.16) 0%, rgba(180,196,214,0.24) 60%, rgba(180,196,214,0.14) 100%)")
    : null;

  return {
    key: `${family}-${isDay ? "day" : "night"}`,
    family,
    isDay,
    sky,
    clouds,      // { background, blur, opacity } | null
    haze,        // horizon haze colour
    vignette,
    fogVeil,     // string | null
    landscape,   // { far, mid, near, detail, haze }
    effect: effectByFamily[family] ?? null,
    ...readability,
  };
}
