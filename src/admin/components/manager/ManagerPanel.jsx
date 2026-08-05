/**
 * ============================================================
 * Feldrix Manager - Main Panel
 * Version 2.4.4 -- AI Platform wired
 *
 * When VITE_OPENAI_API_KEY is set, uses AIPlatform (OpenAI).
 * Otherwise falls back to local skill/action/conversation engine.
 * ============================================================
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { semantic, radius, shadows } from "../../../shared/design";
import ManagerHeader from "./ManagerHeader";
import ManagerConversation from "./ManagerConversation";
import ManagerInput from "./ManagerInput";
import SuggestedPrompts from "./SuggestedPrompts";
import { buildGreeting, generateResponse } from "./managerService";
import { detectIntent, executeAction, generateActionResponse, ACTION_TYPES } from "../../services/managerActionService";
import AIPlatform from "../../services/ai/AIPlatform";
import { buildConversationContext } from "../../services/ai/ConversationContext";

const RESPONSE_DELAY_MS = 700;
const NAVIGATE_DELAY_MS = 1200;

// Singleton AI platform instance (persists across re-renders)
let aiPlatformInstance = null;

function getAIPlatform() {
  if (!aiPlatformInstance) aiPlatformInstance = new AIPlatform();
  return aiPlatformInstance;
}

export default function ManagerPanel({
  admin, metrics, health, intelligence, predictions, operations, liveData, timelineData, ready, onOpenWorkspace,
}) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const greetingAdded = useRef(false);
  const aiInitialized = useRef(false);

  // Initialize AI platform if API key is available
  useEffect(() => {
    if (aiInitialized.current) return;
    aiInitialized.current = true;
    const key = import.meta.env.VITE_OPENAI_API_KEY;
    if (key) {
      getAIPlatform().initialize(key).then(ok => setAiReady(ok)).catch(() => setAiReady(false));
    }
  }, []);

  // Build greeting once intelligence is ready
  useEffect(() => {
    if (!ready || greetingAdded.current) return;
    greetingAdded.current = true;
    const greeting = buildGreeting(admin?.name, intelligence, metrics, health);
    setMessages([greeting]);
  }, [ready, admin, intelligence, metrics, health]);

  const handleSend = useCallback(async (text) => {
    const userMsg = { id: `u-${Date.now()}`, role: "user", content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // 1. Action engine (navigation/workspace) -- always checked first
    const actionIntent = detectIntent(text);
    if (actionIntent) {
      const actionResult = executeAction(actionIntent);
      if (actionResult) {
        const actionMsg = generateActionResponse(actionResult);
        setIsTyping(false);
        setMessages(prev => [...prev, actionMsg]);
        setTimeout(() => {
          if (actionResult.type === ACTION_TYPES.OPEN_WORKSPACE) onOpenWorkspace?.(actionResult.workspace);
          else if (actionResult.type === ACTION_TYPES.NAVIGATE && actionResult.route) navigate(actionResult.route);
        }, NAVIGATE_DELAY_MS);
        return;
      }
    }

    // 2. AI Platform (OpenAI) -- if available
    if (aiReady) {
      try {
        const ctx = buildConversationContext({ intelligence, predictions, operations, metrics, health, liveData, timelineData });
        const aiResult = await getAIPlatform().chat(text, ctx, admin?.name);
        if (aiResult?.content) {
          setIsTyping(false);
          setMessages(prev => [...prev, {
            id: `ai-${Date.now()}`, role: "assistant", timestamp: new Date().toISOString(),
            content: aiResult.content, type: "ai",
            highlights: aiResult.toolUsed ? [`Skill: ${aiResult.toolUsed}`] : [],
            followups: ["Show today's summary", "Open Revenue Intelligence", "Priority actions"],
          }]);
          return;
        }
      } catch { /* fall through to local */ }
    }

    // 3. Local fallback (skills + conversational)
    setTimeout(() => {
      const context = { intelligence, predictions, operations, metrics, health, liveData, timelineData };
      const response = generateResponse(text, context);
      setIsTyping(false);
      setMessages(prev => [...prev, response]);
    }, RESPONSE_DELAY_MS);
  }, [intelligence, predictions, operations, metrics, health, liveData, timelineData, navigate, onOpenWorkspace, admin, aiReady]);

  const showGreeting = !!intelligence && !!metrics;

  return (
    <Box sx={{ borderRadius: "16px", bgcolor: semantic.paper, border: `1px solid ${semantic.border}`, boxShadow: shadows.lg, display: "flex", flexDirection: "column", overflow: "hidden", height: { xs: 560, md: 620 }, position: "relative" }}>
      <ManagerHeader intelligence={intelligence} adminName={admin?.name} />
      <ManagerConversation messages={messages} isTyping={isTyping} intelligence={intelligence} metrics={metrics} showGreeting={showGreeting} onSend={handleSend} />
      <SuggestedPrompts onSelect={handleSend} disabled={isTyping} />
      <ManagerInput onSend={handleSend} disabled={isTyping} />
    </Box>
  );
}
