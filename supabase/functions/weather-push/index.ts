/// <reference lib="deno.ns" />

// ═══════════════════════════════════════════════════════════════════════════════
// Feldrix v1.2.2 — Production Weather Push Notification Edge Function
// Supabase Edge Function (Deno)
//
// PRODUCTION IMPLEMENTATION — Complete Web Push Protocol
//
// This Edge Function delivers push notifications to farmers' devices
// EVEN WHEN THE APPLICATION IS COMPLETELY CLOSED.
//
// Implements:
//   ✅ VAPID JWT Authentication (RFC 8292)
//   ✅ AES-128-GCM Payload Encryption (RFC 8291)
//   ✅ ECDH Key Agreement (P-256 curve)
//   ✅ Proper Push Endpoint Requests
//   ✅ Retry Logic (1 retry on 5xx)
//   ✅ Subscription Cleanup (removes 404/410 expired subscriptions)
//   ✅ Cooldown (2h per alert type per user)
//   ✅ Per-user notification settings
//   ✅ Notification History recording
//
// Uses: npm:web-push (handles all cryptographic operations)
//
// Request Types:
//   - weather_check  (default) — Hourly scheduled weather evaluation
//   - morning_brief            — Daily 07:00 SAST farm briefing
//   - test                     — Admin test push (bypasses weather check)
//   - health_check             — Admin health monitoring endpoint
//
// Schedule (pg_cron):
//   Hourly:  '0 * * * *' → weather_check
//   Morning: '0 5 * * *' → morning_brief (05:00 UTC = 07:00 SAST)
//
// Secrets (Supabase Dashboard → Edge Functions → Secrets):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   OPENWEATHERMAP_API_KEY
//   VAPID_PUBLIC_KEY
//   VAPID_PRIVATE_KEY
//   VAPID_SUBJECT              (e.g. mailto:support@feldrix.com)
//
// NO third-party notification services. Self-hosted Web Push only.
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

declare const Deno: {
  serve(handler: (req: Request) => Promise<Response> | Response): void;
  env: { get(key: string): string | undefined };
};

// ─── Configuration (from Supabase Secrets) ──────────────────────────────────

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const OWM_API_KEY = Deno.env.get("OPENWEATHERMAP_API_KEY") || "";
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:support@feldrix.com";

// Configure web-push with VAPID credentials
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Weather thresholds (matching client-side weatherIntelligenceService.js)
const THRESHOLDS = {
  FREEZE: 0,
  FROST: 3,
  HEATWAVE: 35,
  EXTREME_HEAT: 40,
  STRONG_WIND: 40,
  DANGEROUS_WIND: 60,
  HEAVY_RAIN: 30,
  FLOOD_RISK: 50,
};

// Cooldown: don't re-notify same user for same alert type within 2 hours
const COOLDOWN_HOURS = 2;

// Push options
const PUSH_OPTIONS = {
  TTL: 86400, // 24 hours — notification valid for this long if device is offline
  urgency: "high" as const, // high urgency for weather alerts
  topic: "feldrix-weather", // allows replacement of existing notification
};

