/**
 * ============================================================
 * Feldrix Manager -- Skills Engine
 * Version 2.4.3
 *
 * The "hands" of Feldrix Manager. Each skill returns a
 * standardised SkillResult. OpenAI will later invoke these
 * skills directly via function calling.
 * ============================================================
 */

// --- Helpers ------------------------------------------------

function fmt(n) { return (n || 0).toLocaleString(); }
function fmtC(n) { return `R${(n || 0).toLocaleString()}`; }
function now() { return new Date().toISOString(); }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }

function skillResult({ success = true, title, summary, details = [], actions = [], navigation = null, exportAvailable = false }) {
  return { success, title, summary, details, actions, navigation, exportAvailable, timestamp: now() };
}

// --- REPORTING SKILLS ----------------------------------------

export function generateExecutiveReport(ctx) {
  const { intelligence, metrics, predictions } = ctx;
  const score = intelligence?.overview?.healthScore ?? 0;
  const status = cap(intelligence?.overview?.status ?? "unknown");
  const total = metrics?.totalUsers ?? 0;
  const mrr = metrics?.revenueMonth ?? 0;
  const arr = mrr * 12;
  const churn = predictions?.churnPredictions?.riskScore ?? 0;
  return skillResult({
    title: "Executive Report",
    summary: `Business Health ${score}/100 (${status}). ${fmt(total)} customers, MRR ${fmtC(mrr)}, ARR ${fmtC(arr)}. Churn risk ${churn}%.`,
    details: [
      `Health Score: ${score}/100`,
      `Status: ${status}`,
      `Total Customers: ${fmt(total)}`,
      `MRR: ${fmtC(mrr)}`,
      `ARR: ${fmtC(arr)}`,
      `Churn Risk: ${churn}%`,
      `Focus: ${intelligence?.summary?.todaysFocus || "Continue monitoring"}`,
    ],
    actions: ["Open Dashboard", "Export PDF", "View Forecast"],
    navigation: "/dashboard",
    exportAvailable: true,
  });
}

export function generateRevenueReport(ctx) {
  const { metrics, predictions } = ctx;
  const mrr = metrics?.revenueMonth ?? 0;
  const arr = mrr * 12;
  const pending = metrics?.pendingPayments ?? 0;
  const pro = metrics?.proSubscribers ?? 0;
  const trend = predictions?.revenueForecast?.trend ?? "stable";
  return skillResult({
    title: "Revenue Report",
    summary: `MRR ${fmtC(mrr)}, ARR ${fmtC(arr)}. ${fmt(pro)} PRO subscriber(s). Trend: ${cap(trend)}.`,
    details: [`MRR: ${fmtC(mrr)}`, `ARR: ${fmtC(arr)}`, `PRO Subscribers: ${fmt(pro)}`, `Pending Payments: ${pending}`, `Trend: ${cap(trend)}`],
    actions: ["Open Revenue Intelligence", "Open Payments", "Export CSV"],
    navigation: null,
    exportAvailable: true,
  });
}

export function generateCustomerReport(ctx) {
  const { metrics, predictions, intelligence } = ctx;
  const total = metrics?.totalUsers ?? 0;
  const active = metrics?.activeUsers ?? 0;
  const today = metrics?.todaySignups ?? 0;
  const churn = predictions?.churnPredictions?.riskScore ?? 0;
  const activePct = total > 0 ? Math.round((active / total) * 100) : 0;
  return skillResult({
    title: "Customer Report",
    summary: `${fmt(total)} customers, ${activePct}% active. ${today} new today. Churn risk ${churn}%.`,
    details: [`Total: ${fmt(total)}`, `Active: ${fmt(active)} (${activePct}%)`, `New Today: ${today}`, `Churn Risk: ${churn}%`],
    actions: ["Open Customer Intelligence", "Find Upgrade Candidates", "Export CSV"],
    navigation: null,
    exportAvailable: true,
  });
}

