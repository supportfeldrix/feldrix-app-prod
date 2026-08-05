/**
 * AIProvider -- Abstract base class for AI providers.
 * Every provider (OpenAI, Claude, Gemini, Azure, Local) implements this.
 */
export default class AIProvider {
  constructor(config = {}) {
    this.config = config;
    this.name = "base";
    this.model = "";
    this.ready = false;
  }

  async initialize() { throw new Error("initialize() not implemented"); }
  async chat(messages, tools, options) { throw new Error("chat() not implemented"); }
  async testConnection() { throw new Error("testConnection() not implemented"); }
  getUsage() { return { inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0 }; }
  destroy() {}
}
