/**
 * ============================================================
 * Feldrix Onboarding — Context Provider (Production)
 * Sprint 45.2 — Error handling, memoisation, graceful fallbacks
 *
 * NEVER blocks the dashboard. Silently degrades on any error.
 * ============================================================
 */

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import {
  evaluateSteps,
  getOnboardingState,
  markDismissed as persistDismiss,
  markDashboardVisited as persistDashboardVisit,
  markComplete as persistComplete,
  reopenOnboarding as persistReopen,
} from "../services/onboarding/onboardingService";
import { calculateProgress, getNextStep } from "../utils/onboardingUtils";
import { getCurrentUser, getProfile } from "../services/profileService";

const OnboardingContext = createContext({
  steps: [],
  progress: 0,
  isComplete: false,
  isDismissed: false,
  isLoading: true,
  phase: "hidden",
  nextStep: null,
  firstName: "",
  farmName: "",
  refresh: () => {},
  dismiss: () => {},
  reopen: () => {},
  markDashboardVisited: () => {},
});

/**
 * Phase state machine:
 * - "loading"       → evaluating steps
 * - "welcome"       → first-time user, 0% progress
 * - "journey"       → user in progress (1–99%)
 * - "celebration"   → 100% complete, not yet dismissed
 * - "hidden"        → dismissed, completed+dismissed, or error
 */
function resolvePhase(state, progress) {
  if (state.completed && state.dismissed) return "hidden";
  if (state.dismissed) return "hidden";
  if (progress === 100) return "celebration";
  if (progress === 0) return "welcome";
  return "journey";
}

export function OnboardingProvider({ children }) {
  const [steps, setSteps] = useState([]);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState({ dismissed: false, completed: false });
  const [isLoading, setIsLoading] = useState(true);
  const [phase, setPhase] = useState("loading");
  const [userId, setUserId] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [farmName, setFarmName] = useState("");

  // ─── Core evaluation ────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        setPhase("hidden");
        setIsLoading(false);
        return;
      }

      setUserId(user.id);

      // Load profile for personalisation (non-blocking)
      let profile = null;
      try {
        profile = await getProfile();
      } catch { /* proceed without profile */ }

      const name =
        profile?.full_name?.split(" ")[0] ||
        user.user_metadata?.full_name?.split(" ")[0] ||
        user.user_metadata?.name?.split(" ")[0] ||
        user.email?.split("@")[0] ||
        "Farmer";
      setFirstName(name);
      setFarmName(profile?.farm_name || "");

      // Load persisted onboarding state (graceful fallback)
      let onboardingState;
      try {
        onboardingState = await getOnboardingState(user.id);
      } catch {
        onboardingState = { dismissed: false, completed: false, dashboard_visited: false };
      }
      setState(onboardingState);

      // If fully done, skip expensive step evaluation
      if (onboardingState.completed && onboardingState.dismissed) {
        setPhase("hidden");
        setIsLoading(false);
        return;
      }

      // Evaluate all steps from real database data (parallel queries)
      let evaluated;
      try {
        evaluated = await evaluateSteps(user.id);
      } catch {
        // If evaluation fails entirely, hide onboarding (never block the app)
        setPhase("hidden");
        setIsLoading(false);
        return;
      }
      setSteps(evaluated);

      const prog = calculateProgress(evaluated);
      setProgress(prog);

      const newPhase = resolvePhase(onboardingState, prog);
      setPhase(newPhase);

      // If 100% and not yet marked, persist completion
      if (prog === 100 && !onboardingState.completed) {
        try {
          const updated = await persistComplete(user.id);
          setState(updated);
        } catch { /* non-blocking */ }
      }
    } catch (err) {
      // Absolute fallback — never crash the app
      console.warn("[Onboarding] Init failed:", err?.message);
      setPhase("hidden");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ─── Actions ─────────────────────────────────────────────────
  const dismiss = useCallback(async () => {
    setPhase("hidden");
    if (userId) {
      try {
        const updated = await persistDismiss(userId);
        setState(updated);
      } catch { /* non-blocking */ }
    }
  }, [userId]);

  const reopen = useCallback(async () => {
    if (userId) {
      try {
        await persistReopen(userId);
      } catch { /* proceed with local reopen */ }
    }
    setState((prev) => ({ ...prev, dismissed: false }));
    setIsLoading(true);
    await refresh();
  }, [userId, refresh]);

  const markDashboardVisited = useCallback(async () => {
    if (!userId) return;
    try {
      await persistDashboardVisit(userId);
      // Silent refresh — don't show loading
      const evaluated = await evaluateSteps(userId);
      setSteps(evaluated);
      const prog = calculateProgress(evaluated);
      setProgress(prog);
      if (prog === 100 && !state.completed) {
        setPhase("celebration");
      }
    } catch { /* non-blocking */ }
  }, [userId, state.completed]);

  // ─── Memoised derived values ────────────────────────────────
  const nextStep = useMemo(() => getNextStep(steps), [steps]);
  const isComplete = progress === 100;
  const isDismissed = state.dismissed;

  // ─── Context value (memoised to prevent unnecessary re-renders) ──
  const value = useMemo(
    () => ({
      steps,
      progress,
      isComplete,
      isDismissed,
      isLoading,
      phase,
      nextStep,
      firstName,
      farmName,
      refresh,
      dismiss,
      reopen,
      markDashboardVisited,
    }),
    [steps, progress, isComplete, isDismissed, isLoading, phase, nextStep, firstName, farmName, refresh, dismiss, reopen, markDashboardVisited]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}

export default OnboardingContext;
