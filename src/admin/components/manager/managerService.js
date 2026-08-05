/**
 * ============================================================
 * Feldrix Manager - Intelligence Service
 * Version 2.4.3 -- Skills Engine integration
 *
 * Aggregates platform intelligence into natural-language
 * responses. Skills Engine is checked before conversational
 * intent -- if a skill matches, it takes priority.
 * ============================================================
 */

import { runIntelligenceAnalysis } from "../../services/adminExecutiveIntelligenceService";
import { runPredictiveAnalysis } from "../../services/adminPredictiveIntelligenceService";
import { runOperationsAnalysis } from "../../services/adminOperationsService";
import { runLiveMonitoring } from "../../services/adminLiveMonitoringService";
import { runExecutiveTimeline } from "../../services/adminExecutiveTimelineService";
import { detectSkillIntent, executeSkill } from "../../services/managerSkillService";

// --- Helpers -------------------------------------------------

function fmt(n) { return (n || 0).toLocaleString(); }
function fmtCurrency(n) { return `R${(n || 0).toLocaleString()}`; }
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }

// --- Greeting Message ----------------------------------------

export function buildGreeting(adminName, intelligence, metrics, health) {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const name = adminName?.split(" ")[0] || "Admin";

  const score = intelligence?.overview?.healthScore ?? null;
  const status = intelligence?.overview?.status ?? "unknown";
  const totalUsers = metrics?.totalUsers ?? 0;
  const todaySignups = metrics?.todaySignups ?? 0;
  const mrr = metrics?.revenueMonth ?? 0;
  const pending = metrics?.pendingPayments ?? 0;

  const lines = [
    `Good ${timeOfDay}, ${name}. I'm Feldrix Manager - your Executive Operations Manager.`,
    `I've completed today's platform analysis.`,
  ];

  const highlights = [];
  if (score !== null) highlights.push(`**Business Health:** ${score}/100 (${cap(status)})`);
  highlights.push(`**Customers:** ${fmt(totalUsers)} registered${todaySignups > 0 ? `, ${todaySignups} new today` : ""}`);
  if (mrr > 0) highlights.push(`**Revenue:** MRR ${fmtCurrency(mrr)}`);
  else highlights.push(`**Revenue:** No MRR recorded yet - first PRO conversion is the priority`);
  if (pending > 0) highlights.push(`**Attention:** ${pending} pending payment(s) require review`);
  if (health) {
    const svcCount = Object.values(health.services || {}).length;
    const healthySvc = Object.values(health.services || {}).filter(s => s.status === "healthy").length;
    highlights.push(`**Platform:** ${healthySvc}/${svcCount} services operational`);
  }

  return {
    id: "greeting",
    role: "assistant",
    content: lines.join(" "),
    highlights,
    suffix: "What would you like to know?",
    timestamp: new Date().toISOString(),
    type: "greeting",
  };
}

// --- Intent Detection ----------------------------------------

function detectIntent(text) {
  const t = text.toLowerCase();
  if (t.match(/health|score|status/)) return "health";
  if (t.match(/revenue|mrr|arr|payment|money|income/)) return "revenue";
  if (t.match(/customer|user|signup|registration|growth/)) return "customers";
  if (t.match(/farm|livestock|crop|planner/)) return "farms";
  if (t.match(/platform|infra|service|uptime|system/)) return "platform";
  if (t.match(/opportunit|grow|upgrade|convert/)) return "opportunities";
  if (t.match(/risk|churn|danger|problem|issue|fail/)) return "risks";
  if (t.match(/forecast|predict|next|future|30 day/)) return "forecast";
  if (t.match(/yesterday|last|week|month|history|timeline/)) return "history";
  if (t.match(/summar|brief|report|overview|today/)) return "summary";
  if (t.match(/action|priority|todo|task|what should/)) return "actions";
  if (t.match(/live|online|now|current|real.?time/)) return "live";
  if (t.match(/open|show|go to|navigate|analytics/)) return "navigate";
  if (t.match(/help|what can|command/)) return "help";
  return "summary";
}

