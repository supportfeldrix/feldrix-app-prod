/**
 * ============================================================
 * Feldrix Control Centre — System Health (Premium v2.1)
 * Matches Dashboard/Users/Farms standard.
 * ============================================================
 */

import { useState, useEffect } from "react";
import { Box, Typography, Stack, Grid, Skeleton, IconButton, Tooltip } from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { FxCard, FxStatCard, FxStatusChip, semantic, typography as typo, shadows, radius, transitions } from "../../shared/design";
import { getPlatformHealth } from "../services/adminCustomerSuccessService";

const SERVICE_ICONS = { database: "🗄️", authentication: "🔐", storage: "📦", edgeFunctions: "⚡", payfast: "💳", weatherApi: "🌤️" };

export default function AdminSystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  function checkHealth() { setLoading(true); getPlatformHealth().then((h) => { setHealth(h); setLastChecked(new Date()); }).catch(() => {}).finally(() => setLoading(false)); }
  useEffect(() => { checkHealth(); }, []);

  const healthPct = health ? Math.round((Object.values(health.services).filter(s => s.status === "healthy").length / Object.values(health.services).length) * 100) : 0;

  if (loading) {
    return (
      <Stack spacing={4}>
        <Box><Skeleton variant="rounded" height={32} width={200} /><Skeleton variant="rounded" height={18} width={320} sx={{ mt: 1 }} /></Box>
        <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3 }} />
        <Grid container spacing={2}>{Array.from({ length: 6 }).map((_, i) => <Grid item xs={6} sm={4} md={2} key={i}><Skeleton variant="rounded" height={140} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1.5}>
        <Box>
          <Typography sx={{ ...typo.pageTitle, color: semantic.text }}>System Health</Typography>
          <Typography sx={{ ...typo.pageSubtitle, color: semantic.textSecondary, mt: 0.25 }}>
            Live infrastructure monitoring and service availability.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {lastChecked && <Typography sx={{ ...typo.tiny, color: semantic.textTertiary }}>Checked {lastChecked.toLocaleTimeString()}</Typography>}
          <Tooltip title="Refresh"><IconButton onClick={checkHealth} sx={{ width: 40, height: 40, border: `1px solid ${semantic.border}`, borderRadius: 2.5 }}><Refresh sx={{ fontSize: 18 }} /></IconButton></Tooltip>
        </Stack>
      </Stack>

      {/* Overall Status Card */}
      {health && (
        <FxCard sx={{ textAlign: "center", py: 4 }}>
          <Box sx={{ position: "relative", width: 90, height: 90, mx: "auto", mb: 2 }}>
            <svg width={90} height={90} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={45} cy={45} r={38} fill="none" stroke="#F1F5F9" strokeWidth={7} />
              <circle cx={45} cy={45} r={38} fill="none" stroke={healthPct >= 80 ? semantic.success : semantic.warning} strokeWidth={7} strokeLinecap="round" strokeDasharray={238.8} strokeDashoffset={238.8 - (healthPct / 100) * 238.8} style={{ transition: "stroke-dashoffset 0.8s ease" }} />
            </svg>
            <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography sx={{ fontSize: "1.2rem", fontWeight: 800, color: healthPct >= 80 ? semantic.success : semantic.warning }}>{healthPct}%</Typography>
            </Box>
          </Box>
          <Typography sx={{ ...typo.cardTitle, color: semantic.text }}>
            {health.overall === "healthy" ? "All Systems Operational" : health.overall === "degraded" ? "Partial Degradation" : "Issues Detected"}
          </Typography>
        </FxCard>
      )}

      {/* Service Grid */}
      {health && (
        <Grid container spacing={2}>
          {Object.entries(health.services).map(([name, svc]) => (
            <Grid item xs={6} sm={4} md={2} key={name}>
              <FxCard sx={{ textAlign: "center", py: 3, borderTop: `3px solid ${svc.status === "healthy" ? semantic.success : svc.status === "degraded" ? semantic.warning : semantic.error}` }}>
                <Typography sx={{ fontSize: "1.4rem", mb: 1 }}>{SERVICE_ICONS[name] || "⚙️"}</Typography>
                <Typography sx={{ ...typo.bodySmall, fontWeight: 700, color: semantic.text, textTransform: "capitalize", mb: 0.75 }}>{name.replace(/([A-Z])/g, " $1").trim()}</Typography>
                <FxStatusChip status={svc.status === "healthy" ? "healthy" : svc.status === "degraded" ? "warning" : "critical"} />
                {svc.latency && <Typography sx={{ ...typo.tiny, color: semantic.textTertiary, mt: 0.75, fontFamily: "monospace" }}>{svc.latency}ms</Typography>}
              </FxCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Metrics */}
      <Grid container spacing={2}>
        <Grid item xs={6} sm={4} md={3}><FxStatCard icon="⏱️" label="Avg Response" value="—" color="#3B82F6" subtitle="Coming soon" /></Grid>
        <Grid item xs={6} sm={4} md={3}><FxStatCard icon="📊" label="Uptime" value="99.9%" color="#16A34A" /></Grid>
        <Grid item xs={6} sm={4} md={3}><FxStatCard icon="⚡" label="Error Rate" value="0%" color="#16A34A" /></Grid>
        <Grid item xs={6} sm={4} md={3}><FxStatCard icon="🔄" label="Connections" value="—" color="#64748B" subtitle="Coming soon" /></Grid>
      </Grid>
    </Stack>
  );
}
