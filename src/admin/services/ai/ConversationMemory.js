/**
 * ConversationMemory -- stores conversation turns for context.
 * Limited to prevent token overflow. Supports clear/reset.
 */

const MAX_TURNS = 30;

export default class ConversationMemory {
  constructor() {
    this.messages = [];
  }

  addUser(content) {
    this.messages.push({ role: "user", content, timestamp: Date.now() });
    this._trim();
  }

  addAssistant(content) {
    this.messages.push({ role: "assistant", content, timestamp: Date.now() });
    this._trim();
  }

  getMessages() {
    return this.messages;
  }

  getLastN(n = 10) {
    return this.messages.slice(-n);
  }

  getTurnCount() {
    return Math.floor(this.messages.length / 2);
  }

  clear() {
    this.messages = [];
  }

  _trim() {
    if (this.messages.length > MAX_TURNS * 2) {
      this.messages = this.messages.slice(-MAX_TURNS * 2);
    }
  }
}
