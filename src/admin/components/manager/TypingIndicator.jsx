import { Box, Stack, Typography } from "@mui/material";
import { semantic, radius } from "../../../shared/design";

export default function TypingIndicator() {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-end" sx={{ px: 1 }}>
      {/* Avatar */}
      <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Typography sx={{ fontSize: "0.75rem", color: "#fff", fontWeight: 700 }}>FM</Typography>
      </Box>
      {/* Bubble */}
      <Box sx={{ px: 2, py: 1.5, borderRadius: `${radius.lg * 8}px ${radius.lg * 8}px ${radius.lg * 8}px 4px`, bgcolor: semantic.paper, border: `1px solid ${semantic.border}`, display: "inline-flex", alignItems: "center", gap: 0.5 }}>
        {[0, 1, 2].map((i) => (
          <Box key={i} sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: semantic.textTertiary, animation: `fmBounce 1.4s ease-in-out ${i * 0.2}s infinite`, "@keyframes fmBounce": { "0%, 80%, 100%": { transform: "translateY(0)", opacity: 0.4 }, "40%": { transform: "translateY(-6px)", opacity: 1 } } }} />
        ))}
      </Box>
    </Stack>
  );
}