// --- Response Generators -------------------------------------

function respondHealth(intel, predictions, health) {
  if (!intel) return { content: "Business health data is still loading. Please try again in a moment.", type: "text" };
  const score = intel.overview.healthScore;
  const status = cap(intel.overview.status);
  const briefing = intel.summary.briefing;
  return {
    content: `**Business Health Score: ${score}/100 - ${status}**\n\n${briefing}`,
    highlights: [
      `Health Status: ${status}`,
      intel.summary.topRisk ? `Top Risk: ${intel.summary.topRisk.title}` : "No critical risks detected",
      intel.summary.topOpportunity ? `Top Opportunity: ${intel.summary.topOpportunity.title}` : null,
    ].filter(Boolean),
    type: "health",
  };
}

function respondRevenue(metrics, predictions, intel) {
  const mrr = metrics?.revenueMonth ?? 0;
  const arr = mrr * 12;
  const pending = metrics?.pendingPayments ?? 0;
  const pro = metrics?.proSubscribers ?? 0;

  if (mrr === 0) {
    return {
      content: `**No MRR recorded yet.**\n\nThe platform has ${fmt(metrics?.totalUsers)} registered customers but no PRO subscribers generating revenue. Converting the first PRO subscriber is the single highest-impact action available.`,
      highlights: [`Customers: ${fmt(metrics?.totalUsers)}`, `PRO Subscribers: ${fmt(pro)}`, "Recommended: Drive first PRO conversion"],
      type: "revenue",
    };
  }
  const content = `**Revenue Summary**\n\nCurrent MRR is ${fmtCurrency(mrr)}, projecting an ARR of ${fmtCurrency(arr)}. There are ${fmt(pro)} active PRO subscriber(s).${pending > 0 ? ` ${pending} payment(s) are currently pending and require attention.` : " All payments are processed with no outstanding issues."}`;
  const forecast = predictions?.revenueForecast;
  const trend = forecast?.trend === "growing" ? "growing" : forecast?.trend === "declining" ? "declining" : "stable";
  return {
    content,
    highlights: [`MRR: ${fmtCurrency(mrr)}`, `ARR: ${fmtCurrency(arr)}`, `Revenue Trend: ${cap(trend)}`, `Pending Payments: ${pending}`],
    type: "revenue",
  };
}

function respondCustomers(metrics, intel, predictions) {
  const total = metrics?.totalUsers ?? 0;
  const active = metrics?.activeUsers ?? 0;
  const today = metrics?.todaySignups ?? 0;
  const activePct = total > 0 ? Math.round((active / total) * 100) : 0;
  const churn = predictions?.churnPredictions?.riskScore ?? 0;
  const content = `**Customer Intelligence**\n\n${fmt(total)} total registered customers with ${activePct}% actively engaged. ${today > 0 ? `${today} new signup(s) today - acquisition is active.` : "No new signups today."} Churn risk score is ${churn}%.`;
  return {
    content,
    highlights: [`Total: ${fmt(total)}`, `Active: ${activePct}%`, `New Today: ${today}`, `Churn Risk: ${churn}%`],
    type: "customers",
  };
}

function respondOpportunities(intel, operations) {
  const opp = intel?.summary?.topOpportunity;
  if (!opp && !operations) return { content: "No specific opportunities identified at this time. The platform is operating normally.", type: "text" };
  let content = `**Top Opportunity**\n\n`;
  if (opp) content += `**${opp.title}**\n${opp.action}`;
  if (operations?.revenueOps?.potentialMRR > 0) content += `\n\nEstimated revenue opportunity: ${fmtCurrency(operations.revenueOps.potentialMRR)}/month (${operations.revenueOps.upgradeCount} potential conversion(s) at ${operations.revenueOps.upgradeConfidence}% confidence).`;
  return { content, highlights: opp ? [opp.title, opp.action?.substring(0, 80)] : [], type: "opportunities" };
}

