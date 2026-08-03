/**
 * ============================================================
 * Feldrix Control Centre — Subscription Drawer (Enterprise)
 * Sprint 49.0
 *
 * Customer billing detail: plan, payment history, timeline,
 * AI summary, admin actions.
 * ============================================================
 */

import { useState, useEffect } from "react";
import {
  Drawer, Box, Typography, Stack, Avatar, Divider,
  IconButton, CircularProgress, Skeleton, Button,
  useMediaQuery, useTheme,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { FxCard, FxStatusChip, FxEmptyState, semantic, typography as typo, radius } from "../../../shared/design";
import { formatDate, formatRelativeTime, formatCurrency } from "../../utils/adminFormatters";
import { getSubscriptionDetail, getPaymentHistory } from "../../services/adminBillingService";

const DRAWER_WIDTH = 520;

function DrawerSkeleton() {
  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={2.5}>
        <Skeleton variant="rounded" height={80} sx={{ borderRadius: radius.lg }} />
        <Skeleton variant="rounded" height={140} sx={{ borderRadius: radius.lg }} />
        <Skeleton variant="rounded" height={180} sx={{ borderRadius: radius.lg }} />
      </Stack>
    </Box>
  );
}

export default function SubscriptionDrawer({ open, payment, onClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const profile = payment?.profiles || {};
  const userId = payment?.user_id;

  useEffect(() => {
    if (!open || !userId) { setLoading(false); return; }
    setLoading(true);
    loadData();
  }, [open, userId]);

  async function loadData() {
    if (!userId) { setLoading(false); return; }
    try {
      const [sub, hist] = await Promise.all([
        getSubscriptionDetail(userId),
        getPaymentHistory(userId),
      ]);
      setSubscription(sub);
      setHistory(hist || []);
    } catch { /* graceful */ }
    finally { setLoading(false); }
  }

  if (!payment) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: isMobile ? "100%" : DRAWER_WIDTH, maxWidth: "100vw", bgcolor: semantic.surface, borderLeft: `1px solid ${semantic.border}` } }}
    >
      {/* Header */}
      <Box sx={{ px: 3, pt: 3, pb: 2.5, bgcolor: "#fff", borderBottom: `1px solid ${semantic.border}`, position: "sticky", top: 0, zIndex: 10 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 48, height: 48, bgcolor: semantic.info, fontWeight: 700, fontSize: "1.1rem" }}>
              {(profile.full_name || "?").charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: semantic.text }}>{profile.full_name || "Unknown"}</Typography>
              <Typography sx={{ ...typo.caption, color: semantic.textSecondary }}>{profile.email || profile.farm_name || "—"}</Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} sx={{ minWidth: 44, minHeight: 44 }} aria-label="Close"><Close /></IconButton>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <FxStatusChip status={payment.status === "success" ? "healthy" : payment.status === "failed" ? "critical" : "pending"} label={payment.status || "—"} />
          <FxStatusChip status="pro" label={subscription?.plan || "Starter"} />
        </Stack>
      </Box>

      {loading ? <DrawerSkeleton /> : (
        <Box sx={{ p: 2.5, pb: 4, overflow: "auto", flex: 1 }}>
          <Stack spacing={2.5}>

            {/* Current Transaction */}
            <FxCard>
              <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1.5 }}>💳 Transaction</Typography>
              <InfoRow label="Amount" value={formatCurrency(payment.amount)} />
              <InfoRow label="Status" value={payment.status || "—"} />
              <InfoRow label="Reference" value={payment.reference || "—"} />
              <InfoRow label="Date" value={formatDate(payment.created_at)} />
              <InfoRow label="Provider" value={payment.provider || "PayFast"} />
            </FxCard>

            {/* Subscription Info */}
            <FxCard>
              <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1.5 }}>⭐ Subscription</Typography>
              {subscription ? (
                <>
                  <InfoRow label="Plan" value={subscription.plan || "PRO"} />
                  <InfoRow label="Status" value={subscription.status || "—"} />
                  <InfoRow label="Billing Cycle" value={subscription.billing_cycle || "Monthly"} />
                  <InfoRow label="Renewal Date" value={formatDate(subscription.renewal_date)} />
                  <InfoRow label="Started" value={formatDate(subscription.created_at)} />
                </>
              ) : (
                <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary, fontStyle: "italic" }}>No active subscription found.</Typography>
              )}
            </FxCard>

            {/* AI Billing Summary */}
            <FxCard sx={{ position: "relative", overflow: "hidden" }}>
              <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #3B82F6, #60A5FA)" }} />
              <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1 }}>🧠 AI Billing Summary</Typography>
              <Stack spacing={0.5}>
                <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>
                  {payment.status === "success" ? "✓ Payment successful — no issues." : payment.status === "failed" ? "⚠ Payment failed — may require follow-up." : "⏳ Payment pending — awaiting confirmation."}
                </Typography>
                <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>
                  {history.length > 1 ? `✓ ${history.length} payments on record.` : "ℹ First payment for this customer."}
                </Typography>
                <Typography sx={{ ...typo.bodySmall, color: semantic.textSecondary }}>
                  {subscription ? "✓ Active subscription." : "⚠ No subscription linked — consider Starter."}
                </Typography>
              </Stack>
            </FxCard>

            {/* Payment History */}
            <FxCard>
              <Typography sx={{ ...typo.sectionTitle, color: semantic.text, mb: 1.5 }}>📜 Payment History</Typography>
              {history.length === 0 ? (
                <FxEmptyState icon="📭" title="No history" description="No previous payments on record." sx={{ p: 2, border: "none" }} />
              ) : (
                <Stack spacing={1}>
                  {history.slice(0, 10).map((h) => (
                    <Stack key={h.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.75, px: 1, borderRadius: 1.5, "&:hover": { bgcolor: semantic.surface } }}>
                      <Box>
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: semantic.text }}>{formatCurrency(h.amount)}</Typography>
                        <Typography sx={{ fontSize: "0.65rem", color: semantic.textTertiary }}>{formatDate(h.created_at)}</Typography>
                      </Box>
                      <FxStatusChip status={h.status === "success" ? "healthy" : h.status === "failed" ? "critical" : "pending"} label={h.status} />
                    </Stack>
                  ))}
                </Stack>
              )}
            </FxCard>

          </Stack>
        </Box>
      )}
    </Drawer>
  );
}

function InfoRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
      <Typography sx={{ fontSize: "0.75rem", color: semantic.textSecondary }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: semantic.text }}>{value ?? "—"}</Typography>
    </Stack>
  );
}
