/**
 * TokenTracker -- tracks input/output token consumption per session and cumulative.
 */

export default class TokenTracker {
  constructor() {
    this.inputTokens = 0;
    this.outputTokens = 0;
    this.requests = 0;
    this.dailyInput = 0;
    this.dailyOutput = 0;
    this.lastResetDate = new Date().toDateString();
  }

  add(input, output) {
    this._checkDayReset();
    this.inputTokens += input;
    this.outputTokens += output;
    this.dailyInput += input;
    this.dailyOutput += output;
    this.requests++;
  }

  getSummary() {
    this._checkDayReset();
    return {
      totalInput: this.inputTokens,
      totalOutput: this.outputTokens,
      totalTokens: this.inputTokens + this.outputTokens,
      dailyInput: this.dailyInput,
      dailyOutput: this.dailyOutput,
      dailyTotal: this.dailyInput + this.dailyOutput,
      requests: this.requests,
    };
  }

  reset() {
    this.inputTokens = 0;
    this.outputTokens = 0;
    this.requests = 0;
    this.dailyInput = 0;
    this.dailyOutput = 0;
  }

  _checkDayReset() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailyInput = 0;
      this.dailyOutput = 0;
      this.lastResetDate = today;
    }
  }
}
