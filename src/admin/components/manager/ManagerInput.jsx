import { useState, useRef } from "react";
import { Box, Stack, Typography, IconButton } from "@mui/material";
import { Send, Mic, AttachFile } from "@mui/icons-material";
import { semantic, radius, shadows, transitions } from "../../../shared/design";

export default function ManagerInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  function handleSend() {
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
    inputRef.current?.focus();
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 2.5 }, pt: 1.5, borderTop: `1px solid ${semantic.border}`, bgcolor: semantic.paper }}>
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1, p: 1.5, borderRadius: radius.xl, border: `1.5px solid ${semantic.border}`, bgcolor: semantic.surface, boxShadow: shadows.xs, transition: transitions.normal, "&:focus-within": { borderColor: "#0F172A", boxShadow: `0 0 0 3px rgba(15,23,42,0.06)` } }}>
        {/* Placeholder icons */}
        <IconButton size="small" disabled sx={{ color: semantic.textTertiary, opacity: 0.5 }}>
          <AttachFile sx={{ fontSize: 18 }} />
        </IconButton>

        {/* Input */}
        <Box sx={{ flex: 1 }}>
          <textarea
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Feldrix Manager..."
            disabled={disabled}
            rows={1}
            style={{
              width: "100%", border: "none", outline: "none", resize: "none",
              background: "transparent", fontSize: "0.9rem", fontFamily: "Inter, sans-serif",
              color: "#0F172A", lineHeight: 1.6, maxHeight: 120, overflowY: "auto",
              padding: "2px 0",
            }}
          />
        </Box>

        {/* Mic placeholder */}
        <IconButton size="small" disabled sx={{ color: semantic.textTertiary, opacity: 0.5 }}>
          <Mic sx={{ fontSize: 18 }} />
        </IconButton>

        {/* Send */}
        <IconButton onClick={handleSend} disabled={!value.trim() || disabled} size="small" sx={{ width: 36, height: 36, borderRadius: "50%", bgcolor: value.trim() && !disabled ? "#0F172A" : semantic.border, color: value.trim() && !disabled ? "#fff" : semantic.textTertiary, transition: transitions.normal, "&:hover": { bgcolor: value.trim() && !disabled ? "#1E293B" : semantic.border }, "&:disabled": { opacity: 0.5 } }}>
          <Send sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
      <Typography sx={{ fontSize: "0.62rem", color: semantic.textTertiary, textAlign: "center", mt: 1 }}>
        Feldrix Manager uses your real platform data. Responses are generated from live intelligence.
      </Typography>
    </Box>
  );
}
