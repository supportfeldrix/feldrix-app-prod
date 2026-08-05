/**
 * Feldrix Design System -- FxStatCard (Enterprise)
 * Sprint 54.4 -- MUI icons, no emoji.
 */

import { Box, Typography, Stack } from "@mui/material";
import { TrendingUp, Groups, Payments, Star, CellTower, AttachMoney, CalendarToday, CheckCircle, Pending, Cancel, CreditCard, Agriculture, Flag, HealthAndSafety, WarningAmber, Refresh, Assessment, Description, MonitorHeart, Storage, Build, SupportAgent, History, Notifications as NotifIcon, Security, WbSunny, Psychology, TaskAlt } from "@mui/icons-material";
import { radius, shadows, transitions, semantic } from "../tokens";

const ICON_MAP = {
  trending: TrendingUp, growth: TrendingUp, chart: TrendingUp,
  people: Groups, users: Groups, customers: Groups, farmers: Groups,
  payments: Payments, money: AttachMoney, revenue: AttachMoney,
  star: Star, pro: Star, premium: Star,
  signal: CellTower, active: CellTower, online: CellTower,
  calendar: CalendarToday, today: CalendarToday, date: CalendarToday,
  check: CheckCircle, success: CheckCircle, healthy: CheckCircle,
  pending: Pending, waiting: Pending, renewal: Refresh,
  cancel: Cancel, failed: Cancel, error: Cancel,
  card: CreditCard, billing: CreditCard,
  farm: Agriculture, livestock: Agriculture, crops: Agriculture,
  flag: Flag, new: Flag,
  health: HealthAndSafety, platform: MonitorHeart,
  warning: WarningAmber, attention: WarningAmber,
  assessment: Assessment, report: Assessment, showing: Assessment,
  description: Description, document: Description, audit: Description,
  storage: Storage, database: Storage,
  build: Build, system: Build,
  support: SupportAgent, ticket: SupportAgent,
  history: History, time: History,
  notification: NotifIcon, alert: NotifIcon,
  security: Security, lock: Security,
  weather: WbSunny, sun: WbSunny,
  ai: Psychology, brain: Psychology, insights: Psychology,
  task: TaskAlt, operations: TaskAlt,
};

function resolveIcon(icon, color) {
  if (!icon) return null;
  // Already a React element
  if (typeof icon === "object" && icon.$$typeof) return icon;
  // Map string key to MUI icon
  const key = String(icon).toLowerCase().replace(/[^a-z]/g, "");
  const IconComp = ICON_MAP[key];
  if (IconComp) return <IconComp sx={{ fontSize: 22, color }} />;
  // Fallback: render as text (backwards compat for any remaining strings)
  return <Typography sx={{ fontSize: "1.1rem" }}>{icon}</Typography>;
}

export default function FxStatCard({ icon, label, value, subtitle, trend, color, sx = {} }) {
  const accentColor = color || semantic.info;

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        borderRadius: radius.lg,
        bgcolor: "#fff",
        border: `1px solid ${semantic.border}`,
        borderTop: `3px solid ${accentColor}`,
        boxShadow: shadows.card,
        height: "100%",
        transition: transitions.normal,
        overflow: "hidden",
        position: "relative",
        "&:hover": { boxShadow: shadows.md, borderColor: semantic.borderHover, borderTopColor: accentColor },
        ...sx,
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: { xs: 40, md: 46 }, height: { xs: 40, md: 46 }, borderRadius: { xs: "11px", md: "13px" }, bgcolor: `${accentColor}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} aria-hidden="true">
            {resolveIcon(icon, accentColor)}
          </Box>
          <Typography sx={{ fontSize: { xs: "0.62rem", md: "0.68rem" }, fontWeight: 700, color: semantic.textSecondary, textTransform: "uppercase", letterSpacing: 0.6, lineHeight: 1.3 }}>{label}</Typography>
        </Stack>
        <Typography sx={{ fontSize: { xs: "1.4rem", sm: "1.6rem", md: "1.75rem" }, fontWeight: 800, color: semantic.text, lineHeight: 1.1, letterSpacing: "-0.02em", wordBreak: "break-word" }}>{value}</Typography>
        {(subtitle || trend) && (
          <Box>
            {trend && <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: trend.startsWith("+") ? semantic.success : trend.startsWith("-") ? semantic.error : semantic.textTertiary }}>{trend}</Typography>}
            {subtitle && <Typography sx={{ fontSize: { xs: "0.68rem", md: "0.72rem" }, color: semantic.textTertiary, mt: trend ? 0.25 : 0 }}>{subtitle}</Typography>}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
