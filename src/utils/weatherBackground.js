/**
 * Feldrix — Weather Background Atmosphere Mapper
 *
 * Pure, dependency-free helper that turns the EXISTING weather data
 * (condition string from weatherService.mapCondition + day/night state)
 * into a visual "atmosphere" descriptor used by the Dashboard Weather card.
 *
 * IMPORTANT
 *   - Reuses the existing condition vocabulary only. It does NOT invent a
 *     new weather classification system.
 *   - No external image URLs, no network, no assets. Backgrounds are pure
 *     CSS gradients so they always render (and work offline).
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

// Farm landscape palette (multi-ridge rolling hills) rendered via CSS.
// Colour changes with day/night and is muted for overcast/rain/storm so it
// reads as "the farm" under each sky. `mood` dulls greens for grey skies.
function farmLandscape(isDay, mood = "bright") {
  // Base greens for day, deep greens for night.
  let near = isDay ? "#3f7d3a" : "#12261a";
  let mid = isDay ? "#4f8c44" : "#16301f";
  let far = isDay ? "#6ba85c" : "#1d3a27";

  if (mood === "muted") {
    // Overcast — desaturated / greyer greens.
    near = isDay ? "#4a6b4a" : "#141f19";
    mid = isDay ? "#5a7a58" : "#1a271f";
    far = isDay ? "#7f9a78" : "#22302a";
  } else if (mood === "dark") {
    // Rain / storm — darker, wetter landscape.
    near = isDay ? "#2f4438" : "#0c1512";
    mid = isDay ? "#3a5244" : "#111c17";
    far = isDay ? "#4c6553" : "#16241d";
  } else if (mood === "cold") {
    // Snow — pale, cool landscape.
    near = isDay ? "#b9c6c9" : "#28323a";
    mid = isDay ? "#cdd9db" : "#333f48";
    far = isDay ? "#e4ecee" : "#45525c";
  }

  return { near, mid, far };
}

/**
 * Soft cloud layer expressed as a set of overlapping radial gradients.
 * Returns a CSS `background` string or null (clear skies get few/no clouds).
 * `density`: "few" | "some" | "many" | "storm"
 */
function cloudLayer(isDay, density) {
  if (!density || density === "none") return null;

  const light = isDay ? "rgba(255,255,255,0.85)" : "rgba(226,232,240,0.30)";
  const soft = isDay ? "rgba(255,255,255,0.55)" : "rgba(203,213,225,0.18)";
  const grey = isDay ? "rgba(215,222,228,0.9)" : "rgba(148,163,184,0.22)";
  const storm = isDay ? "rgba(120,132,144,0.9)" : "rgba(70,82,96,0.55)";

  const blobs = {
    few: [
      `radial-gradient(70px 34px at 22% 26%, ${light} 0%, transparent 70%)`,
      `radial-gradient(90px 40px at 70% 20%, ${soft} 0%, transparent 72%)`,
    ],
    some: [
      `radial-gradient(90px 42px at 18% 24%, ${light} 0%, transparent 70%)`,
      `radial-gradient(120px 52px at 58% 18%, ${light} 0%, transparent 72%)`,
      `radial-gradient(80px 38px at 86% 30%, ${soft} 0%, transparent 72%)`,
    ],
    many: [
      `radial-gradient(120px 50px at 20% 22%, ${grey} 0%, transparent 72%)`,
      `radial-gradient(150px 60px at 60% 16%, ${grey} 0%, transparent 74%)`,
      `radial-gradient(110px 48px at 90% 26%, ${soft} 0%, transparent 72%)`,
      `radial-gradient(100px 44px at 40% 34%, ${soft} 0%, transparent 72%)`,
    ],
    storm: [
      `radial-gradient(150px 60px at 24% 20%, ${storm} 0%, transparent 72%)`,
      `radial-gradient(180px 70px at 64% 14%, ${storm} 0%, transparent 74%)`,
      `radial-gradient(130px 54px at 92% 26%, ${storm} 0%, transparent 72%)`,
      `radial-gradient(120px 50px at 44% 32%, ${grey} 0%, transparent 72%)`,
    ],
  };

  return (blobs[density] || blobs.some).join(", ");
}

/**
 * Build the full atmosphere descriptor for a given condition + day/night.
 *
 * @param {string} condition
 * @param {boolean} isDay
 * @returns {{
 *   key: string,
 *   sky: string,        // CSS background (gradient) for the sky
 *   textColor: string,  // primary readable text colour
 *   subTextColor: string,
 *   overlay: string,    // gradient overlay to guarantee readability
 *   surface: string,    // translucent surface bg for glass panels
 *   surfaceBorder: string,
 *   landscape: {hill:string, hillFar:string},
 *   effect: null|"rain"|"storm"|"snow"|"stars"|"sun",
 * }}
 */
