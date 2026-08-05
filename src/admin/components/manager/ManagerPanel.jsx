/**
 * ============================================================
 * Feldrix Manager - Main Panel
 * Version 2.4.2 -- Action Engine wired
 *
 * handleSend now runs action intent detection first.
 * Action results drive workspace opening + navigation.
 * Conversation remains intact during and after navigation.
 * ============================================================
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { ChevronRight } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { semantic, radius, shadows, transitions } from "../../../shared/design";
import ManagerHeader from "./ManagerHeader";
import ManagerConversation from "./ManagerConversation";
import ManagerInput from "./ManagerInput";
import SuggestedPrompts from "./SuggestedPrompts";
import { buildGreeting, generateResponse } from "./managerService";
import {
  detectIntent,
  executeAction,
  generateActionResponse,
  ACTION_TYPES,
} from "../../services/managerActionService";

const RESPONSE_DELAY_MS = 700;
const NAVIGATE_DELAY_MS = 1200;

export default function ManagerPanel({
  admin,
  metrics,
  health,
  intelligence,
  predictions,
  operations,
  liveData,
  timelineData,
  ready,
  // Callbacks from AdminDashboard to open workspaces
  onOpenWorkspace,
}) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const greetingAdded = useRef(false);

  // Build greeting once intelligence is ready
  useEffect(() => {
    if (!ready || greetingAdded.current) return;
    greetingAdded.current = true;
    const greeting = buildGreeting(admin?.name, intelligence, metrics, health);
    setMessages([greeting]);
  }, [ready, admin, intelligence, metrics, health]);

  const handleSend = useCallback((text) => {
    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      // 1. Check action engine first (navigate / open workspace)
      const actionIntent = detectIntent(text);
      if (actionIntent) {
        const actionResult = executeAction(actionIntent);
        if (actionResult) {
          const actionMsg = generateActionResponse(actionResult);
          setIsTyping(false);
          setMessages(prev => [...prev, actionMsg]);

          // Execute the action after a brief confirmation moment
          setTimeout(() => {
            if (actionResult.type === ACTION_TYPES.OPEN_WORKSPACE) {
              onOpenWorkspace?.(actionResult.workspace);
            } else if (actionResult.type === ACTION_TYPES.NAVIGATE && actionResult.route) {
              navigate(actionResult.route);
            }
          }, NAVIGATE_DELAY_MS);
          return;
        }
      }

      // 2. Conversational response
      const context = { intelligence, predictions, operations, metrics, health, liveData, timelineData };
      const response = generateResponse(text, context);
      setIsTyping(false);
      setMessages(prev => [...prev, response]);
    }, RESPONSE_DELAY_MS);
  }, [intelligence, predictions, operations, metrics, health, liveData, timelineData, navigate, onOpenWorkspace]);

  const showGreeting = !!intelligence && !!metrics;

  return (
    <Box sx={{ borderRadius: radius.xl, bgcolor: semantic.paper, border: `1px solid ${semantic.border}`, boxShadow: shadows.lg, display: "flex", flexDirection: "column", overflow: "hidden", height: { xs: 560, md: 620 }, position: "relative" }}>
      {/* Header */}
      <ManagerHeader intelligence={intelligence} adminName={admin?.name} />

      {/* Conversation */}
      <ManagerConversation
        messages={messages}
        isTyping={isTyping}
        intelligence={intelligence}
        metrics={metrics}
        showGreeting={showGreeting}
        onSend={handleSend}
      />

      {/* Suggested prompts */}
      <SuggestedPrompts onSelect={handleSend} disabled={isTyping} />

      {/* Input */}
      <ManagerInput onSend={handleSend} disabled={isTyping} />
    </Box>
  );
}
