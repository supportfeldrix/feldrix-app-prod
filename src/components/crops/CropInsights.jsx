import {
  alpha,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddTaskIcon from "@mui/icons-material/AddTask";
import GrassIcon from "@mui/icons-material/Grass";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import { useNavigate } from "react-router-dom";

function getSeverityColor(severity) {
  switch (severity) {
    case "high": return "error";
    case "medium": return "warning";
    case "low": return "success";
    default: return "default";
  }
}

function getSeverityLabel(severity) {
  switch (severity) {
    case "high": return "Critical";
    case "medium": return "Attention";
    case "low": return "Info";
    default: return "Info";
  }
}

function getBadgeLabel(insights) {
  if (!insights || insights.length === 0) return "No Issues";
  const highCount = insights.filter((i) => i.severity === "high").length;
  if (highCount > 0) return `${highCount} Alert${highCount > 1 ? "s" : ""}`;
  return `${insights.length} Insight${insights.length > 1 ? "s" : ""}`;
}

function getBadgeColor(insights) {
  if (!insights || insights.length === 0) return "success";
  if (insights.some((i) => i.severity === "high")) return "error";
  if (insights.some((i) => i.severity === "medium")) return "warning";
  return "success";
}

export default function CropInsights({ analytics }) {
  const theme = useTheme();
  const { palette } = theme;
  const navigate = useNavigate();

  if (!analytics || !analytics.available) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3, minHeight: 360, bgcolor: "background.paper" }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <TipsAndUpdatesIcon sx={{ fontSize: 22, color: "warning.main" }} />
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              Crop AI Insights
            </Typography>
          </Stack>
          <Divider sx={{ mb: 2.5 }} />
          <Typography color="text.secondary" variant="body2">
            Add crops to receive intelligent recommendations.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const { insights = [] } = analytics;
  const allClear = insights.length === 0 || (insights.length === 1 && insights[0].type === "all_good");
  const actionableInsights = insights
    .filter((i) => i.type !== "all_good")
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
    })
    .slice(0, 3);

  function handleCreateTask(taskData) {
    if (!taskData) return;
    // Navigate to planner with pre-filled task data
    navigate("/planner", { state: { newTask: taskData } });
  }

  return (
    <Card elevation={2} sx={{ borderRadius: 3, minHeight: 360, display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
      <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <TipsAndUpdatesIcon sx={{ fontSize: 22, color: "warning.main" }} />
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            Crop AI Insights
          </Typography>
          <Chip
            label={getBadgeLabel(allClear ? [] : actionableInsights)}
            size="small"
            color={getBadgeColor(allClear ? [] : actionableInsights)}
            sx={{ fontWeight: 600, fontSize: "0.7rem", height: 22, ml: "auto" }}
          />
        </Stack>

        <Divider sx={{ mb: 2.5 }} />

        {allClear ? (
          <Stack spacing={0} sx={{ flex: 1, justifyContent: "center" }}>
            <Stack alignItems="center" spacing={1.5} sx={{ pb: 2.5 }}>
              <CheckCircleIcon sx={{ fontSize: 44, color: "success.main" }} />
              <Typography variant="h6" fontWeight={700} color="success.main">
                Excellent!
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ lineHeight: 1.6, maxWidth: 280 }}>
                All monitored crops are healthy.
                No immediate actions are required today.
              </Typography>
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            <Stack spacing={1.5}>
              <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                Today&apos;s Summary
              </Typography>
              <Stack spacing={1}>
                <SummaryRow icon={<GrassIcon sx={{ fontSize: 18, color: "success.main" }} />} label="Active Crops" value={analytics.activeCrops} />
                <SummaryRow icon={<AgricultureIcon sx={{ fontSize: 18, color: "warning.main" }} />} label="Ready for Harvest" value={analytics.harvestReady} />
                <SummaryRow icon={<WaterDropIcon sx={{ fontSize: 18, color: "info.main" }} />} label="Irrigation Risk" value={analytics.needsIrrigation} />
              </Stack>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={0} sx={{ flex: 1 }}>
            {/* Insights list */}
            <Stack spacing={2}>
              {actionableInsights.map((insight, idx) => (
                <Stack
                  key={idx}
                  spacing={1}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(
                      insight.severity === "high" ? palette.error.main
                        : insight.severity === "medium" ? palette.warning.main
                        : palette.success.main,
                      0.04
                    ),
                    border: "1px solid",
                    borderColor: alpha(
                      insight.severity === "high" ? palette.error.main
                        : insight.severity === "medium" ? palette.warning.main
                        : palette.success.main,
                      0.12
                    ),
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Chip
                      label={getSeverityLabel(insight.severity)}
                      size="small"
                      color={getSeverityColor(insight.severity)}
                      sx={{ fontWeight: 600, fontSize: "0.65rem", height: 22, flexShrink: 0, mt: 0.1 }}
                    />
                    <Stack spacing={0.5} sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.primary" fontWeight={600} sx={{ lineHeight: 1.4 }}>
                        {insight.message}
                      </Typography>
                      {insight.reason && (
                        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                          {insight.reason}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>

                  {(insight.action || insight.taskData) && (
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ pl: 0.5, pt: 0.5 }}>
                      {insight.action && (
                        <Chip
                          label={insight.action}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: "0.65rem", height: 22 }}
                        />
                      )}
                      {insight.taskData && (
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<AddTaskIcon sx={{ fontSize: 14 }} />}
                          onClick={() => handleCreateTask(insight.taskData)}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.72rem",
                            color: "primary.main",
                            px: 1,
                            minWidth: 0,
                          }}
                        >
                          Create Task
                        </Button>
                      )}
                      {insight.type && insight.type.startsWith("weather") && (
                        <Button
                          size="small"
                          variant="text"
                          onClick={() => navigate("/dashboard")}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.72rem",
                            color: "info.main",
                            px: 1,
                            minWidth: 0,
                          }}
                        >
                          View Weather
                        </Button>
                      )}
                    </Stack>
                  )}
                </Stack>
              ))}
            </Stack>

            {/* Today's Summary at bottom */}
            <Stack spacing={1.5} sx={{ mt: "auto", pt: 2.5 }}>
              <Divider />
              <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 1, pt: 0.5 }}>
                Today&apos;s Summary
              </Typography>
              <Stack spacing={1}>
                <SummaryRow icon={<GrassIcon sx={{ fontSize: 18, color: "success.main" }} />} label="Active Crops" value={analytics.activeCrops} />
                <SummaryRow icon={<AgricultureIcon sx={{ fontSize: 18, color: "warning.main" }} />} label="Ready for Harvest" value={analytics.harvestReady} />
                <SummaryRow icon={<WaterDropIcon sx={{ fontSize: 18, color: "info.main" }} />} label="Irrigation Risk" value={analytics.needsIrrigation} />
              </Stack>
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryRow({ icon, label, value }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
      {icon}
      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} color="text.primary">
        {value}
      </Typography>
    </Stack>
  );
}
