/**
 * ============================================================
 * Feldrix Manager(tm) -- Action Engine
 * Version 2.4.2
 *
 * Transforms Manager from a conversational assistant into
 * an Executive AI that performs platform actions.
 *
 * Extensible for: Reports, Email, Tasks, OpenAI, Voice.
 * ============================================================
 */

// ---- Action Type Registry ---------------------------------

export const ACTION_TYPES = {
  NAVIGATE:          "NAVIGATE",
  OPEN_WORKSPACE:    "OPEN_WORKSPACE",
  OPEN_CUSTOMER:     "OPEN_CUSTOMER",
  OPEN_FARM:         "OPEN_FARM",
  OPEN_SUBSCRIPTION: "OPEN_SUBSCRIPTION",
  OPEN_PAYMENT:      "OPEN_PAYMENT",
  SHOW_INFO:         "SHOW_INFO",
  MULTI_ACTION:      "MULTI_ACTION",
};

// ---- Page Route Map ----------------------------------------

const PAGE_ROUTES = {
  dashboard:     "/dashboard",
  users:         "/users",
  farms:         "/farms",
  subscriptions: "/subscriptions",
  payments:      "/payments",
  analytics:     "/analytics",
  support:       "/support",
  notifications: "/notifications",
  system:        "/system",
  audit:         "/audit",
  settings:      "/settings",
};

// ---- Analytics Workspace IDs (match AdminDashboard state) --

export const WORKSPACE_IDS = {
  growth:    "growth",
  customers: "customers",
  revenue:   "revenue",
  farms:     "farms",
  platform:  "platform",
  insights:  "insights",
};

// ---- Labels for confirmation messages ----------------------

const WORKSPACE_LABELS = {
  growth:    "Business Growth",
  customers: "Customer Intelligence",
  revenue:   "Revenue Intelligence",
  farms:     "Farm Operations",
  platform:  "Platform Intelligence",
  insights:  "Executive Insights",
};

const PAGE_LABELS = {
  dashboard:     "Dashboard",
  users:         "User Management",
  farms:         "Farms",
  subscriptions: "Subscriptions",
  payments:      "Payments",
  analytics:     "Analytics",
  support:       "Support",
  notifications: "Notifications",
  system:        "System Health",
  audit:         "Audit Log",
  settings:      "Settings",
};

// ---- Follow-up Suggestions Map ----------------------------

const FOLLOWUPS = {
  growth:        ["View Revenue Intelligence", "Open Customer Intelligence", "Show 30-day forecast"],
  customers:     ["Open User Management", "View Revenue Intelligence", "Show churn risks"],
  revenue:       ["Go to Payments", "Open Business Growth", "Show 30-day forecast"],
  farms:         ["Go to Farms", "Open Platform Intelligence", "View Customer Intelligence"],
  platform:      ["Go to System Health", "Open Executive Insights", "View Live Operations"],
  insights:      ["Show today's summary", "View priority actions", "Open Revenue Intelligence"],
  users:         ["View Customer Intelligence", "Go to Subscriptions", "Show customer health"],
  farms_page:    ["Open Farm Operations workspace", "View Platform Intelligence"],
  payments:      ["Open Revenue Intelligence", "View Subscriptions", "Show business growth"],
  subscriptions: ["Go to Payments", "Open Customer Intelligence", "View Revenue Intelligence"],
  analytics:     ["Open Business Growth", "Open Revenue Intelligence", "View Executive Insights"],
  support:       ["Go to Notifications", "View Audit Log", "Open System Health"],
  notifications: ["Go to Support", "View Audit Log"],
  system:        ["Open Platform Intelligence", "View Audit Log", "Go to Dashboard"],
  audit:         ["Go to Settings", "View System Health"],
  settings:      ["Go to Dashboard", "View Audit Log"],
  dashboard:     ["Open Business Growth", "View Revenue Intelligence", "Show today's summary"],
};

// ---- Intent Detection --------------------------------------

const NAVIGATE_INTENTS = [
  { keys: ["dashboard", "home", "main"], page: "dashboard" },
  { keys: ["user", "customer", "people", "member", "registr"], page: "users" },
  { keys: ["farm", "livestock", "crop", "cattle", "planner"], page: "farms" },
  { keys: ["subscript", "plan", "tier"], page: "subscriptions" },
  { keys: ["payment", "billing", "invoice", "receipt", "transaction"], page: "payments" },
  { keys: ["analytic", "chart", "graph", "hub", "report"], page: "analytics" },
  { keys: ["support", "ticket", "help", "issue"], page: "support" },
  { keys: ["notif", "broadcast", "message", "alert"], page: "notifications" },
  { keys: ["system", "health", "infrastructure", "uptime", "service"], page: "system" },
  { keys: ["audit", "log", "history", "activity"], page: "audit" },
  { keys: ["setting", "config", "admin"], page: "settings" },
];

const WORKSPACE_INTENTS = [
  { keys: ["business growth", "growth", "acquisition", "customer growth", "mrr trend", "revenue trend"], workspace: "growth" },
  { keys: ["customer intel", "customer health", "retention", "churn", "engagement", "segment"], workspace: "customers" },
  { keys: ["revenue intel", "revenue dash", "revenue workspace", "revenue analysis", "mrr", "arr", "income"], workspace: "revenue" },
  { keys: ["farm operation", "farm analytic", "livestock analyt", "crop analyt", "planner analyt"], workspace: "farms" },
  { keys: ["platform intel", "platform health", "platform dash", "usage", "feature usage", "logins", "activity"], workspace: "platform" },
  { keys: ["executive insight", "insight", "ai insight", "prediction", "opportunit", "risk analys", "business health"], workspace: "insights" },
];

