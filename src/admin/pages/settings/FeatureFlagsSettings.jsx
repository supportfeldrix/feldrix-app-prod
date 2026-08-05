import { useState } from "react";
import { Box, Typography, Stack, Grid } from "@mui/material";
import { Flag, ToggleOn } from "@mui/icons-material";
import { FxCard, semantic, radius } from "../../../shared/design";

export default function FeatureFlagsSettings({ settings }) {
  const flags = settings?.featureFlags || {};
  const [search, setSearch] = useState("");

  const entries = Object.entries(flags).filter(([key]) =>
    key.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Stack spacing={3}>
      <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: semantic.text }}>
        <Flag sx={{ fontSize: "1.1rem", mr: 1, verticalAlign: "middle" }} />
        Feature Flags
      </Typography>

      <Box
        component="input"
        placeholder="Search flags..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ px: 1.5, py: 1, fontSize: "0.82rem", borderRadius: radius.lg, border: `1px solid ${semantic.border}`, outline: "none", color: semantic.text, backgroundColor: "transparent", width: "100%" }}
      />

      <FxCard sx={{ borderRadius: radius.lg, p: 2.5 }}>
        <Grid container spacing={1.5}>
          {entries.map(([key, val]) => (
            <Grid item xs={6} sm={4} key={key}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: val ? semantic.success : semantic.warning }} />
                <Typography sx={{ fontSize: "0.75rem", color: semantic.text }}>{key}</Typography>
              </Stack>
            </Grid>
          ))}
          {entries.length === 0 && (
            <Grid item xs={12}>
              <Typography sx={{ fontSize: "0.82rem", color: semantic.textTertiary, textAlign: "center", py: 2 }}>No flags found</Typography>
            </Grid>
          )}
        </Grid>
      </FxCard>
    </Stack>
  );
}
