import { useNavigate } from "react-router-dom";

import {
  alpha,
  Box,
  ButtonBase,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import ChildFriendlyIcon from "@mui/icons-material/ChildFriendly";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { sireLabel } from "../../utils/breedingSire";

function getCountdownColor(days) {
  if (days <= 7) return "error";
  if (days <= 14) return "warning";
  if (days <= 30) return "info";
  return "success";
}

function getCountdownLabel(days) {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} Days`;
}

export default function UpcomingBirths({ records = [] }) {
  const theme = useTheme();
  const { palette } = theme;
  const navigate = useNavigate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pregnancies = records
    .filter((r) => r.expected_birth && (r.status === "Pregnant" || r.status === "Confirmed"))
    .map((record) => {
      const expected = new Date(record.expected_birth);
      expected.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((expected - today) / (1000 * 60 * 60 * 24));
      return { ...record, daysLeft };
    })
    .filter((p) => p.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const visible = pregnancies.slice(0, 5);
  const remaining = pregnancies.length - visible.length;

  return (
    <Card elevation={2} sx={{ borderRadius: 3, bgcolor: "background.paper" }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ChildFriendlyIcon sx={{ fontSize: 22, color: "info.main" }} />
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              Upcoming Births
            </Typography>
            {pregnancies.length > 0 && (
              <Chip
                label={`${pregnancies.length} pregnanc${pregnancies.length === 1 ? "y" : "ies"}`}
                size="small"
                color="info"
                sx={{ fontWeight: 600, fontSize: "0.7rem", height: 22, ml: "auto" }}
              />
            )}
          </Stack>

          <Divider />

          {visible.length === 0 ? (
            <Stack alignItems="center" spacing={1.5} sx={{ py: 3 }}>
              <CheckCircleIcon sx={{ fontSize: 44, color: "success.main" }} />
              <Typography variant="h6" fontWeight={700} color="success.main">
                No Upcoming Births
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ lineHeight: 1.6, maxWidth: 300 }}>
                There are currently no expected births within the monitoring window.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={0} divider={<Divider sx={{ ml: 6.5 }} />}>
              {visible.map((record) => (
                <ButtonBase
                  key={record.id}
                  onClick={() => navigate(`/animals/${record.female_id || record.id}`, { state: { source: "breeding", section: "breeding" } })}
                  sx={{
                    width: "100%",
                    borderRadius: 2,
                    textAlign: "left",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "action.hover",
                      boxShadow: `0 2px 8px ${alpha(palette.text.primary, 0.06)}`,
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 1.5, px: 1.5, width: "100%" }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: alpha(palette.info.main, 0.1),
                        color: "info.main",
                        flexShrink: 0,
                      }}
                    >
                      <ChildFriendlyIcon sx={{ fontSize: 22 }} />
                    </Box>

                    <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>
                          {record.female?.tag || "Unknown"}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {record.female?.breed || ""}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.disabled">
                        Sire: {sireLabel(record)} • Expected: {new Date(record.expected_birth).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
                      </Typography>
                    </Stack>

                    <Chip
                      label={getCountdownLabel(record.daysLeft)}
                      size="small"
                      color={getCountdownColor(record.daysLeft)}
                      sx={{ fontWeight: 700, fontSize: "0.65rem", height: 24, minWidth: 72, flexShrink: 0 }}
                    />

                    <ChevronRightIcon sx={{ color: "text.disabled", fontSize: 20, flexShrink: 0 }} />
                  </Stack>
                </ButtonBase>
              ))}
            </Stack>
          )}

          {remaining > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ pl: 1.5 }}>
              + {remaining} additional upcoming birth{remaining > 1 ? "s" : ""}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
