/**
 * ConversationContext -- holds the current platform state snapshot
 * passed to the AI for context injection.
 * Updated each time the user sends a message.
 */

export function buildConversationContext(data) {
  const { intelligence, metrics, health, predictions, operations, liveData, timelineData } = data || {};
  return {
    healthScore: intelligence?.overview?.healthScore ?? null,
    status: intelligence?.overview?.status ?? "unknown",
    totalUsers: metrics?.totalUsers ?? 0,
    activeUsers: metrics?.activeUsers ?? 0,
    todaySignups: metrics?.todaySignups ?? 0,
    mrr: metrics?.revenueMonth ?? 0,
    arr: (metrics?.revenueMonth ?? 0) * 12,
    proSubscribers: metrics?.proSubscribers ?? 0,
    pendingPayments: metrics?.pendingPayments ?? 0,
    failedPayments: metrics?.failedPayments ?? 0,
    churnRisk: predictions?.churnPredictions?.riskScore ?? 0,
    servicesHealthy: health ? Object.values(health.services).filter(s => s.status === "healthy").length : 0,
    servicesTotal: health ? Object.values(health.services).length : 0,
    customersOnline: liveData?.customers?.customersOnline ?? 0,
    eventsToday: timelineData?.statistics?.eventsToday ?? 0,
    eventsWeek: timelineData?.statistics?.eventsWeek ?? 0,
    topRisk: intelligence?.summary?.topRisk?.title ?? null,
    topOpportunity: intelligence?.summary?.topOpportunity?.title ?? null,
    todaysFocus: intelligence?.summary?.todaysFocus ?? null,
    queueSize: operations?.queue?.total ?? 0,
  };
}
