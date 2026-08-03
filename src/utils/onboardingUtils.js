/**
 * ============================================================
 * Feldrix Onboarding — Utility Functions
 * Sprint 45.1
 * ============================================================
 */

/**
 * Calculates progress percentage from evaluated steps.
 * Never hard-coded — always derived from real step results.
 */
export function calculateProgress(steps) {
  if (!steps || steps.length === 0) return 0;
  const completed = steps.filter((s) => s.complete).length;
  return Math.round((completed / steps.length) * 100);
}

/**
 * Estimates remaining setup time based on incomplete steps.
 * Each step averages ~1 minute.
 */
export function estimateRemainingTime(steps) {
  if (!steps || steps.length === 0) return "~5 minutes";
  const incomplete = steps.filter((s) => !s.complete).length;
  if (incomplete === 0) return "Complete!";
  if (incomplete === 1) return "~1 minute";
  return `~${incomplete} minutes`;
}

/**
 * Finds the next recommended step (first incomplete step).
 */
export function getNextStep(steps) {
  if (!steps || steps.length === 0) return null;
  return steps.find((s) => !s.complete) || null;
}

/**
 * Returns a time-of-day greeting.
 */
export function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 18) return "Good Afternoon";
  return "Good Evening";
}

/**
 * Generates a personalised welcome message.
 */
export function getWelcomeMessage(firstName, farmName) {
  if (farmName) {
    return `Let's get ${farmName} set up on Feldrix.`;
  }
  return "Let's prepare your farm for success.";
}
