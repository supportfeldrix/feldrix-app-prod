/**
 * CostTracker -- estimates cost based on token usage and model pricing.
 */

// Approximate pricing per 1M tokens (USD)
const PRICING = {
  "gpt-4o":       { input: 2.50, output: 10.00 },
  "gpt-4o-mini":  { input: 0.15, output: 0.60 },
  "gpt-4-turbo":  { input: 10.00, output: 30.00 },
};

export default class CostTracker {
  constructor() {
    this.totalCost = 0;
    this.dailyCost = 0;
    this.monthlyCost = 0;
    this.lastResetDate = new Date().toDateString();
    this.lastResetMonth = new Date().getMonth();
  }

  add(inputTokens, outputTokens, model = "gpt-4o") {
    this._checkReset();
    const pricing = PRICING[model] || PRICING["gpt-4o"];
    const cost = (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
    this.totalCost += cost;
    this.dailyCost += cost;
    this.monthlyCost += cost;
  }

  getSummary() {
    this._checkReset();
    return {
      totalCost: Math.round(this.totalCost * 10000) / 10000,
      dailyCost: Math.round(this.dailyCost * 10000) / 10000,
      monthlyCost: Math.round(this.monthlyCost * 10000) / 10000,
      estimatedMonthlyCost: Math.round(this.dailyCost * 30 * 10000) / 10000,
      currency: "USD",
    };
  }

  _checkReset() {
    const today = new Date().toDateString();
    const month = new Date().getMonth();
    if (today !== this.lastResetDate) { this.dailyCost = 0; this.lastResetDate = today; }
    if (month !== this.lastResetMonth) { this.monthlyCost = 0; this.lastResetMonth = month; }
  }
}