export function generatePlatformReport(ctx) {
  const { health, liveData } = ctx;
  const svcCount = health ? Object.values(health.services).length : 0;
  const healthy = health ? Object.values(health.services).filter(s => s.status === "healthy").length : 0;
  const online = liveData?.customers?.customersOnline ?? 0;
  return skillResult({
    title: "Platform Report",
    summary: `${healthy}/${svcCount} services healthy. ${fmt(online)} users online.`,
    details: [`Services Healthy: ${healthy}/${svcCount}`, `Users Online: ${fmt(online)}`, `Payments Today: ${liveData?.payments?.paymentsToday ?? 0}`],
    actions: ["Open Platform Intelligence", "Open System Health"],
    navigation: "/system",
    exportAvailable: false,
  });
}

export function generateOperationsReport(ctx) {
  const { operations } = ctx;
  const total = operations?.queue?.total ?? 0;
  const critical = operations?.urgent?.critical ?? 0;
  const topAction = operations?.actions?.topAction?.title ?? "No actions";
  return skillResult({
    title: "Operations Report",
    summary: `${total} action(s) in queue. ${critical} critical. Top: ${topAction}.`,
    details: [`Queue Size: ${total}`, `Critical: ${critical}`, `Top Action: ${topAction}`],
    actions: ["View Priority Actions", "Open Dashboard"],
    navigation: null,
    exportAvailable: true,
  });
}

export function generateWeeklySummary(ctx) {
  const { timelineData, metrics, intelligence } = ctx;
  const week = timelineData?.statistics?.eventsWeek ?? 0;
  const score = intelligence?.overview?.healthScore ?? 0;
  return skillResult({
    title: "Weekly Summary",
    summary: `${week} events this week. Health ${score}/100. ${fmt(metrics?.totalUsers ?? 0)} customers.`,
    details: [`Events This Week: ${week}`, `Health: ${score}/100`, `Customers: ${fmt(metrics?.totalUsers ?? 0)}`],
    actions: ["View Timeline", "Generate Executive Report"],
    exportAvailable: true,
  });
}

export function generateMonthlySummary(ctx) {
  const { timelineData, metrics, intelligence } = ctx;
  const month = timelineData?.statistics?.eventsMonth ?? 0;
  const score = intelligence?.overview?.healthScore ?? 0;
  const mrr = metrics?.revenueMonth ?? 0;
  return skillResult({
    title: "Monthly Summary",
    summary: `${month} events this month. Health ${score}/100. MRR ${fmtC(mrr)}.`,
    details: [`Events This Month: ${month}`, `Health: ${score}/100`, `MRR: ${fmtC(mrr)}`, `Customers: ${fmt(metrics?.totalUsers ?? 0)}`],
    actions: ["View Timeline", "Export Report"],
    exportAvailable: true,
  });
}

// --- EXPORT SKILLS (stubs -- return export-ready objects) -----

export function exportPDF(report) {
  return { format: "pdf", ready: true, reportTitle: report?.title ?? "Report", timestamp: now(), data: report };
}

export function exportExcel(report) {
  return { format: "xlsx", ready: true, reportTitle: report?.title ?? "Report", timestamp: now(), data: report };
}

export function exportCSV(report) {
  return { format: "csv", ready: true, reportTitle: report?.title ?? "Report", timestamp: now(), data: report };
}

// --- CUSTOMER SKILLS -----------------------------------------

export function findUpgradeCandidates(ctx) {
  const { metrics, predictions } = ctx;
  const total = metrics?.totalUsers ?? 0;
  const pro = metrics?.proSubscribers ?? 0;
  const starter = total - pro;
  const est = predictions?.upgradePredictions?.estimatedConversions ?? 0;
  return skillResult({
    title: "Upgrade Candidates",
    summary: `${fmt(starter)} Starter users. Estimated ${est} conversion(s) at current confidence.`,
    details: [`Starter Users: ${fmt(starter)}`, `Estimated Conversions: ${est}`, `Potential MRR: ${fmtC(est * 99)}`],
    actions: ["Open Customer Intelligence", "Send Upgrade Campaign"],
    exportAvailable: true,
  });
}

