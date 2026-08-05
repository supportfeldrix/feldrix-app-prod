/**
 * Report Service -- generates structured reports from platform data.
 * Reuses existing intelligence/metrics. Returns report objects.
 */

import { getTemplate, getAllTemplates } from "./reportTemplateService";

function fmt(n) { return (n || 0).toLocaleString(); }
function fmtC(n) { return `R${(n || 0).toLocaleString()}`; }
function now() { return new Date().toISOString(); }

function buildReport({ template, summary, kpis, recommendations, generatedBy }) {
  return {
    id: `rpt-${Date.now()}`,
    templateId: template.id,
    title: template.title,
    description: template.description,
    sections: template.sections,
    charts: template.charts,
    summary,
    kpis,
    recommendations,
    generatedAt: now(),
    generatedBy: generatedBy || "Admin",
    version: "1.0",
    status: "ready",
  };
}

export function generateReport(templateId, ctx, adminName) {
  const template = getTemplate(templateId);
  if (!template) return null;
  const { intelligence, metrics, predictions, operations, health, timelineData } = ctx || {};

  switch (templateId) {
    case "executive": return buildReport({
      template,
      summary: intelligence?.summary?.briefing || "Executive overview generated.",
      kpis: [
        { label: "Health Score", value: `${intelligence?.overview?.healthScore ?? 0}/100` },
        { label: "MRR", value: fmtC(metrics?.revenueMonth ?? 0) },
        { label: "ARR", value: fmtC((metrics?.revenueMonth ?? 0) * 12) },
        { label: "Customers", value: fmt(metrics?.totalUsers ?? 0) },
        { label: "Active", value: `${metrics?.totalUsers > 0 ? Math.round(((metrics?.activeUsers ?? 0) / metrics.totalUsers) * 100) : 0}%` },
        { label: "Churn Risk", value: `${predictions?.churnPredictions?.riskScore ?? 0}%` },
      ],
      recommendations: [intelligence?.summary?.todaysFocus, intelligence?.summary?.topOpportunity?.action, intelligence?.summary?.topRisk?.action].filter(Boolean),
      generatedBy: adminName,
    });

    case "revenue": return buildReport({
      template,
      summary: `MRR ${fmtC(metrics?.revenueMonth ?? 0)}, ARR ${fmtC((metrics?.revenueMonth ?? 0) * 12)}. ${fmt(metrics?.proSubscribers ?? 0)} PRO subscriber(s).`,
      kpis: [
        { label: "MRR", value: fmtC(metrics?.revenueMonth ?? 0) },
        { label: "ARR", value: fmtC((metrics?.revenueMonth ?? 0) * 12) },
        { label: "PRO", value: fmt(metrics?.proSubscribers ?? 0) },
        { label: "Pending", value: fmt(metrics?.pendingPayments ?? 0) },
        { label: "Trend", value: predictions?.revenueForecast?.trend ?? "stable" },
      ],
      recommendations: ["Focus on PRO conversion to increase MRR", "Review pending payments promptly"],
      generatedBy: adminName,
    });

    case "customer": return buildReport({
      template,
      summary: `${fmt(metrics?.totalUsers ?? 0)} customers. ${metrics?.todaySignups ?? 0} new today. Churn risk ${predictions?.churnPredictions?.riskScore ?? 0}%.`,
      kpis: [
        { label: "Total", value: fmt(metrics?.totalUsers ?? 0) },
        { label: "Active", value: fmt(metrics?.activeUsers ?? 0) },
        { label: "New Today", value: fmt(metrics?.todaySignups ?? 0) },
        { label: "Churn Risk", value: `${predictions?.churnPredictions?.riskScore ?? 0}%` },
      ],
      recommendations: ["Engage inactive customers", "Monitor churn indicators"],
      generatedBy: adminName,
    });

    case "platform": return buildReport({
      template,
      summary: `${health ? Object.values(health.services).filter(s => s.status === "healthy").length : 0} services healthy.`,
      kpis: [
        { label: "Services", value: health ? `${Object.values(health.services).filter(s => s.status === "healthy").length}/${Object.values(health.services).length}` : "--" },
        { label: "Status", value: "Operational" },
      ],
      recommendations: ["Continue monitoring service health"],
      generatedBy: adminName,
    });

    case "operations": return buildReport({
      template,
      summary: `${operations?.queue?.total ?? 0} actions in queue. ${operations?.urgent?.critical ?? 0} critical.`,
      kpis: [
        { label: "Queue", value: fmt(operations?.queue?.total ?? 0) },
        { label: "Critical", value: fmt(operations?.urgent?.critical ?? 0) },
      ],
      recommendations: operations?.queue?.items?.slice(0, 3).map(i => i.title) || [],
      generatedBy: adminName,
    });

    default: return buildReport({ template, summary: "Report generated.", kpis: [], recommendations: [], generatedBy: adminName });
  }
}

export function getReportHistory() {
  // Returns placeholder -- future: stored in Supabase
  return [];
}

export { getAllTemplates, getTemplate };
