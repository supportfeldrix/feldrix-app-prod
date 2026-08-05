/**
 * ToolExecutor -- executes Feldrix Skills when OpenAI requests a tool call.
 * OpenAI never accesses data directly; it chooses a skill, ToolExecutor runs it.
 */

import { SKILL_REGISTRY } from "../managerSkillService";
import { detectIntent, executeAction, ACTION_TYPES } from "../managerActionService";

// Tool definitions in OpenAI function-calling format
const SKILL_TOOLS = Object.keys(SKILL_REGISTRY).map(name => ({
  type: "function",
  function: {
    name,
    description: `Execute the ${name} Feldrix skill`,
    parameters: { type: "object", properties: {}, required: [] },
  },
}));

// Navigation tool
const NAV_TOOL = {
  type: "function",
  function: {
    name: "navigateTo",
    description: "Navigate to a page or open an analytics workspace in the admin portal",
    parameters: {
      type: "object",
      properties: { destination: { type: "string", description: "Page name or workspace name to open" } },
      required: ["destination"],
    },
  },
};

export default class ToolExecutor {
  getToolDefinitions() {
    return [...SKILL_TOOLS, NAV_TOOL];
  }

  executeBatch(toolCalls, platformContext) {
    return toolCalls.map(tc => this.execute(tc, platformContext));
  }

  execute(toolCall, platformContext) {
    const name = toolCall.function?.name;
    const args = toolCall.function?.arguments ? JSON.parse(toolCall.function.arguments) : {};

    // Navigation
    if (name === "navigateTo") {
      const intent = detectIntent(args.destination || "");
      const result = intent ? executeAction(intent) : null;
      return { id: toolCall.id, name, result: result || { message: "Navigation not recognised." } };
    }

    // Skill execution
    const skillFn = SKILL_REGISTRY[name];
    if (skillFn) {
      const result = skillFn(platformContext);
      return { id: toolCall.id, name, result };
    }

    return { id: toolCall.id, name, result: { error: "Unknown tool" } };
  }
}
