/**
 * Report Template Service -- defines reusable report templates.
 * Each template describes what a report contains.
 */

export const REPORT_TEMPLATES = {
  executive: {
    id: "executive",
    title: "Executive Report",
    description: "Complete business overview with health, revenue, customers, and recommendations.",
    sections: ["Executive Summary", "Business Health", "Revenue", "Customers", "Platform", "Recommendations"],
    kpis: ["Health Score", "MRR", "ARR", "Total Customers", "Active %", "Churn Risk"],
    charts: ["Customer Growth", "Revenue Trend", "Subscription Breakdown"],
    icon: "Assessment",
  },
  revenue: {
    id: "revenue",
    title: "Revenue Report",
    description: "MRR, ARR, payments, subscriptions, and revenue forecasting.",
    sections: ["Revenue Summary", "MRR Breakdown", "Payments", "Forecast", "Recommendations"],
    kpis: ["MRR", "ARR", "PRO Subscribers", "Pending Payments", "Revenue Trend"],
    charts: ["Revenue Trend", "Payment History"],
    icon: "Payments",
  },
  customer: {
    id: "customer",
    title: "Customer Report",
    description: "Customer growth, engagement, health segments, and churn analysis.",
    sections: ["Customer Summary", "Growth", "Health Segments", "Churn Risk", "Recommendations"],
    kpis: ["Total Customers", "Active", "New This Month", "Churn Risk", "Healthy %"],
    charts: ["Customer Growth", "Health Distribution"],
    icon: "Groups",
  },
  subscription: {
    id: "subscription",
    title: "Subscription Report",
    description: "Plan distribution, conversion rates, and upgrade opportunities.",
    sections: ["Plan Distribution", "Conversions", "Upgrades", "Recommendations"],
    kpis: ["Total Subscriptions", "PRO", "Starter", "Conversion Rate"],
    charts: ["Subscription Breakdown"],
    icon: "CreditCard",
  },
  platform: {
    id: "platform",
    title: "Platform Health Report",
    description: "Infrastructure status, uptime, performance, and feature usage.",
    sections: ["Platform Status", "Services", "Activity", "Feature Usage", "Recommendations"],
    kpis: ["Uptime", "Services Online", "Daily Logins", "Top Feature"],
    charts: ["Platform Activity", "Feature Usage"],
    icon: "MonitorHeart",
  },
  operations: {
    id: "operations",
    title: "Operations Report",
    description: "Priority queue, business impact, and action recommendations.",
    sections: ["Operations Queue", "Impact Analysis", "Revenue Opportunities", "Urgent Items"],
    kpis: ["Queue Size", "Critical Items", "Revenue Opportunity", "Time to Complete"],
    charts: [],
    icon: "TaskAlt",
  },
  support: {
    id: "support",
    title: "Support Report",
    description: "Support tickets, resolution times, and customer satisfaction.",
    sections: ["Ticket Summary", "Resolution", "Categories", "Recommendations"],
    kpis: ["Open Tickets", "Resolved Today", "Avg Resolution Time"],
    charts: [],
    icon: "SupportAgent",
  },
  audit: {
    id: "audit",
    title: "Audit Report",
    description: "Security events, admin actions, and compliance monitoring.",
    sections: ["Audit Summary", "Security Events", "Admin Actions", "Compliance"],
    kpis: ["Events This Month", "Security Events", "Admin Actions"],
    charts: [],
    icon: "Policy",
  },
  system: {
    id: "system",
    title: "System Report",
    description: "Database health, deployments, maintenance, and system metrics.",
    sections: ["System Status", "Database", "Deployments", "Maintenance"],
    kpis: ["Version", "Environment", "Database Status"],
    charts: [],
    icon: "Storage",
  },
};

export function getTemplate(id) { return REPORT_TEMPLATES[id] || null; }
export function getAllTemplates() { return Object.values(REPORT_TEMPLATES); }
