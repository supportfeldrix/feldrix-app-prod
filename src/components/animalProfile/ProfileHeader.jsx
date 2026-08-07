import { Box, Chip, Stack, Typography } from "@mui/material";
import { getLifecycleStage, getStageColor } from "../../services/livestockLifecycle";
import { getStatusConfig } from "../../constants/livestockStatus";

const SPECIES_ICON = { Cattle: "🐄", Sheep: "🐑", Goats: "🐐", Pigs: "🐖", Poultry: "🐔" };

export default function ProfileHeader({ animal }) {
  if (!animal) return null;

  const lifecycle = getLifecycleStage(animal);
  const statusCfg = getStatusConfig(animal.status || "Active");
  const stageColor = lifecycle.stage ? getStageColor(lifecycle.stage) : null;

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg,#2E7D32,#43A047)",
        color: "#fff",
        borderRadius: 5,
        p: { xs: 3, md: 4 },
        mb: 3,
        boxShadow: "0 12px 30px rgba(15,23,42,.18)",
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ md: "center" }}>
        {/* Icon + Tag + Breed */}
        <Stack direction="row" spacing={2.5} alignItems="center" sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: { xs: 50, md: 64 }, lineHeight: 1 }}>
            {SPECIES_ICON[animal.animal_type] || "🐄"}
          </Typography>
          <Box>
            <Typography sx={{ fontSize: { xs: "1.5rem", md: "2rem" }, fontWeight: 800, lineHeight: 1.1 }}>
              {animal.tag}
            </Typography>
            <Typography sx={{ opacity: 0.9, mt: 0.5, fontSize: "1rem" }}>
              {animal.breed} &middot; {animal.animal_type} &middot; {animal.gender}
            </Typography>
          </Box>
        </Stack>

        {/* Right side: Status + Lifecycle + Age */}
        <Stack spacing={1.5} alignItems={{ xs: "flex-start", md: "flex-end" }}>
          {/* Badges row */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label={statusCfg.label}
              size="small"
              sx={{ fontWeight: 700, bgcolor: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
            />
            {lifecycle.stage && (
              <Chip
                label={lifecycle.stage}
                size="small"
                sx={{ fontWeight: 700, bgcolor: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" }}
              />
            )}
          </Stack>

          {/* Info row */}
          <Stack direction="row" spacing={2.5} sx={{ opacity: 0.9, fontSize: "0.85rem" }}>
            {lifecycle.ageLabel && lifecycle.ageLabel !== "Birth date not set" && (
              <Box>
                <Typography sx={{ fontSize: "0.65rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.5 }}>Age</Typography>
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 700 }}>{lifecycle.ageLabel}</Typography>
              </Box>
            )}
            {lifecycle.nextStage && (
              <Box>
                <Typography sx={{ fontSize: "0.65rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.5 }}>Next Stage</Typography>
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 700 }}>{lifecycle.nextStage}</Typography>
              </Box>
            )}
            {animal.purchase_date && (
              <Box>
                <Typography sx={{ fontSize: "0.65rem", opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.5 }}>Purchased</Typography>
                <Typography sx={{ fontSize: "0.9rem", fontWeight: 700 }}>{animal.purchase_date}</Typography>
              </Box>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}
