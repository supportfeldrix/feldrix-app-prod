import { Box, Typography, Stack, Chip } from "@mui/material";
import { semantic, radius, shadows } from "../../../shared/design";

function formatContent(text) {
  if (!text) return null;
  // Split on \n\n for paragraphs, handle **bold**
  return text.split("\n\n").map((block, bi) => {
    const formatted = block.split("\n").map((line, li) => {
      // Replace **text** with bold span
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <Typography key={li} component="p" sx={{ fontSize: "0.88rem", color: semantic.text, lineHeight: 1.75, mb: 0.25 }}>
          {parts.map((part, pi) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <Box component="span" key={pi} sx={{ fontWeight: 700, color: semantic.text }}>{part.slice(2, -2)}</Box>;
            }
            return <span key={pi}>{part}</span>;
          })}
        </Typography>
      );
    });
    return <Box key={bi} sx={{ mb: block !== text.split("\n\n").at(-1) ? 1.5 : 0 }}>{formatted}</Box>;
  });
}

function timeStr(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
}

export default function ManagerMessage({ message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <Stack direction="row" justifyContent="flex-end" sx={{ px: 1, animation: "fmFadeIn 0.25s ease both", "@keyframes fmFadeIn": { from: { opacity: 0, transform: "translateY(6px)" }, to: { opacity: 1, transform: "none" } } }}>
        <Stack alignItems="flex-end" spacing={0.5} sx={{ maxWidth: "72%" }}>
          <Box sx={{ px: 2.5, py: 1.5, borderRadius: `${radius.lg * 8}px ${radius.lg * 8}px 4px ${radius.lg * 8}px`, bgcolor: "#0F172A", boxShadow: shadows.sm }}>
            <Typography sx={{ fontSize: "0.88rem", color: "#fff", lineHeight: 1.65 }}>{message.content}</Typography>
          </Box>
          <Typography sx={{ fontSize: "0.6rem", color: semantic.textTertiary, pr: 0.5 }}>{timeStr(message.timestamp)}</Typography>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ px: 1, animation: "fmFadeIn 0.3s ease both", "@keyframes fmFadeIn": { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "none" } } }}>
      {/* Assistant avatar */}
      <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.5 }}>
        <Typography sx={{ fontSize: "0.65rem", color: "#fff", fontWeight: 800, letterSpacing: "-0.5px" }}>FM</Typography>
      </Box>

      <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ px: 2.5, py: 2, borderRadius: `4px ${radius.lg * 8}px ${radius.lg * 8}px ${radius.lg * 8}px`, bgcolor: semantic.paper, border: `1px solid ${semantic.border}`, boxShadow: shadows.sm, maxWidth: "92%" }}>
          {formatContent(message.content)}

          {/* Suffix */}
          {message.suffix && (
            <Typography sx={{ fontSize: "0.85rem", color: semantic.textSecondary, fontStyle: "italic", mt: 1.5, lineHeight: 1.6 }}>
              {message.suffix}
            </Typography>
          )}

          {/* Highlights */}
          {message.highlights?.length > 0 && (
            <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
              {message.highlights.filter(Boolean).map((h, i) => (
                <Box key={i} sx={{ px: 1.25, py: 0.35, borderRadius: radius.pill, bgcolor: semantic.surface, border: `1px solid ${semantic.border}` }}>
                  <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: semantic.textSecondary }}>{h}</Typography>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
        <Typography sx={{ fontSize: "0.6rem", color: semantic.textTertiary, pl: 0.5 }}>{timeStr(message.timestamp)}</Typography>
      </Stack>
    </Stack>
  );
}
