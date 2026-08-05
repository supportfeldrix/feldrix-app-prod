import { Box, Typography, Stack } from "@mui/material";
import { semantic, radius, transitions } from "../../../shared/design";
import { SUGGESTED_PROMPTS } from "./managerService";

export default function SuggestedPrompts({ onSelect, disabled }) {
  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pb: 2 }}>
      <Typography sx={{ fontSize: "0.62rem", fontWeight: 600, color: semantic.textTertiary, textTransform: "uppercase", letterSpacing: 0.6, mb: 1.25 }}>
        Suggested
      </Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.75 }}>
        {SUGGESTED_PROMPTS.map((p) => (
          <Box
            key={p.id}
            onClick={() => !disabled && onSelect(p.label)}
            sx={{
              px: 1.5, py: 0.6, borderRadius: radius.pill,
              bgcolor: semantic.surface, border: `1px solid ${semantic.border}`,
              cursor: disabled ? "default" : "pointer",
              transition: transitions.fast,
              opacity: disabled ? 0.5 : 1,
              "&:hover": disabled ? {} : { bgcolor: "#0F172A", borderColor: "#0F172A", "& .sp-label": { color: "#fff" } },
            }}
          >
            <Typography className="sp-label" sx={{ fontSize: "0.72rem", fontWeight: 500, color: semantic.textSecondary, transition: transitions.fast, whiteSpace: "nowrap" }}>
              {p.label}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
