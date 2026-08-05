import { useEffect, useRef } from "react";
import { Box, Stack } from "@mui/material";
import { semantic } from "../../../shared/design";
import ManagerMessage from "./ManagerMessage";
import ManagerGreeting from "./ManagerGreeting";
import TypingIndicator from "./TypingIndicator";

export default function ManagerConversation({ messages, isTyping, intelligence, metrics, showGreeting }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, py: 2, "&::-webkit-scrollbar": { width: 5 }, "&::-webkit-scrollbar-thumb": { borderRadius: 3, bgcolor: semantic.border } }}>
      {/* Greeting card - shown once at top before messages */}
      {showGreeting && (
        <ManagerGreeting intelligence={intelligence} metrics={metrics} />
      )}

      {/* Messages */}
      <Stack spacing={2.5} sx={{ px: { xs: 0.5, md: 1 } }}>
        {messages.map((msg) => (
          <ManagerMessage key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        {/* Scroll anchor */}
        <Box ref={bottomRef} sx={{ height: 4 }} />
      </Stack>
    </Box>
  );
}
