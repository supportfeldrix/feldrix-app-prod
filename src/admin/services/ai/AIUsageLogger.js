/**
 * AIUsageLogger -- stores a rolling log of AI interactions for the admin usage panel.
 */

const MAX_LOGS = 200;

export default class AIUsageLogger {
  constructor() {
    this.logs = [];
  }

  log({ model, inputTokens, outputTokens, duration, skill, success, error }) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      model: model || "unknown",
      inputTokens: inputTokens || 0,
      outputTokens: outputTokens || 0,
      duration: duration || 0,
      skill: skill || null,
      success: success !== false,
      error: error || null,
    });
    if (this.logs.length > MAX_LOGS) this.logs = this.logs.slice(-MAX_LOGS);
  }

  getRecent(n = 20) {
    return this.logs.slice(-n).reverse();
  }

  getAll() {
    return [...this.logs].reverse();
  }

  getSummary() {
    const total = this.logs.length;
    const successful = this.logs.filter(l => l.success).length;
    const totalTokens = this.logs.reduce((s, l) => s + (l.inputTokens || 0) + (l.outputTokens || 0), 0);
    const avgDuration = total > 0 ? Math.round(this.logs.reduce((s, l) => s + (l.duration || 0), 0) / total) : 0;
    return { total, successful, failed: total - successful, totalTokens, avgDuration };
  }

  clear() {
    this.logs = [];
  }
}