function respondRisks(intel, predictions) {
  const risk = intel?.summary?.topRisk;
  const churn = predictions?.churnPredictions?.riskScore ?? 0;
  if (!risk) return { content: `No critical risks detected. Churn risk score is ${churn}%. Continue monitoring engagement trends.`, type: "text" };
  const content = `**Top Risk - ${cap(risk.priority)}**\n\n**${risk.title}**\n${risk.action}\n\nChurn risk score: ${churn}%.`;
  return { content, highlights: [`Priority: ${cap(risk.priority)}`, risk.title, `Churn: ${churn}%`], type: "risks" };
}

function respondForecast(predictions, metrics) {
  if (!predictions) return { content: "Forecast data is still loading.", type: "text" };
  const f = predictions.executiveForecast.forecast;
  const content = `**30-Day Forecast** (Confidence: ${f.confidence}%)\n\n- Expected customers: **${fmt(f.expectedCustomers)}**\n- Expected PRO: **${fmt(f.expectedPRO)}**\n- Expected MRR: **${f.expectedMRR > 0 ? fmtCurrency(f.expectedMRR) : "-"}**\n- Projected Health: **${f.projectedHealth}/100**\n\n${predictions.executiveForecast.summary.today}`;
  return { content, highlights: [`Customers: ${fmt(f.expectedCustomers)}`, `PRO: ${fmt(f.expectedPRO)}`, `Confidence: ${f.confidence}%`], type: "forecast" };
}

function respondSummary(intel, metrics, predictions) {
  const score = intel?.overview?.healthScore;
  const focus = intel?.summary?.todaysFocus;
  const briefing = intel?.summary?.briefing;
  const total = metrics?.totalUsers ?? 0;
  const mrr = metrics?.revenueMonth ?? 0;
  const content = `**Today's Executive Summary**\n\n${briefing || "Platform is operating normally."}\n\n**Today's Focus:** ${focus || "Continue monitoring platform growth."}\n\nKey figures: ${fmt(total)} customers, ${mrr > 0 ? fmtCurrency(mrr) + " MRR" : "no MRR yet"}, Business Health ${score ?? "-"}/100.`;
  return { content, highlights: score ? [`Health: ${score}/100`, `Customers: ${fmt(total)}`, `MRR: ${mrr > 0 ? fmtCurrency(mrr) : "-"}`] : [], type: "summary" };
}

function respondActions(operations) {
  if (!operations?.queue?.items?.length) return { content: "No actions in the queue at this time. The platform is operating normally.", type: "text" };
  const items = operations.queue.items.slice(0, 4);
  const lines = items.map((item, i) => `${i + 1}. **${item.title}** - ${item.reason}`);
  const content = `**Today's Priority Actions**\n\n${lines.join("\n")}\n\nTotal actions in queue: ${operations.queue.total}`;
  return { content, highlights: items.map(i => i.title).slice(0, 3), type: "actions" };
}

function respondLive(liveData) {
  if (!liveData) return { content: "Live monitoring data is loading.", type: "text" };
  const svcStatuses = (liveData.platform?.services || []).map(s => `${s.name}: ${s.status}`);
  const online = liveData.customers?.customersOnline ?? 0;
  const paymentsToday = liveData.payments?.paymentsToday ?? 0;
  const alerts = liveData.alerts?.filter(a => a.severity !== "info") ?? [];
  const content = `**Live Platform Status**\n\n${svcStatuses.join(" . ")}\n\n${fmt(online)} user(s) currently active. ${paymentsToday} payment(s) processed today.${alerts.length > 0 ? `\n\n${alerts.length} alert(s) active: ${alerts.map(a => a.title).join(", ")}` : "\n\nNo active alerts."}`;
  return { content, highlights: [`Online: ${fmt(online)}`, `Payments Today: ${paymentsToday}`, `Alerts: ${alerts.length}`], type: "live" };
}