export function findInactiveCustomers(ctx) {
  const { metrics } = ctx;
  const total = metrics?.totalUsers ?? 0;
  const active = metrics?.activeUsers ?? 0;
  const inactive = total - active;
  return skillResult({
    title: "Inactive Customers",
    summary: `${fmt(inactive)} customer(s) inactive (no login in 30+ days).`,
    details: [`Total: ${fmt(total)}`, `Active: ${fmt(active)}`, `Inactive: ${fmt(inactive)}`],
    actions: ["Open User Management", "Send Re-engagement Email"],
    navigation: "/users",
    exportAvailable: true,
  });
}

export function findHighValueCustomers(ctx) {
  const { metrics } = ctx;
  const pro = metrics?.proSubscribers ?? 0;
  return skillResult({
    title: "High Value Customers",
    summary: `${fmt(pro)} PRO subscriber(s) generating recurring revenue.`,
    details: [`PRO Subscribers: ${fmt(pro)}`, `MRR Contribution: ${fmtC((metrics?.revenueMonth ?? 0))}`],
    actions: ["Open Customer Intelligence", "View Subscriptions"],
    exportAvailable: true,
  });
}

export function findCustomersAtRisk(ctx) {
  const { predictions, metrics } = ctx;
  const churn = predictions?.churnPredictions?.riskScore ?? 0;
  const total = metrics?.totalUsers ?? 0;
  const atRisk = Math.round(total * (churn / 100));
  return skillResult({
    title: "Customers At Risk",
    summary: `Churn risk ${churn}%. Estimated ${fmt(atRisk)} customer(s) at risk of leaving.`,
    details: [`Churn Score: ${churn}%`, `Estimated At-Risk: ${fmt(atRisk)}`, `Total Customers: ${fmt(total)}`],
    actions: ["Open Customer Intelligence", "Send Retention Campaign"],
    exportAvailable: true,
  });
}

// --- REVENUE SKILLS ------------------------------------------

export function getRevenueSummary(ctx) {
  const { metrics, predictions } = ctx;
  const mrr = metrics?.revenueMonth ?? 0;
  const arr = mrr * 12;
  const trend = predictions?.revenueForecast?.trend ?? "stable";
  return skillResult({
    title: "Revenue Summary",
    summary: `MRR ${fmtC(mrr)}, ARR ${fmtC(arr)}. Trend: ${cap(trend)}.`,
    details: [`MRR: ${fmtC(mrr)}`, `ARR: ${fmtC(arr)}`, `Trend: ${cap(trend)}`],
    actions: ["Open Revenue Intelligence", "Forecast Revenue", "Export Report"],
    exportAvailable: true,
  });
}

export function getMRRSummary(ctx) {
  const { metrics } = ctx;
  const mrr = metrics?.revenueMonth ?? 0;
  return skillResult({ title: "MRR Summary", summary: `Current MRR: ${fmtC(mrr)}.`, details: [`MRR: ${fmtC(mrr)}`], actions: ["Open Revenue Intelligence"], exportAvailable: false });
}

export function getARRSummary(ctx) {
  const { metrics } = ctx;
  const arr = (metrics?.revenueMonth ?? 0) * 12;
  return skillResult({ title: "ARR Summary", summary: `Projected ARR: ${fmtC(arr)}.`, details: [`ARR: ${fmtC(arr)}`], actions: ["Open Revenue Intelligence"], exportAvailable: false });
}

export function getPaymentFailures(ctx) {
  const { metrics } = ctx;
  const failed = metrics?.failedPayments ?? 0;
  const pending = metrics?.pendingPayments ?? 0;
  return skillResult({ title: "Payment Failures", summary: `${failed} failed, ${pending} pending.`, details: [`Failed: ${failed}`, `Pending: ${pending}`], actions: ["Open Payments", "Review Failed"], navigation: "/payments", exportAvailable: false });
}

export function getOutstandingInvoices(ctx) {
  const { metrics } = ctx;
  const pending = metrics?.pendingPayments ?? 0;
  return skillResult({ title: "Outstanding Invoices", summary: `${pending} invoice(s) outstanding.`, details: [`Pending: ${pending}`], actions: ["Open Payments"], navigation: "/payments", exportAvailable: false });
}

// --- OPERATIONS SKILLS ---------------------------------------

