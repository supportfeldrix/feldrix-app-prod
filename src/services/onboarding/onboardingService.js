/**
 * ============================================================
 * Feldrix Onboarding — Core Service
 * Sprint 45.1
 *
 * Evaluates onboarding progress from real database data.
 * Persists state to profiles.onboarding_state (JSONB).
 * ============================================================
 */

import { supabase } from "../../supabaseClient";
import { ONBOARDING_STEPS } from "./onboardingSteps";

/**
 * Evaluates all onboarding steps against real database data.
 * Returns an array of { ...step, complete: boolean }
 */
export async function evaluateSteps(userId) {
  const results = await Promise.all(
    ONBOARDING_STEPS.map(async (step) => {
      try {
        const complete = await step.evaluate(supabase, userId);
        return { ...step, complete: !!complete };
      } catch (err) {
        console.warn(`[Onboarding] Failed to evaluate step "${step.id}":`, err.message);
        return { ...step, complete: false };
      }
    })
  );
  return results;
}

/**
 * Reads the onboarding_state JSON from the user's profile.
 * Returns a safe default if the column doesn't exist yet.
 */
export async function getOnboardingState(userId) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("onboarding_state")
      .eq("id", userId)
      .single();

    if (error) throw error;

    return data?.onboarding_state || getDefaultState();
  } catch {
    return getDefaultState();
  }
}

/**
 * Persists updated onboarding state to the profile.
 */
export async function saveOnboardingState(userId, state) {
  try {
    const updatedState = {
      ...state,
      last_seen: new Date().toISOString(),
      version: 1,
    };

    await supabase
      .from("profiles")
      .update({ onboarding_state: updatedState })
      .eq("id", userId);

    return updatedState;
  } catch (err) {
    console.warn("[Onboarding] Failed to save state:", err.message);
    return state;
  }
}

/**
 * Marks the onboarding as dismissed (user closed the overlay).
 */
export async function markDismissed(userId) {
  const current = await getOnboardingState(userId);
  return saveOnboardingState(userId, { ...current, dismissed: true });
}

/**
 * Marks the dashboard as visited.
 */
export async function markDashboardVisited(userId) {
  const current = await getOnboardingState(userId);
  if (current.dashboard_visited) return current;
  return saveOnboardingState(userId, { ...current, dashboard_visited: true });
}

/**
 * Marks onboarding as fully complete.
 */
export async function markComplete(userId) {
  const current = await getOnboardingState(userId);
  return saveOnboardingState(userId, {
    ...current,
    completed: true,
    completed_at: new Date().toISOString(),
  });
}

/**
 * Reopens onboarding (from Help or Account).
 */
export async function reopenOnboarding(userId) {
  const current = await getOnboardingState(userId);
  return saveOnboardingState(userId, { ...current, dismissed: false });
}

/**
 * Default state for new users or when column doesn't exist.
 */
function getDefaultState() {
  return {
    dismissed: false,
    completed: false,
    completed_at: null,
    dashboard_visited: false,
    last_seen: null,
    version: 1,
  };
}
