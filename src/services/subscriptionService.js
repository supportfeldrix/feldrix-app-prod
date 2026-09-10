import { supabase } from "../supabaseClient";
import { getCurrentUser } from "./profileService";

/*
|--------------------------------------------------------------------------
| Feature Matrix
|--------------------------------------------------------------------------
*/

const PLAN_FEATURES = {
  starter: [
    "dashboard",
    "livestock",
    "crops",
    "machinery",
    "planner",
    "finance",
    "reports",
    "weather",
  ],

  pro: [
    "dashboard",
    "livestock",
    "crops",
    "machinery",
    "planner",
    "finance",
    "reports",
    "weather",
    "ai",
    "farm_intelligence",
    "predictive_analytics",
    "automation",
    "advanced_reports",
    "weekly_summary",
    "priority_support",
  ],
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizePlan(plan) {
  return String(plan || "starter").toLowerCase();
}

/*
|--------------------------------------------------------------------------
| Expiry / Effective Plan (Sprint 51)
|--------------------------------------------------------------------------
| The server-side subscription-renewal Edge Function (daily cron) is the
| authoritative process that transitions expired PRO subscriptions to
| Starter in the database. These frontend helpers are a defensive layer so
| that a session that is already open, or a user who opens the app before
| the daily job has run, never receives PRO entitlements past the expiry
| boundary. They compute an EFFECTIVE plan from the same fields; they do
| not weaken the server-side source of truth.
|
| Date boundary: renewal_date is a DATE. A subscription is valid THROUGH
| its renewal_date (inclusive). It is considered expired only once the
| current local day is strictly AFTER renewal_date — i.e. "valid through
| Sept 7 → Starter from Sept 8". This matches the Edge Function's `lt`
| comparison and the existing canReactivateWithoutPayment semantics.
*/

/**
 * True when a PRO subscription's paid period has ended (renewal_date is in
 * the past) and it has not been renewed. Starter plans and subscriptions
 * with no renewal_date are never "expired".
 */
export function isSubscriptionExpired(subscription) {
  if (!subscription) return false;

  // Starter / free never expires into anything.
  if (normalizePlan(subscription.plan) !== "pro") return false;

  // Already terminal — treat as not-PRO via effective plan below, not here.
  if (subscription.status === "Cancelled") return true;

  if (!subscription.renewal_date) return false;

  const renewal = new Date(subscription.renewal_date);
  if (Number.isNaN(renewal.getTime())) return false;

  // Compare on calendar-day boundaries in local time. Valid through the
  // renewal day; expired from the day after.
  const renewalDay = new Date(
    renewal.getFullYear(),
    renewal.getMonth(),
    renewal.getDate()
  );
  const today = new Date();
  const todayDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  return renewalDay < todayDay;
}

/**
 * The plan the user is actually entitled to right now. An expired PRO
 * subscription resolves to "Starter" even if the stored plan column still
 * says "Pro" (e.g. the daily reconciliation job has not run yet).
 */
export function getEffectivePlan(subscription) {
  if (!subscription) return "Starter";

  if (isSubscriptionExpired(subscription)) return "Starter";

  return subscription.plan || "Starter";
}

/*
|--------------------------------------------------------------------------
| Core Subscription
|--------------------------------------------------------------------------
*/

export async function getSubscription() {
  const user = await getCurrentUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return await createSubscription();
  }

  return data;
}

export async function createSubscription() {
  const user = await getCurrentUser();

  if (!user) return null;

  // Check whether a subscription already exists
  const { data: existing, error: existingError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) return existing;

  // Create Starter subscription
  const subscription = {
    user_id: user.id,
    plan: "Starter",
    status: "Active",
    billing_cycle: "Monthly",
    price: 0,
    payment_provider: null,
    payment_reference: null,
    renewal_date: null,
  };

  const { data, error } = await supabase
    .from("subscriptions")
    .insert(subscription)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateSubscription(values) {
  const user = await getCurrentUser();

  if (!user) return null;

  const subscription = await getSubscription();

  if (!subscription) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .update(values)
    .eq("id", subscription.id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/*
|--------------------------------------------------------------------------
| Plans
|--------------------------------------------------------------------------
*/

export async function upgradeToPro() {
  return updateSubscription({
    plan: "Pro",
    status: "Active",
    billing_cycle: "Monthly",
    price: 99,
  });
}

export async function downgradeToStarter() {
  return updateSubscription({
    plan: "Starter",
    status: "Active",
    billing_cycle: "Monthly",
    price: 0,
  });
}

export async function cancelSubscription() {
  return updateSubscription({
    status: "Pending Cancellation",
  });
}

export async function reactivateSubscription() {
  return updateSubscription({
    status: "Active",
  });
}

/*
|--------------------------------------------------------------------------
| Status Helpers
|--------------------------------------------------------------------------
*/

export async function isPro() {
  const subscription = await getSubscription();

  if (!subscription) return false;

  // Use the EFFECTIVE plan so an expired PRO no longer reports as PRO.
  return normalizePlan(getEffectivePlan(subscription)) === "pro";
}

export async function isStarter() {
  const subscription = await getSubscription();

  if (!subscription) return true;

  return normalizePlan(getEffectivePlan(subscription)) === "starter";
}

export async function isActive() {
  const subscription = await getSubscription();

  if (!subscription) return false;

  return subscription.status === "Active";
}

export async function isTrial() {
  const subscription = await getSubscription();

  if (!subscription) return false;

  return subscription.status === "Trial";
}

/*
|--------------------------------------------------------------------------
| Feature Permissions
|--------------------------------------------------------------------------
*/

export async function hasFeature(feature) {
  const subscription = await getSubscription();

  if (!subscription) return false;

  // Gate on the EFFECTIVE plan so PRO-only features are withdrawn the moment
  // the subscription is expired, even before the server job downgrades it.
  const plan = normalizePlan(getEffectivePlan(subscription));

  const features =
    PLAN_FEATURES[plan] || PLAN_FEATURES.starter;

  return features.includes(feature);
}

export async function getAvailableFeatures() {
  const subscription = await getSubscription();

  if (!subscription) return [];

  const plan = normalizePlan(getEffectivePlan(subscription));

  return PLAN_FEATURES[plan] || PLAN_FEATURES.starter;
}

/*
|--------------------------------------------------------------------------
| Billing Helpers
|--------------------------------------------------------------------------
*/

export async function getCurrentPlan() {
  const subscription = await getSubscription();

  return getEffectivePlan(subscription);
}

export async function getSubscriptionStatus() {
  const subscription = await getSubscription();

  return subscription?.status ?? "Inactive";
}

export async function getSubscriptionPrice() {
  const subscription = await getSubscription();

  return subscription?.price ?? 0;
}
