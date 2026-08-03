/**
 * ============================================================
 * Feldrix Onboarding — Step Definitions (Extensible Registry)
 * Sprint 45.1
 *
 * Each step defines:
 *  - id: unique identifier
 *  - title: display title
 *  - description: short helper text
 *  - icon: emoji icon
 *  - navigateTo: route to open when user clicks action
 *  - actionLabel: button text
 *  - evaluate(supabase, userId): async → boolean (is step complete?)
 *
 * To add future steps, simply append to ONBOARDING_STEPS array.
 * ============================================================
 */

export const ONBOARDING_STEPS = [
  {
    id: "farm-profile",
    title: "Complete Farm Profile",
    description: "Add your farm name, location, and type so Feldrix can personalise your experience.",
    icon: "🏡",
    navigateTo: "/account",
    actionLabel: "Edit Profile",
    evaluate: async (supabase, userId) => {
      const { data } = await supabase
        .from("profiles")
        .select("farm_name, farm_type, province")
        .eq("id", userId)
        .single();
      return !!(data?.farm_name && data?.farm_type);
    },
  },
  {
    id: "first-record",
    title: "Add First Livestock or Crop",
    description: "Record your first animal or plant your first crop to get started.",
    icon: "🐄",
    navigateTo: "/livestock",
    actionLabel: "Add Record",
    evaluate: async (supabase, userId) => {
      const [{ count: livestock }, { count: crops }] = await Promise.all([
        supabase
          .from("livestock")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("crops")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);
      return (livestock || 0) > 0 || (crops || 0) > 0;
    },
  },
  {
    id: "first-task",
    title: "Create a Planner Task",
    description: "Plan your first farm activity — vaccinations, planting, maintenance.",
    icon: "📋",
    navigateTo: "/tasks",
    actionLabel: "Create Task",
    evaluate: async (supabase, userId) => {
      const { count } = await supabase
        .from("planner_tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      return (count || 0) > 0;
    },
  },
  {
    id: "first-finance",
    title: "Record a Transaction",
    description: "Log your first income or expense to start tracking farm finances.",
    icon: "💳",
    navigateTo: "/finance",
    actionLabel: "Add Transaction",
    evaluate: async (supabase, userId) => {
      const { count } = await supabase
        .from("finance_records")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      return (count || 0) > 0;
    },
  },
  {
    id: "dashboard-visited",
    title: "Visit Your Dashboard",
    description: "See your entire farm at a glance — health scores, weather, and priorities.",
    icon: "🏠",
    navigateTo: "/dashboard",
    actionLabel: "Go to Dashboard",
    evaluate: async (supabase, userId) => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_state")
        .eq("id", userId)
        .single();
      return data?.onboarding_state?.dashboard_visited === true;
    },
  },
];

export default ONBOARDING_STEPS;
