/**
 * OpenAIProvider -- concrete implementation using OpenAI API.
 * Uses fetch directly (no SDK dependency required).
 * Supports tool calling and streaming-ready architecture.
 */

import AIProvider from "./AIProvider";

const API_URL = "https://api.openai.com/v1/chat/completions";

export default class OpenAIProvider extends AIProvider {
  constructor(config = {}) {
    super(config);
    this.name = "openai";
    this.model = config.model || "gpt-4o";
    this.apiKey = config.apiKey || "";
  }

  async initialize() {
    this.ready = !!this.apiKey;
    return this.ready;
  }

  async chat(messages, tools, options = {}) {
    if (!this.ready) throw new Error("OpenAI provider not initialized");

    const body = {
      model: this.model,
      messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.max_tokens ?? 1024,
    };

    if (tools?.length > 0) {
      body.tools = tools;
      body.tool_choice = "auto";
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI ${res.status}: ${err}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const msg = choice?.message;

    return {
      content: msg?.content || "",
      toolCalls: msg?.tool_calls || null,
      usage: { input: data.usage?.prompt_tokens || 0, output: data.usage?.completion_tokens || 0 },
      finishReason: choice?.finish_reason,
    };
  }

  async testConnection() {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({ model: this.model, messages: [{ role: "user", content: "ping" }], max_tokens: 5 }),
      });
      if (res.ok) return { success: true, message: `Connected to ${this.model}` };
      return { success: false, message: `HTTP ${res.status}` };
    } catch (e) {
      return { success: false, message: e.message };
    }
  }
}