export function getWeatherAtmosphere(condition, isDay) {
  const family = classifyCondition(condition);

  // Landscape mood per family.
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

  // Cloud density per family.
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

  // Readability defaults per day/night. Day uses dark text on light sky;
  // night uses light text on dark sky. Rain/storm always use light text.
  const dayText = { textColor: "#0F2233", subTextColor: "rgba(15,34,51,0.72)" };
  const nightText = { textColor: "#F1F5F9", subTextColor: "rgba(226,232,240,0.78)" };

  const daySurface = { surface: "rgba(255,255,255,0.28)", surfaceBorder: "rgba(255,255,255,0.45)" };
  const nightSurface = { surface: "rgba(15,23,42,0.35)", surfaceBorder: "rgba(148,163,184,0.28)" };

  // Overlay keeps content legible. Day = subtle light-to-transparent from
  // top; Night = stronger dark overlay.
  const dayOverlay = "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.30) 100%)";
  const nightOverlay = "linear-gradient(180deg, rgba(2,6,23,0.25) 0%, rgba(2,6,23,0.55) 100%)";

  const base = isDay
    ? { ...dayText, ...daySurface, overlay: dayOverlay }
    : { ...nightText, ...nightSurface, overlay: nightOverlay };

  const skies = {
    clear: {
      day: "linear-gradient(180deg, #4aa3f0 0%, #8fccf5 55%, #d6ecfb 100%)",
      night: "linear-gradient(180deg, #0a1a3f 0%, #16336b 55%, #1e2a52 100%)",
    },
    partly: {
      day: "linear-gradient(180deg, #6fb0e8 0%, #a8cef0 55%, #e0eef8 100%)",
      night: "linear-gradient(180deg, #12213f 0%, #22375f 55%, #2b3a55 100%)",
    },
    cloudy: {
      day: "linear-gradient(180deg, #8fa3b3 0%, #b3c1cc 55%, #d8dfe4 100%)",
      night: "linear-gradient(180deg, #1c2530 0%, #2b3540 55%, #333d47 100%)",
    },
    rain: {
      day: "linear-gradient(180deg, #5b6b78 0%, #7c8b96 55%, #9aa7b0 100%)",
      night: "linear-gradient(180deg, #131b24 0%, #202b36 55%, #28323c 100%)",
    },
    storm: {
      day: "linear-gradient(180deg, #33414d 0%, #4a5560 55%, #5d6771 100%)",
      night: "linear-gradient(180deg, #090d13 0%, #171f2a 55%, #1f2732 100%)",
    },
    snow: {
      day: "linear-gradient(180deg, #aebfca 0%, #cdd9e1 55%, #eef3f6 100%)",
      night: "linear-gradient(180deg, #1e2733 0%, #313d4a 55%, #47535f 100%)",
    },
    fog: {
      day: "linear-gradient(180deg, #9aa6ac 0%, #bcc4c8 55%, #dde1e3 100%)",
      night: "linear-gradient(180deg, #1b2229 0%, #2a333b 55%, #39424a 100%)",
    },
    neutral: {
      day: "linear-gradient(180deg, #6fa8dc 0%, #a8cef0 55%, #dfeef8 100%)",
      night: "linear-gradient(180deg, #101a30 0%, #1f2c48 55%, #28334d 100%)",
    },
  };

  const effectByFamily = {
    clear: isDay ? "sun" : "stars",
    partly: isDay ? "sun" : "stars",
    cloudy: null,
    rain: "rain",
    storm: "storm",
    snow: "snow",
    fog: null,
    neutral: null,
  };

  // Rain/storm skies are dark even during the day — force light text.
  const forceLight = family === "rain" || family === "storm";
  const readability = forceLight
    ? { ...nightText, ...(isDay ? daySurface : nightSurface), overlay: isDay ? "linear-gradient(180deg, rgba(2,6,23,0.15) 0%, rgba(2,6,23,0.40) 100%)" : nightOverlay }
    : base;

  const sky = (skies[family] || skies.neutral)[isDay ? "day" : "night"];

  // Horizon haze colour — a soft band where sky meets land, adds depth.
  const haze = isDay
    ? (forceLight ? "rgba(200,208,214,0.55)" : "rgba(255,255,255,0.55)")
    : "rgba(120,140,180,0.22)";

  // Vignette strength for atmospheric framing.
  const vignette = isDay
    ? "radial-gradient(130% 100% at 50% 30%, transparent 55%, rgba(15,23,42,0.16) 100%)"
    : "radial-gradient(130% 100% at 50% 30%, transparent 45%, rgba(2,6,23,0.45) 100%)";

  return {
    key: `${family}-${isDay ? "day" : "night"}`,
    family,
    sky,
    clouds,
    haze,
    vignette,
    landscape,
    effect: effectByFamily[family] ?? null,
    ...readability,
  };
}