function respondHistory(timelineData) {
  if (!timelineData?.statistics) return { content: "Timeline data is loading.", type: "text" };
  const s = timelineData.statistics;
  const recent = timelineData.timeline?.slice(0, 5) ?? [];
  const lines = recent.map(e => `- ${e.title} - ${e.description?.substring(0, 60)}`);
  const content = `**Recent Activity Summary**\n\nEvents today: ${s.eventsToday}, this week: ${s.eventsWeek}, this month: ${s.eventsMonth}.\n\nMost active module: **${s.mostActiveModule || "-"}**\n\n**Recent events:**\n${lines.join("\n")}`;
  return { content, highlights: [`Today: ${s.eventsToday}`, `This Week: ${s.eventsWeek}`, `Module: ${s.mostActiveModule}`], type: "history" };
}

function respondHelp() {
  return {
    content: `**Feldrix Manager - Available Commands**\n\nYou can ask me:\n- Business health and status\n- Revenue and MRR analysis\n- Customer growth and engagement\n- Farm operations overview\n- Platform infrastructure status\n- Risk and opportunity analysis\n- 30-day forecasts and predictions\n- Today's priorities and action queue\n- Recent activity and timeline\n- Live platform monitoring\n\n**Navigation commands:**\nSay "Open Revenue Intelligence", "Go to Payments", "Open Customer Intelligence" and I will take you there directly.\n\nI respond using your real platform data, updated continuously.`,
    type: "help",
  };
}

// --- Master Response Function --------------------------------

export function generateResponse(userText, context) {
  const { intelligence, predictions, operations, metrics, health, liveData, timelineData } = context;

  // 1. Skills Engine takes priority -- check if this is a skill request
  const skillName = detectSkillIntent(userText);
  if (skillName) {
    const result = executeSkill(skillName, context);
    if (result) {
      return {
        id: `skill-${Date.now()}`,
        role: "assistant",
        timestamp: new Date().toISOString(),
        type: "skill",
        content: `**${result.title}**\n\n${result.summary}`,
        highlights: result.details.slice(0, 5),
        followups: result.actions || [],
        navigation: result.navigation,
        exportAvailable: result.exportAvailable,
        skillResult: result,
      };
    }
  }

  // 2. Conversational intent fallback
  const intent = detectIntent(userText);

  let response;
  switch (intent) {
    case "health": response = respondHealth(intelligence, predictions, health); break;
    case "revenue": response = respondRevenue(metrics, predictions, intelligence); break;
    case "customers": response = respondCustomers(metrics, intelligence, predictions); break;
    case "farms": response = { content: `**Farm Operations**\n\nFarm activity data is available in the Farm Operations workspace. Click "Open Farm Operations" below or use the Executive Analytics Hub on the dashboard.`, highlights: ["Open Farm Operations workspace for detailed analytics"], type: "farms" }; break;
    case "platform": response = respondLive(liveData); break;
    case "opportunities": response = respondOpportunities(intelligence, operations); break;
    case "risks": response = respondRisks(intelligence, predictions); break;
    case "forecast": response = respondForecast(predictions, metrics); break;
    case "history": response = respondHistory(timelineData); break;
    case "summary": response = respondSummary(intelligence, metrics, predictions); break;
    case "actions": response = respondActions(operations); break;
    case "live": response = respondLive(liveData); break;
    case "help": response = respondHelp(); break;
    default: response = respondSummary(intelligence, metrics, predictions);
  }

  return {
    id: `msg-${Date.now()}`,
    role: "assistant",
    timestamp: new Date().toISOString(),
    ...response,
  };
}

// --- Suggested Prompts ---------------------------------------

export const SUGGESTED_PROMPTS = [
  { id: "health", label: "Business health score" },
  { id: "today", label: "Today's summary" },
  { id: "opportunities", label: "Show opportunities" },
  { id: "risks", label: "Top risks today" },
  { id: "revenue", label: "Revenue status" },
  { id: "forecast", label: "30-day forecast" },
  { id: "customers", label: "Customer insights" },
  { id: "actions", label: "Priority actions" },
  { id: "live", label: "Live platform status" },
  { id: "history", label: "Recent activity" },
];
