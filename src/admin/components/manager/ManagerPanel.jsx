/**
 * ============================================================
 * Feldrix Manager - Main Panel
 * Version 2.4.1
 *
 * Top-level component that owns conversation state.
 * Receives pre-computed intelligence from AdminDashboard.
 * Future: replace generateResponse() with OpenAI call
 * without changing this component.
 * ============================================================
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { semantic, radius, shadows } from "../../../shared/design";
import ManagerHeader from "./ManagerHeader";
import ManagerConversation from "./ManagerConversation";
import ManagerInput from "./ManagerInput";
import SuggestedPrompts from "./SuggestedPrompts";
import { buildGreeting, generateResponse } from "./managerService";

const RESPONSE_DELAY_MS = 900;

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
    // Add user message
    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Generate response after short delay (typing simulation)
    setTimeout(() => {
      const context = { intelligence, predictions, operations, metrics, health, liveData, timelineData };
      const response = generateResponse(text, context);

      setIsTyping(false);
      setMessages(prev => [...prev, response]);

      // If response includes a route, navigate after a brief moment
      if (response.route) {
        setTimeout(() => navigate(response.route), 600);
      }
    }, RESPONSE_DELAY_MS);
  }, [intelligence, predictions, operations, metrics, health, liveData, timelineData, navigate]);

  // Show greeting card in conversation only if intelligence is available
  const showGreeting = !!intelligence && !!metrics;

  return (
    <Box
      sx={{
        borderRadius: radius.xl,
        bgcolor: semantic.paper,
        border: `1px solid ${semantic.border}`,
        boxShadow: shadows.lg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        // Fixed height so it feels like a proper panel, not a page section
        height: { xs: 560, md: 620 },
        position: "relative",
      }}
    >
      {/* Header */}
      <ManagerHeader intelligence={intelligence} adminName={admin?.name} />

      {/* Conversation - flex 1, scrollable */}
      <ManagerConversation
        messages={messages}
        isTyping={isTyping}
        intelligence={intelligence}
        metrics={metrics}
        showGreeting={showGreeting}
      />

      {/* Suggested prompts */}
      <SuggestedPrompts onSelect={handleSend} disabled={isTyping} />

      {/* Input */}
      <ManagerInput onSend={handleSend} disabled={isTyping} />
    </Box>
  );
}
