/**
 * AIPlatform -- the main entry point for AI interactions.
 * Orchestrates provider, context, tools, memory, and tracking.
 * Reusable by both Admin Manager and future Farmer Manager.
 */

import OpenAIProvider from "./OpenAIProvider";
import { buildSystemPrompt } from "./SystemPrompt";
import ConversationMemory from "./ConversationMemory";
import { PromptBuilder } from "./PromptBuilder";
import ToolExecutor from "./ToolExecutor";
import TokenTracker from "./TokenTracker";
import CostTracker from "./CostTracker";
import AIUsageLogger from "./AIUsageLogger";
import { getDefaultProvider } from "./ProviderRegistry";

export default class AIPlatform {
  constructor() {
    this.provider = null;
    this.memory = new ConversationMemory();
    this.tokenTracker = new TokenTracker();
    this.costTracker = new CostTracker();
    this.usageLogger = new AIUsageLogger();
    this.toolExecutor = new ToolExecutor();
    this.ready = false;
    this.config = { provider: getDefaultProvider(), model: "gpt-4o", temperature: 0.2, maxTokens: 1024 };
  }

  async initialize(apiKey, options = {}) {
    const cfg = { ...this.config, ...options, apiKey };
    this.config = cfg;
    if (cfg.provider === "openai" && apiKey) {
      this.provider = new OpenAIProvider(cfg);
      await this.provider.initialize();
      this.ready = true;
    }
    return this.ready;
  }

  isReady() { return this.ready && !!this.provider; }

  async chat(userText, platformContext, adminName) {
    if (!this.isReady()) return null;
    const start = Date.now();
    const systemPrompt = buildSystemPrompt(adminName, platformContext);
    const messages = PromptBuilder.build(systemPrompt, this.memory.getMessages(), userText);
    const tools = this.toolExecutor.getToolDefinitions();

    try {
      const result = await this.provider.chat(messages, tools, { temperature: this.config.temperature, max_tokens: this.config.maxTokens });

      // Handle tool calls
      if (result.toolCalls?.length > 0) {
        const toolResults = this.toolExecutor.executeBatch(result.toolCalls, platformContext);
        const followUp = await this.provider.chat(
          [...messages, { role: "assistant", content: null, tool_calls: result.toolCalls }, ...toolResults.map(tr => ({ role: "tool", tool_call_id: tr.id, content: JSON.stringify(tr.result) }))],
          tools, { temperature: this.config.temperature, max_tokens: this.config.maxTokens }
        );
        result.content = followUp.content;
        result.usage = { input: (result.usage?.input || 0) + (followUp.usage?.input || 0), output: (result.usage?.output || 0) + (followUp.usage?.output || 0) };
      }

      // Track
      const duration = Date.now() - start;
      this.tokenTracker.add(result.usage?.input || 0, result.usage?.output || 0);
      this.costTracker.add(result.usage?.input || 0, result.usage?.output || 0, this.config.model);
      this.memory.addUser(userText);
      this.memory.addAssistant(result.content);
      this.usageLogger.log({ model: this.config.model, inputTokens: result.usage?.input, outputTokens: result.usage?.output, duration, skill: result.toolCalls?.[0]?.function?.name || null, success: true });

      return { content: result.content, usage: result.usage, duration, toolUsed: result.toolCalls?.[0]?.function?.name || null };
    } catch (err) {
      this.usageLogger.log({ model: this.config.model, duration: Date.now() - start, success: false, error: err.message });
      return null;
    }
  }

  async testConnection() {
    if (!this.provider) return { success: false, message: "No provider configured" };
    return this.provider.testConnection();
  }

  getUsage() { return { tokens: this.tokenTracker.getSummary(), cost: this.costTracker.getSummary(), logs: this.usageLogger.getRecent(20) }; }
  getConfig() { return this.config; }
  resetMemory() { this.memory.clear(); }
}