export function getTodaysPriorities(ctx) {
  const { operations } = ctx;
  const items = operations?.queue?.items?.slice(0, 5) ?? [];
  const lines = items.map((it, i) => `${i + 1}. ${it.title}`);
  return skillResult({
    title: "Today's Priorities",
    summary: items.length > 0 ? `${items.length} priority action(s).` : "No actions in queue.",
    details: lines.length > 0 ? lines : ["All clear - no pending actions"],
    actions: ["Open Operations Centre", "View Dashboard"],
    exportAvailable: false,
  });
}

export function getBusinessHealthExplanation(ctx) {
  const { intelligence } = ctx;
  const score = intelligence?.overview?.healthScore ?? 0;
  const briefing = intelligence?.summary?.briefing ?? "No data.";
  return skillResult({
    title: "Business Health Explained",
    summary: `Score ${score}/100. ${cap(intelligence?.overview?.status ?? "unknown")}.`,
    details: [briefing, `Focus: ${intelligence?.summary?.todaysFocus ?? "Monitor"}`],
    actions: ["Open Executive Insights", "View Forecast"],
    exportAvailable: false,
  });
}

export function getTopRisks(ctx) {
  const { intelligence, predictions } = ctx;
  const risk = intelligence?.summary?.topRisk;
  const churn = predictions?.churnPredictions?.riskScore ?? 0;
  const details = [];
  if (risk) details.push(`${cap(risk.priority)}: ${risk.title}`);
  details.push(`Churn Risk: ${churn}%`);
  return skillResult({
    title: "Top Risks",
    summary: risk ? `${risk.title} (${risk.priority})` : "No critical risks.",
    details,
    actions: ["Open Executive Insights", "View Customer Health"],
    exportAvailable: false,
  });
}

export function getTopOpportunities(ctx) {
  const { intelligence, operations } = ctx;
  const opp = intelligence?.summary?.topOpportunity;
  const potMRR = operations?.revenueOps?.potentialMRR ?? 0;
  return skillResult({
    title: "Top Opportunities",
    summary: opp ? `${opp.title}. Potential +${fmtC(potMRR)}/mo.` : "No specific opportunities identified.",
    details: opp ? [opp.title, opp.action, `Potential MRR: +${fmtC(potMRR)}`] : ["Continue monitoring"],
    actions: ["Open Executive Insights", "Find Upgrade Candidates"],
    exportAvailable: false,
  });
}

export function summarizeTimeline(ctx) {
  const { timelineData } = ctx;
  const s = timelineData?.statistics;
  if (!s) return skillResult({ title: "Timeline Summary", summary: "Timeline loading.", details: [], actions: [] });
  return skillResult({
    title: "Timeline Summary",
    summary: `Today: ${s.eventsToday}, Week: ${s.eventsWeek}, Month: ${s.eventsMonth}. Most active: ${s.mostActiveModule ?? "--"}.`,
    details: [`Events Today: ${s.eventsToday}`, `Events Week: ${s.eventsWeek}`, `Events Month: ${s.eventsMonth}`, `Most Active: ${s.mostActiveModule ?? "--"}`, `Top Customer: ${s.mostActiveCustomer ?? "--"}`],
    actions: ["View Live Operations", "Generate Weekly Summary"],
    exportAvailable: true,
  });
}

export function summarizeDashboard(ctx) {
  return generateExecutiveReport(ctx);
}

// --- PLATFORM SKILLS -----------------------------------------

export function getPlatformHealth(ctx) {
  return generatePlatformReport(ctx);
}

export function getSupportSummary(ctx) {
  const { liveData } = ctx;
  const open = liveData?.support?.openTickets ?? 0;
  return skillResult({ title: "Support Summary", summary: `${open} open ticket(s).`, details: [`Open Tickets: ${open}`], actions: ["Open Support"], navigation: "/support", exportAvailable: false });
}

export function getNotificationSummary(ctx) {
  return skillResult({ title: "Notification Summary", summary: "Notification data available in the Notifications section.", details: [], actions: ["Open Notifications"], navigation: "/notifications", exportAvailable: false });
}

