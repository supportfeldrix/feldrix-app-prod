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

import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { sireLabel } from "../../utils/breedingSire";

export default function OverdueBirths({ records = [] }) {
  const theme = useTheme();
  const { palette } = theme;
  const navigate = useNavigate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Overdue births: expected_birth is in the past
  const overdueBirths = records
    .filter((r) => r.expected_birth && (r.status === "Pregnant" || r.status === "Confirmed"))
    .map((record) => {
      const expected = new Date(record.expected_birth);
      expected.setHours(0, 0, 0, 0);
      const overdueDays = Math.ceil((today - expected) / 86400000);
      return { ...record, overdueDays, overdueType: "birth" };
    })
    .filter((r) => r.overdueDays > 0);

  // Overdue pregnancy checks: bred 30+ days ago, still pregnant/confirmed/bred
  const overdueChecks = records
    .filter((r) => {
      if (r.status !== "Pregnant" && r.status !== "Confirmed" && r.status !== "Bred") return false;
      if (r.pregnancy_check_date) return false; // already checked
      if (!r.breeding_date) return false;
      const bred = new Date(r.breeding_date);
      bred.setHours(0, 0, 0, 0);
      return bred <= thirtyDaysAgo;
    })
    .filter((r) => {
      // Don't double-count: if already in overdue births, skip
      return !overdueBirths.some((ob) => ob.id === r.id);
    })
    .map((record) => {
      const bred = new Date(record.breeding_date);
      bred.setHours(0, 0, 0, 0);
      const daysSinceBred = Math.ceil((today - bred) / 86400000);
      return { ...record, overdueDays: daysSinceBred - 30, overdueType: "check" };
    })
    .filter((r) => r.overdueDays >= 0);

  const allOverdue = [...overdueBirths, ...overdueChecks].sort((a, b) => b.overdueDays - a.overdueDays);

  return (
    <Card elevation={2} sx={{ borderRadius: 3, bgcolor: "background.paper" }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningAmberIcon sx={{ fontSize: 22, color: "error.main" }} />
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              Overdue Births & Checks
            </Typography>
            {allOverdue.length > 0 && (
              <Chip
                label={`${allOverdue.length} overdue`}
                size="small"
                color="error"
                sx={{ fontWeight: 600, fontSize: "0.7rem", height: 22, ml: "auto" }}
              />
            )}
          </Stack>

          <Divider />

          {allOverdue.length === 0 ? (
            <Stack alignItems="center" spacing={1.5} sx={{ py: 3 }}>
              <CheckCircleIcon sx={{ fontSize: 44, color: "success.main" }} />
              <Typography variant="h6" fontWeight={700} color="success.main">
                No Overdue Items
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ lineHeight: 1.6, maxWidth: 300 }}>
                All pregnancies are progressing within their expected gestation period.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={0} divider={<Divider sx={{ ml: 6.5 }} />}>
              {allOverdue.map((record) => (
                <ButtonBase
                  key={record.id}
                  onClick={() => record.female_id && navigate(`/animals/${record.female_id}`, { state: { source: "breeding", section: "breeding" } })}
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
                        bgcolor: alpha(palette.error.main, 0.1),
                        color: "error.main",
                        flexShrink: 0,
                      }}
                    >
                      <WarningAmberIcon sx={{ fontSize: 22 }} />
                    </Box>

                    <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" fontWeight={700} color="text.primary" noWrap>
                          {record.female?.tag || "Unknown"}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {record.overdueType === "birth" ? "Birth Overdue" : "Check Overdue"}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.disabled">
                        Sire: {sireLabel(record)}
                        {record.expected_birth ? ` • Expected: ${new Date(record.expected_birth).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}` : ""}
                      </Typography>
                    </Stack>

                    <Chip
                      label={`${record.overdueDays}d Overdue`}
                      size="small"
                      color="error"
                      sx={{ fontWeight: 700, fontSize: "0.65rem", height: 24, minWidth: 80, flexShrink: 0 }}
                    />

                    <ChevronRightIcon sx={{ color: "text.disabled", fontSize: 20, flexShrink: 0 }} />
                  </Stack>
                </ButtonBase>
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
