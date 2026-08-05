/**
 * ProviderRegistry -- manages available AI providers.
 * OpenAI is implemented. Others are placeholders for future.
 */

const PROVIDERS = {
  openai:      { name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"], default: "gpt-4o" },
  claude:      { name: "Anthropic Claude", models: ["claude-3.5-sonnet"], default: "claude-3.5-sonnet" },
  gemini:      { name: "Google Gemini", models: ["gemini-pro"], default: "gemini-pro" },
  azure:       { name: "Azure OpenAI", models: ["gpt-4o"], default: "gpt-4o" },
  local:       { name: "Local Provider", models: ["local"], default: "local" },
};

export function getAvailableProviders() { return PROVIDERS; }
export function getProviderConfig(id) { return PROVIDERS[id] || null; }
export function getDefaultProvider() { return "openai"; }
export function isProviderSupported(id) { return !!PROVIDERS[id]; }