export function getAuditSummary(ctx) {
  const { timelineData } = ctx;
  const auditEvents = (timelineData?.timeline ?? []).filter(e => e.category === "Security" || e.category === "Operations").length;
  return skillResult({ title: "Audit Summary", summary: `${auditEvents} audit-related event(s) in the last 30 days.`, details: [`Security/Operations Events: ${auditEvents}`], actions: ["Open Audit Log"], navigation: "/audit", exportAvailable: false });
}

// --- SKILL REGISTRY (for OpenAI function calling) -----------

export const SKILL_REGISTRY = {
  generateExecutiveReport,
  generateRevenueReport,
  generateCustomerReport,
  generatePlatformReport,
  generateOperationsReport,
  generateWeeklySummary,
  generateMonthlySummary,
  exportPDF,
  exportExcel,
  exportCSV,
  findUpgradeCandidates,
  findInactiveCustomers,
  findHighValueCustomers,
  findCustomersAtRisk,
  getRevenueSummary,
  getMRRSummary,
  getARRSummary,
  getPaymentFailures,
  getOutstandingInvoices,
  getTodaysPriorities,
  getBusinessHealthExplanation,
  getTopRisks,
  getTopOpportunities,
  summarizeTimeline,
  summarizeDashboard,
  getPlatformHealth,
  getSupportSummary,
  getNotificationSummary,
  getAuditSummary,
};

// --- SKILL INTENT DETECTION ----------------------------------

const SKILL_INTENTS = [
  { keys: ["executive report", "generate report", "full report"], skill: "generateExecutiveReport" },
  { keys: ["revenue report"], skill: "generateRevenueReport" },
  { keys: ["customer report"], skill: "generateCustomerReport" },
  { keys: ["platform report"], skill: "generatePlatformReport" },
  { keys: ["operations report", "ops report"], skill: "generateOperationsReport" },
  { keys: ["weekly summary", "this week summary", "week report"], skill: "generateWeeklySummary" },
  { keys: ["monthly summary", "month report", "this month"], skill: "generateMonthlySummary" },
  { keys: ["upgrade candidate", "who can upgrade", "potential upgrade"], skill: "findUpgradeCandidates" },
  { keys: ["inactive customer", "inactive user", "dormant", "not logged in"], skill: "findInactiveCustomers" },
  { keys: ["high value", "best customer", "top customer", "vip"], skill: "findHighValueCustomers" },
  { keys: ["at risk", "churn risk", "about to leave", "leaving"], skill: "findCustomersAtRisk" },
  { keys: ["revenue summary", "show revenue", "revenue status"], skill: "getRevenueSummary" },
  { keys: ["mrr"], skill: "getMRRSummary" },
  { keys: ["arr"], skill: "getARRSummary" },
  { keys: ["failed payment", "payment failure"], skill: "getPaymentFailures" },
  { keys: ["outstanding", "invoice", "unpaid"], skill: "getOutstandingInvoices" },
  { keys: ["priorities", "what should i do", "todo", "action queue", "task"], skill: "getTodaysPriorities" },
  { keys: ["explain health", "why health", "health drop", "health explain"], skill: "getBusinessHealthExplanation" },
  { keys: ["top risk", "biggest risk", "danger", "problem"], skill: "getTopRisks" },
  { keys: ["opportunity", "growth opportunity", "biggest opportunity"], skill: "getTopOpportunities" },
  { keys: ["timeline summary", "what happened", "recent events"], skill: "summarizeTimeline" },
  { keys: ["dashboard summary", "summarize dashboard", "overview"], skill: "summarizeDashboard" },
  { keys: ["platform health", "system status", "infrastructure"], skill: "getPlatformHealth" },
  { keys: ["support summary", "ticket", "support status"], skill: "getSupportSummary" },
  { keys: ["notification summary", "broadcasts"], skill: "getNotificationSummary" },
  { keys: ["audit summary", "audit log", "security events"], skill: "getAuditSummary" },
];

export function detectSkillIntent(text) {
  const t = text.toLowerCase().trim();
  for (const si of SKILL_INTENTS) {
    if (si.keys.some(k => t.includes(k))) return si.skill;
  }
  return null;
}

export function executeSkill(skillName, ctx) {
  const fn = SKILL_REGISTRY[skillName];
  if (!fn) return null;
  return fn(ctx);
}