// ─── Main Handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const startTime = Date.now();

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Parse request body
    let requestType = "weather_check";
    let testAlertType: string | null = null;
    let testUserId: string | null = null;
    try {
      const body = await req.json();
      if (body?.type) requestType = body.type;
      if (body?.alertType) testAlertType = body.alertType;
      if (body?.userId) testUserId = body.userId;
    } catch {
      // No body or invalid JSON — default to weather_check
    }

    // ─── HEALTH CHECK ─────────────────────────────────────────────
    if (requestType === "health_check") {
      return jsonResponse({
        success: true,
        status: "online",
        service: "weather-push",
        version: "1.2.2",
        vapidConfigured: !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY),
        owmConfigured: !!OWM_API_KEY,
        supabaseConfigured: !!(SUPABASE_URL && SUPABASE_SERVICE_KEY),
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      });
    }

    // Verify VAPID configuration
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return jsonResponse({
        success: false,
        error: "VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY secrets.",
      }, 500);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ─── TEST PUSH (Admin) ────────────────────────────────────────
    if (requestType === "test") {
      return await handleTestPush(supabase, testAlertType, testUserId, startTime);
    }

    // ─── WEATHER CHECK / MORNING BRIEF ────────────────────────────
    return await handleWeatherPush(supabase, requestType, startTime);

  } catch (err) {
    console.error("[weather-push] Fatal error:", err);
    return jsonResponse({
      success: false,
      error: String(err),
      responseTime: Date.now() - startTime,
    }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLER: Weather Check / Morning Brief
// ═══════════════════════════════════════════════════════════════════════════════

async function handleWeatherPush(supabase: any, requestType: string, startTime: number) {
  // Get all users with active push subscriptions (seen in last 30 days)
  const { data: subscriptions, error: subError } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, subscription_json, notification_settings, device_name")
    .gte("last_seen", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (subError || !subscriptions || subscriptions.length === 0) {
    return jsonResponse({
      success: true,
      message: "No active subscriptions found.",
      processed: 0,
      responseTime: Date.now() - startTime,
    });
  }

  // Group subscriptions by user_id
  const userSubs = groupByUserId(subscriptions);

  // Get user profiles for weather locations
  const userIds = Array.from(userSubs.keys());
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, weather_location, farm_name, full_name")
    .in("id", userIds);

  const profileMap = new Map<string, any>();
  for (const p of profiles || []) profileMap.set(p.id, p);

  let totalSent = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalCleaned = 0;
  const errors: string[] = [];

  // Process each user
  for (const [userId, subs] of userSubs) {
    try {
      const profile = profileMap.get(userId);
      const location = profile?.weather_location || "";
      const farmName = profile?.farm_name || "";

      if (!location) { totalSkipped++; continue; }

      // Fetch weather
      const weather = await fetchWeather(location);
      if (!weather) { totalSkipped++; continue; }

      // Evaluate alerts
      const alerts = requestType === "morning_brief"
        ? generateMorningBrief(weather, farmName)
        : evaluateWeatherAlerts(weather, farmName);

      if (alerts.length === 0) { totalSkipped++; continue; }

      // Get user's notification settings
      const settings = subs[0]?.notification_settings || {};

      for (const alert of alerts) {
        if (!isAlertEnabled(alert.type, settings)) continue;

        // Check cooldown
        const cooldownActive = await checkCooldown(supabase, userId, alert.type);
        if (cooldownActive) continue;

        // Send to all user's devices
        const pushResult = await sendToAllDevices(supabase, userId, subs, alert);
        totalSent += pushResult.sent;
        totalFailed += pushResult.failed;
        totalCleaned += pushResult.cleaned;
        if (pushResult.errors.length > 0) errors.push(...pushResult.errors);

        // Record in notification history (once per alert, not per device)
        if (pushResult.sent > 0) {
          await supabase.from("notification_history").insert({
            user_id: userId,
            notification_id: `${alert.type}-${Date.now()}`,
            alert_type: alert.type,
            title: alert.title,
            message: alert.body,
            priority: alert.priority,
            status: "sent",
            sent_at: new Date().toISOString(),
          });
        }
      }
    } catch (userErr) {
      errors.push(`User ${userId}: ${String(userErr)}`);
    }
  }

  return jsonResponse({
    success: true,
    type: requestType,
    processed: userSubs.size,
    sent: totalSent,
    failed: totalFailed,
    skipped: totalSkipped,
    cleaned: totalCleaned,
    errors: errors.slice(0, 10),
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - startTime,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLER: Admin Test Push
// ═══════════════════════════════════════════════════════════════════════════════

async function handleTestPush(supabase: any, alertType: string | null, userId: string | null, startTime: number) {
  // Get target subscriptions
  let query = supabase.from("push_subscriptions").select("user_id, endpoint, subscription_json, device_name");
  if (userId) {
    query = query.eq("user_id", userId);
  } else {
    // If no specific user, send to all (admin test)
    query = query.limit(10);
  }

  const { data: subs, error } = await query;
  if (error || !subs || subs.length === 0) {
    return jsonResponse({ success: false, message: "No subscriptions found for test.", responseTime: Date.now() - startTime });
  }

  const testAlert: Alert = {
    type: alertType || "TEST",
    priority: "High",
    title: alertType ? `${alertType} Alert (TEST)` : "FELDRIX TEST",
    body: alertType
      ? `Test ${alertType} notification. Your push notification system is working correctly.`
      : "This is a Weather Push Notification test.\nYour Push Notification system is working correctly.\nTap to open Weather Intelligence.",
    icon: "🚨",
    farmName: "Test Farm",
  };

  const results = { sent: 0, failed: 0, cleaned: 0, errors: [] as string[] };

  for (const sub of subs) {
    try {
      const subscription = typeof sub.subscription_json === "string"
        ? JSON.parse(sub.subscription_json)
        : sub.subscription_json;

      await sendPushNotification(subscription, testAlert);
      results.sent++;
    } catch (err) {
      results.failed++;
      results.errors.push(`${sub.device_name}: ${String(err)}`);

      // Clean expired subscriptions
      if (isSubscriptionExpired(err)) {
        await removeSubscription(supabase, sub.user_id, sub.endpoint);
        results.cleaned++;
      }
    }
  }

  // Record test in history
  if (results.sent > 0 && subs[0]?.user_id) {
    await supabase.from("notification_history").insert({
      user_id: subs[0].user_id,
      notification_id: `TEST-${Date.now()}`,
      alert_type: testAlert.type,
      title: testAlert.title,
      message: testAlert.body,
      priority: testAlert.priority,
      status: "sent",
      sent_at: new Date().toISOString(),
    });
  }

  return jsonResponse({
    success: results.sent > 0,
    type: "test",
    ...results,
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - startTime,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEB PUSH — Production Implementation using npm:web-push
//
// This implements the COMPLETE Web Push protocol:
//   1. VAPID JWT signing (RFC 8292)
//   2. AES-128-GCM payload encryption (RFC 8291)
//   3. ECDH key agreement using subscriber's p256dh + auth keys
//   4. Proper HTTP headers (TTL, Urgency, Topic)
//   5. Correct Content-Encoding
//
// The npm:web-push library handles all cryptographic operations internally:
//   - Generates ephemeral ECDH key pair
//   - Derives shared secret via ECDH with subscriber's p256dh key
//   - Derives encryption key + nonce via HKDF
//   - Encrypts payload with AES-128-GCM
//   - Signs VAPID JWT with ES256 (P-256 ECDSA)
//   - Constructs Authorization header: vapid t=<JWT>, k=<public-key>
//   - Sets Content-Encoding: aes128gcm
//   - POSTs encrypted payload to push endpoint
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send a push notification to a single subscription using the full Web Push protocol.
 * Throws on failure (caller handles retry/cleanup).
 */
async function sendPushNotification(subscription: PushSubscription, alert: Alert): Promise<void> {
  // Validate subscription structure
  if (!subscription.endpoint) {
    throw new Error("Invalid subscription: missing endpoint");
  }
  if (!subscription.keys?.p256dh || !subscription.keys?.auth) {
    throw new Error("Invalid subscription: missing encryption keys (p256dh/auth)");
  }

  // Build notification payload (what the service worker receives)
  const payload = JSON.stringify({
    title: `🚨 ${alert.title}`,
    body: alert.body,
    icon: "/Branding/app-icon-192.png",
    badge: "/Branding/app-icon-192.png",
    tag: `feldrix-${alert.type.toLowerCase()}`,
    renotify: true,
    requireInteraction: alert.priority === "Critical",
    vibrate: alert.priority === "Critical" ? [200, 100, 200, 100, 200] : [200, 100, 200],
    timestamp: Date.now(),
    data: {
      url: "/weather#alerts",
      alertType: alert.type,
      farmName: alert.farmName,
      timestamp: Date.now(),
    },
    actions: [
      { action: "view", title: "View Details" },
      { action: "dismiss", title: "Dismiss" },
    ],
  });

  // Send using web-push library
  // This handles: VAPID JWT signing, ECDH key agreement, AES-128-GCM encryption,
  // proper headers (Authorization, Content-Encoding, TTL, Urgency, Topic)
  const options = {
    TTL: PUSH_OPTIONS.TTL,
    urgency: alert.priority === "Critical" ? "high" : "normal",
    topic: `feldrix-${alert.type.toLowerCase()}`,
  };

  try {
    await webpush.sendNotification(subscription, payload, options);
  } catch (err: any) {
    // web-push throws WebPushError with statusCode
    const statusCode = err?.statusCode || err?.status;
    const errBody = err?.body || "";

    if (statusCode === 410 || statusCode === 404) {
      throw new Error(`410: Subscription expired`);
    }

    if (statusCode === 413) {
      throw new Error(`413: Payload too large`);
    }

    if (statusCode === 429) {
      // Rate limited — don't retry immediately
      throw new Error(`429: Rate limited by push service`);
    }

    if (statusCode >= 500) {
      // Server error — retry once
      try {
        await delay(1000);
        await webpush.sendNotification(subscription, payload, options);
        return; // Retry succeeded
      } catch {
        throw new Error(`${statusCode}: Push service error after retry: ${errBody}`);
      }
    }

    throw new Error(`Push failed (${statusCode || "unknown"}): ${err.message || errBody}`);
  }
}

/**
 * Send push to all of a user's registered devices.
 * Returns counts and removes expired subscriptions.
 */
async function sendToAllDevices(supabase: any, userId: string, subs: any[], alert: Alert) {
  const results = { sent: 0, failed: 0, cleaned: 0, errors: [] as string[] };

  for (const sub of subs) {
    try {
      const subscription = typeof sub.subscription_json === "string"
        ? JSON.parse(sub.subscription_json)
        : sub.subscription_json;

      await sendPushNotification(subscription, alert);
      results.sent++;
    } catch (err) {
      results.failed++;
      const errMsg = String(err);
      results.errors.push(`${sub.device_name || "device"}: ${errMsg}`);

      // Automatically remove expired/invalid subscriptions
      if (isSubscriptionExpired(err)) {
        await removeSubscription(supabase, userId, sub.endpoint);
        results.cleaned++;
      }
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Check if an error indicates the subscription is expired/invalid
 * and should be permanently removed.
 */
function isSubscriptionExpired(err: any): boolean {
  const msg = String(err);
  return msg.includes("410") || msg.includes("404") || msg.includes("expired") || msg.includes("Subscription expired");
}

/**
 * Remove a subscription from the database.
 */
async function removeSubscription(supabase: any, userId: string, endpoint: string) {
  try {
    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("endpoint", endpoint);
  } catch {
    // Non-blocking — will be cleaned up on next run
  }
}

function groupByUserId(subscriptions: any[]): Map<string, any[]> {
  const map = new Map<string, any[]>();
  for (const sub of subscriptions) {
    if (!map.has(sub.user_id)) map.set(sub.user_id, []);
    map.get(sub.user_id)!.push(sub);
  }
  return map;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEATHER FETCH — OpenWeatherMap
// ═══════════════════════════════════════════════════════════════════════════════

interface WeatherData {
  temp: number;
  feels_like: number;
  wind_speed: number;
  wind_gust?: number;
  humidity: number;
  rain_1h?: number;
  condition: string;
  description: string;
  forecast_min?: number;
  forecast_max?: number;
  forecast_rain?: number;
  forecast_wind?: number;
}

async function fetchWeather(location: string): Promise<WeatherData | null> {
  if (!OWM_API_KEY) return null;

  try {
    // Current weather
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${OWM_API_KEY}`
    );
    if (!currentRes.ok) return null;
    const current = await currentRes.json();

    // Forecast (next 24h — 8 x 3-hour intervals)
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&units=metric&cnt=8&appid=${OWM_API_KEY}`
    );
    let forecastMin: number | undefined;
    let forecastMax: number | undefined;
    let forecastRain = 0;
    let forecastWind = 0;

    if (forecastRes.ok) {
      const forecast = await forecastRes.json();
      const temps = (forecast.list || []).map((item: any) => item.main?.temp ?? 0);
      forecastMin = temps.length > 0 ? Math.min(...temps) : undefined;
      forecastMax = temps.length > 0 ? Math.max(...temps) : undefined;
      forecastRain = (forecast.list || []).reduce((sum: number, item: any) => sum + (item.rain?.["3h"] ?? 0), 0);
      forecastWind = Math.max(0, ...(forecast.list || []).map((item: any) => (item.wind?.speed ?? 0) * 3.6));
    }

    return {
      temp: current.main?.temp ?? 15,
      feels_like: current.main?.feels_like ?? current.main?.temp ?? 15,
      wind_speed: Math.round((current.wind?.speed ?? 0) * 3.6),
      wind_gust: current.wind?.gust ? Math.round(current.wind.gust * 3.6) : undefined,
      humidity: current.main?.humidity ?? 50,
      rain_1h: current.rain?.["1h"] ?? 0,
      condition: current.weather?.[0]?.main ?? "Clear",
      description: current.weather?.[0]?.description ?? "",
      forecast_min: forecastMin != null ? Math.round(forecastMin) : undefined,
      forecast_max: forecastMax != null ? Math.round(forecastMax) : undefined,
      forecast_rain: Math.round(forecastRain),
      forecast_wind: Math.round(forecastWind),
    };
  } catch (err) {
    console.error("[weather-push] Weather fetch failed:", err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALERT EVALUATION — Weather Intelligence Engine (server-side mirror)
// ═══════════════════════════════════════════════════════════════════════════════

interface Alert {
  type: string;
  priority: "Critical" | "High";
  title: string;
  body: string;
  icon: string;
  farmName: string;
}

function evaluateWeatherAlerts(weather: WeatherData, farmName: string): Alert[] {
  const alerts: Alert[] = [];
  const minTemp = Math.min(weather.temp, weather.forecast_min ?? weather.temp);
  const maxTemp = Math.max(weather.temp, weather.forecast_max ?? weather.temp);
  const maxWind = Math.max(weather.wind_speed, weather.forecast_wind ?? 0, weather.wind_gust ?? 0);
  const maxRain = Math.max(weather.rain_1h ?? 0, weather.forecast_rain ?? 0);
  const condition = (weather.condition || "").toLowerCase();
  const description = (weather.description || "").toLowerCase();

  // FREEZE (Critical)
  if (minTemp <= THRESHOLDS.FREEZE) {
    alerts.push({
      type: "FREEZE", priority: "Critical", title: "Freeze Warning",
      body: buildBody(farmName, `Expected: ${minTemp}°C`, "Move vulnerable livestock before sunset."),
      icon: "❄️", farmName,
    });
  }
  // FROST (High)
  else if (minTemp <= THRESHOLDS.FROST) {
    alerts.push({
      type: "FROST", priority: "High", title: "Frost Advisory",
      body: buildBody(farmName, `Expected: ${minTemp}°C`, "Protect seedlings and young plants."),
      icon: "🌨️", farmName,
    });
  }

  // EXTREME HEAT (Critical)
  if (maxTemp >= THRESHOLDS.EXTREME_HEAT) {
    alerts.push({
      type: "HEATWAVE", priority: "Critical", title: "Extreme Heat Warning",
      body: buildBody(farmName, `Expected: ${maxTemp}°C`, "Ensure all livestock have water and shade."),
      icon: "🔥", farmName,
    });
  }
  // HEATWAVE (High)
  else if (maxTemp >= THRESHOLDS.HEATWAVE) {
    alerts.push({
      type: "HEATWAVE", priority: "High", title: "Heatwave Warning",
      body: buildBody(farmName, `Expected: ${maxTemp}°C`, "Increase water supply for livestock."),
      icon: "☀️", farmName,
    });
  }

  // FLOOD (Critical)
  if (maxRain >= THRESHOLDS.FLOOD_RISK) {
    alerts.push({
      type: "FLOOD", priority: "Critical", title: "Flood Warning",
      body: buildBody(farmName, `Rainfall: ${maxRain}mm`, "Move livestock from low-lying areas NOW."),
      icon: "🌊", farmName,
    });
  }
  // HEAVY RAIN (High)
  else if (maxRain >= THRESHOLDS.HEAVY_RAIN) {
    alerts.push({
      type: "HEAVY_RAIN", priority: "High", title: "Heavy Rain Warning",
      body: buildBody(farmName, `Rainfall: ${maxRain}mm`, "Delay planting and fertilizer application."),
      icon: "🌧️", farmName,
    });
  }

  // DANGEROUS WIND (Critical)
  if (maxWind >= THRESHOLDS.DANGEROUS_WIND) {
    alerts.push({
      type: "HIGH_WIND", priority: "Critical", title: "Dangerous Wind Warning",
      body: buildBody(farmName, `Wind: ${maxWind} km/h`, "Secure all equipment. Avoid outdoor operations."),
      icon: "💨", farmName,
    });
  }
  // STRONG WIND (High)
  else if (maxWind >= THRESHOLDS.STRONG_WIND) {
    alerts.push({
      type: "HIGH_WIND", priority: "High", title: "Strong Wind Advisory",
      body: buildBody(farmName, `Wind: ${maxWind} km/h`, "Postpone spraying. Secure loose equipment."),
      icon: "💨", farmName,
    });
  }

  // STORM (High)
  if (condition.includes("thunder") || condition.includes("storm")) {
    alerts.push({
      type: "STORM", priority: "High", title: "Thunderstorm Warning",
      body: buildBody(farmName, "Thunderstorm activity detected", "Avoid open fields. Delay livestock movement."),
      icon: "⛈️", farmName,
    });
  }

  // LIGHTNING (High) — from description keywords
  if (description.includes("lightning") && !condition.includes("thunder")) {
    alerts.push({
      type: "LIGHTNING", priority: "High", title: "Lightning Risk",
      body: buildBody(farmName, "Lightning activity expected", "Avoid open fields and tall structures."),
      icon: "⚡", farmName,
    });
  }

  // HAIL (Critical)
  if (description.includes("hail")) {
    alerts.push({
      type: "HAIL", priority: "Critical", title: "Hail Warning",
      body: buildBody(farmName, "Hail expected", "Move machinery under cover immediately."),
      icon: "🧊", farmName,
    });
  }

  return alerts;
}

function generateMorningBrief(weather: WeatherData, farmName: string): Alert[] {
  const riskLevel = getRiskLevel(weather);
  const recommendation = getMorningRecommendation(weather);

  return [{
    type: "MORNING_BRIEF", priority: "High",
    title: "Good Morning — Farm Brief",
    body: [
      farmName ? `Farm: ${farmName}` : "",
      `Today's Risk: ${riskLevel}`,
      `Weather: ${Math.round(weather.temp)}°C, ${weather.condition}`,
      recommendation,
    ].filter(Boolean).join("\n"),
    icon: "☀️", farmName,
  }];
}

// ═══════════════════════════════════════════════════════════════════════════════
// COOLDOWN & SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

async function checkCooldown(supabase: any, userId: string, alertType: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - COOLDOWN_HOURS * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("notification_history")
    .select("id")
    .eq("user_id", userId)
    .eq("alert_type", alertType)
    .gte("sent_at", cutoff)
    .limit(1);
  return (data && data.length > 0);
}

function isAlertEnabled(alertType: string, settings: any): boolean {
  if (settings?.enabled === false) return false;
  const typeMap: Record<string, string> = {
    FREEZE: "freeze", FROST: "frost", STORM: "storm",
    HEAVY_RAIN: "heavy_rain", LIGHTNING: "lightning",
    HEATWAVE: "heatwave", HIGH_WIND: "wind",
    FLOOD: "flood", HAIL: "hail", FIRE_DANGER: "fire_danger",
    MORNING_BRIEF: "morning_brief",
  };
  const key = typeMap[alertType];
  if (!key) return true;
  return settings[key] !== false;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getRiskLevel(weather: WeatherData): string {
  const minTemp = Math.min(weather.temp, weather.forecast_min ?? weather.temp);
  const maxTemp = Math.max(weather.temp, weather.forecast_max ?? weather.temp);
  const maxWind = Math.max(weather.wind_speed, weather.forecast_wind ?? 0);
  const maxRain = Math.max(weather.rain_1h ?? 0, weather.forecast_rain ?? 0);
  if (minTemp <= THRESHOLDS.FREEZE || maxTemp >= THRESHOLDS.EXTREME_HEAT || maxRain >= THRESHOLDS.FLOOD_RISK || maxWind >= THRESHOLDS.DANGEROUS_WIND) return "EXTREME";
  if (minTemp <= THRESHOLDS.FROST || maxTemp >= THRESHOLDS.HEATWAVE || maxRain >= THRESHOLDS.HEAVY_RAIN || maxWind >= THRESHOLDS.STRONG_WIND) return "HIGH";
  if (minTemp <= 5 || maxTemp >= 32 || maxRain >= 15 || maxWind >= 25) return "MODERATE";
  return "LOW";
}

function getMorningRecommendation(weather: WeatherData): string {
  const minTemp = Math.min(weather.temp, weather.forecast_min ?? weather.temp);
  const maxWind = Math.max(weather.wind_speed, weather.forecast_wind ?? 0);
  const maxRain = Math.max(weather.rain_1h ?? 0, weather.forecast_rain ?? 0);
  if (minTemp <= THRESHOLDS.FROST) return "Frost risk — protect crops and young livestock.";
  if (maxRain >= THRESHOLDS.HEAVY_RAIN) return "Heavy rain expected — delay field operations.";
  if (maxWind >= THRESHOLDS.STRONG_WIND) return "Strong wind — postpone spraying.";
  if (weather.temp >= THRESHOLDS.HEATWAVE) return "Very hot — ensure livestock have water and shade.";
  if (weather.condition.toLowerCase().includes("rain")) return "Rain expected — plan indoor work.";
  return "No severe weather expected. Good day for outdoor operations.";
}

function buildBody(farmName: string, detail: string, recommendation: string): string {
  const parts = [];
  if (farmName) parts.push(`Farm: ${farmName}`);
  parts.push(detail);
  parts.push(recommendation);
  return parts.join("\n");
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
