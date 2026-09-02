/**
 * Feldrix — Rainfall Log (Weather tab section)
 *
 * Self-contained section that records and displays FARMER-MEASURED
 * rainfall. Completely separate from the weather-service precipitation.
 *
 * Composition:
 *   - Summary: Today / Last 7 Days / This Month (from rainfall_logs only)
 *   - Latest rainfall card (or empty state)
 *   - Inline Log/Edit form (toggled)
 *   - Recent rainfall history table
 */

import { useEffect, useMemo, useState } from "react";
import {
  Box, Button, Card, CardContent, Chip, Divider, Grid, Stack, Typography,
} from "@mui/material";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

import {
  PremiumDashboardSection,
} from "../../design";

import { getRainfallLogs, getRainfallSummary } from "../../services/rainfallService";
import { getCrops } from "../../services/cropService";
import RainfallForm from "./RainfallForm";
import RainfallHistory from "./RainfallHistory";
import RainfallTrend from "./RainfallTrend";
import WeatherRainSuggestion from "./WeatherRainSuggestion";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-ZA", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return d;
  }
}

export default function RainfallLog() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ today: 0, last7Days: 0, thisMonth: 0 });
  const [fieldOptions, setFieldOptions] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadRainfall() {
    try {
      const rows = await getRainfallLogs();
      setLogs(rows);
      setSummary(await getRainfallSummary(rows));
    } catch (err) {
      console.error("Rainfall load error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadFieldOptions() {
    try {
      const crops = await getCrops();
      const fields = [...new Set((crops || []).map((c) => (c.field_name || "").trim()).filter(Boolean))];
      setFieldOptions(fields);
    } catch {
      setFieldOptions([]);
    }
  }

  useEffect(() => {
    loadRainfall();
    loadFieldOptions();
  }, []);

  // Open the form from a weather-service suggestion. Prefills today's date,
  // "Weather Estimate" source, and (optionally) the suggested amount — which
  // the farmer can still change before saving. No id → creates a new record
  // only on save. Nothing is written automatically.
  function handleSuggestionLog({ amount, prefillAmount }) {
    setSelectedLog({
      rainfall_date: todayISO(),
      amount_mm: prefillAmount && amount != null ? amount : "",
      field_name: "",
      measurement_source: "Weather Estimate",
      notes: "",
    });
    setShowForm(true);
  }

  const latest = logs[0] || null;

  const summaryCards = useMemo(() => ([
    { label: "Today", value: summary.today },
    { label: "Last 7 Days", value: summary.last7Days },
    { label: "This Month", value: summary.thisMonth },
  ]), [summary]);

  return (
    <PremiumDashboardSection
      title="🌧️ Rainfall Log"
      description="Record rainfall measured on your farm."
    >
      <Stack spacing={3}>
        {/* Weather-service rain suggestion (farmer must confirm) */}
        <WeatherRainSuggestion logs={logs} onLog={handleSuggestionLog} />

        {/* Summary + primary action */}
        <Card elevation={2} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <WaterDropIcon sx={{ color: "#1976D2" }} />
                <Typography variant="h6" fontWeight={700}>Rainfall Summary</Typography>
              </Stack>
              <Button
                variant="contained"
                color="success"
                startIcon={<AddIcon />}
                onClick={() => { setSelectedLog(null); setShowForm(true); }}
                sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none" }}
              >
                Log Rainfall
              </Button>
            </Stack>

            <Grid container spacing={2}>
              {summaryCards.map((c) => (
                <Grid size={{ xs: 12, sm: 4 }} key={c.label}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50", border: "1px solid", borderColor: "divider", textAlign: "center" }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", textTransform: "uppercase", letterSpacing: 0.5, fontSize: "0.65rem", fontWeight: 700 }}>
                      {c.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ color: "#1976D2", mt: 0.5 }}>
                      {c.value} mm
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Inline form (toggled) */}
        {showForm && (
          <RainfallForm
            log={selectedLog}
            fieldOptions={fieldOptions}
            refreshLogs={loadRainfall}
            onSaved={() => { setSelectedLog(null); setShowForm(false); }}
            onCancel={() => { setSelectedLog(null); setShowForm(false); }}
          />
        )}

        {/* Latest rainfall / empty state */}
        {!loading && (
          latest ? (
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <WaterDropIcon sx={{ color: "#1976D2" }} />
                  <Typography variant="h6" fontWeight={700}>Latest Rainfall</Typography>
                  <Chip label="Latest" size="small" color="info" sx={{ fontWeight: 700, height: 20, fontSize: "0.65rem" }} />
                </Stack>

                <Stack direction="row" alignItems="baseline" spacing={1.5}>
                  <Typography variant="h3" fontWeight={800} sx={{ color: "#1976D2", lineHeight: 1 }}>
                    {Number(latest.amount_mm)} mm
                  </Typography>
                  <Typography variant="body1" color="text.secondary" fontWeight={600}>
                    {fmtDate(latest.rainfall_date)}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                  {latest.field_name && (
                    <Chip label={latest.field_name} size="small" variant="outlined" />
                  )}
                  {latest.measurement_source && (
                    <Chip label={latest.measurement_source} size="small" variant="outlined" />
                  )}
                </Stack>

                {latest.notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, whiteSpace: "pre-wrap" }}>
                    {latest.notes}
                  </Typography>
                )}

                <Divider sx={{ my: 2 }} />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => { setSelectedLog(latest); setShowForm(true); }}
                  sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none" }}
                >
                  Edit
                </Button>
              </CardContent>
            </Card>
          ) : (
            !showForm && (
              <Card elevation={2} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3, textAlign: "center" }}>
                  <WaterDropIcon sx={{ fontSize: 44, color: "#1976D2", mb: 1 }} />
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    No Rainfall Recorded
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: "auto", mb: 2.5 }}>
                    Start recording rainfall measured on your farm to track daily,
                    weekly and monthly totals.
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<AddIcon />}
                    onClick={() => { setSelectedLog(null); setShowForm(true); }}
                    sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none" }}
                  >
                    Log Rainfall
                  </Button>
                </CardContent>
              </Card>
            )
          )
        )}

        {/* Rainfall Trend (from confirmed rainfall_logs only) */}
        {logs.length > 0 && <RainfallTrend logs={logs} />}

        {/* History */}
        {logs.length > 0 && (
          <PremiumDashboardSection
            title="Recent Rainfall"
            description={`${logs.length} record${logs.length !== 1 ? "s" : ""}.`}
          >
            <RainfallHistory
              logs={logs}
              onEdit={(log) => { setSelectedLog(log); setShowForm(true); }}
              refreshLogs={loadRainfall}
            />
          </PremiumDashboardSection>
        )}
      </Stack>
    </PremiumDashboardSection>
  );
}
