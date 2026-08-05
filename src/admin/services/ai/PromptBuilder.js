/**
 * PromptBuilder -- assembles the messages array for the AI provider.
 * Injects system prompt, conversation history, and current user input.
 */

export class PromptBuilder {
  static build(systemPrompt, history, userText) {
    const messages = [{ role: "system", content: systemPrompt }];

    // Add conversation history (limited to last 20 turns to stay within context)
    const recentHistory = history.slice(-20);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // Current user message
    messages.push({ role: "user", content: userText });

    return messages;
  }

  static estimateTokens(messages) {
    // Rough estimate: 1 token ~ 4 chars
    const chars = messages.reduce((s, m) => s + (m.content?.length || 0), 0);
    return Math.ceil(chars / 4);
  }
}