export function detectIntent(text) {
  const t = text.toLowerCase().trim();

  // 1. Check workspace intents first (more specific)
  for (const wi of WORKSPACE_INTENTS) {
    if (wi.keys.some(k => t.includes(k))) {
      return { type: ACTION_TYPES.OPEN_WORKSPACE, workspace: wi.workspace };
    }
  }

  // 2. Check page navigation
  const isNavPhrase = /\b(go to|open|show|navigate|take me|launch|view|visit)\b/.test(t);
  if (isNavPhrase || t.startsWith("open ") || t.startsWith("go to ") || t.startsWith("show ")) {
    for (const ni of NAVIGATE_INTENTS) {
      if (ni.keys.some(k => t.includes(k))) {
        return { type: ACTION_TYPES.NAVIGATE, page: ni.page };
      }
    }
  }

  // 3. Fallback: bare keyword navigation (no verb needed)
  for (const ni of NAVIGATE_INTENTS) {
    if (ni.keys.some(k => t.includes(k))) {
      // Only if the keyword is dominant (short query)
      if (t.length < 30) {
        return { type: ACTION_TYPES.NAVIGATE, page: ni.page };
      }
    }
  }

  return null; // Not an action intent
}

// ---- Action Execution --------------------------------------

/**
 * executeAction()
 * Called by ManagerPanel when an action intent is detected.
 * Returns an action result object consumed by the panel.
 */
export function executeAction(intent, context = {}) {
  if (!intent) return null;

  switch (intent.type) {

    case ACTION_TYPES.OPEN_WORKSPACE: {
      const label = WORKSPACE_LABELS[intent.workspace] || intent.workspace;
      return {
        type: ACTION_TYPES.OPEN_WORKSPACE,
        workspace: intent.workspace,
        message: `Opening **${label}** workspace...`,
        confirmText: `${label} is now open. You can explore your analytics, close the workspace and return here any time.`,
        followups: FOLLOWUPS[intent.workspace] || [],
      };
    }

    case ACTION_TYPES.NAVIGATE: {
      const label = PAGE_LABELS[intent.page] || intent.page;
      const route = PAGE_ROUTES[intent.page];
      return {
        type: ACTION_TYPES.NAVIGATE,
        page: intent.page,
        route,
        message: `Opening **${label}**...`,
        confirmText: `Navigating to ${label}.`,
        followups: FOLLOWUPS[intent.page] || [],
      };
    }

    default:
      return null;
  }
}

// ---- Page Navigation ---------------------------------------

/**
 * navigateToPage()
 * Direct navigation by page key. Usable from SuggestedPrompts.
 */
export function navigateToPage(pageKey) {
  return PAGE_ROUTES[pageKey] || null;
}

// ---- Workspace Opener --------------------------------------

/**
 * openAnalyticsWorkspace()
 * Returns workspace ID to set in parent state.
 */
export function openAnalyticsWorkspace(workspaceKey) {
  return WORKSPACE_IDS[workspaceKey] || null;
}

// ---- Entity Openers (future) --------------------------------

export function openCustomer(userId) {
  return { type: ACTION_TYPES.NAVIGATE, route: `/users?id=${userId}`, label: "Customer Profile" };
}

export function openFarm(farmId) {
  return { type: ACTION_TYPES.NAVIGATE, route: `/farms?id=${farmId}`, label: "Farm Profile" };
}

export function openSubscription(userId) {
  return { type: ACTION_TYPES.NAVIGATE, route: `/subscriptions?user=${userId}`, label: "Subscription" };
}

export function openPayment(paymentId) {
  return { type: ACTION_TYPES.NAVIGATE, route: `/payments?id=${paymentId}`, label: "Payment Detail" };
}

// ---- Action Response Builder --------------------------------

/**
 * generateActionResponse()
 * Builds the message object returned to the conversation.
 */
export function generateActionResponse(actionResult) {
  if (!actionResult) return null;
  return {
    id: `action-${Date.now()}`,
    role: "assistant",
    type: "action",
    timestamp: new Date().toISOString(),
    content: actionResult.message,
    confirmText: actionResult.confirmText,
    followups: actionResult.followups || [],
    actionType: actionResult.type,
    actionWorkspace: actionResult.workspace || null,
    actionRoute: actionResult.route || null,
  };
}

// ---- Quick Action Chips (for ManagerPanel) ------------------

export const QUICK_ACTIONS = [
  { label: "Open Revenue Intelligence", intent: { type: ACTION_TYPES.OPEN_WORKSPACE, workspace: "revenue" } },
  { label: "Open Customer Intelligence", intent: { type: ACTION_TYPES.OPEN_WORKSPACE, workspace: "customers" } },
  { label: "Open Business Growth", intent: { type: ACTION_TYPES.OPEN_WORKSPACE, workspace: "growth" } },
  { label: "Open Farm Operations", intent: { type: ACTION_TYPES.OPEN_WORKSPACE, workspace: "farms" } },
  { label: "Open Platform Intelligence", intent: { type: ACTION_TYPES.OPEN_WORKSPACE, workspace: "platform" } },
  { label: "Open Executive Insights", intent: { type: ACTION_TYPES.OPEN_WORKSPACE, workspace: "insights" } },
  { label: "Go to Payments", intent: { type: ACTION_TYPES.NAVIGATE, page: "payments" } },
  { label: "Go to Users", intent: { type: ACTION_TYPES.NAVIGATE, page: "users" } },
  { label: "Go to System Health", intent: { type: ACTION_TYPES.NAVIGATE, page: "system" } },
  { label: "Go to Settings", intent: { type: ACTION_TYPES.NAVIGATE, page: "settings" } },
];
