import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CancelIcon from "@mui/icons-material/Cancel";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import UpgradeDialog from "./UpgradeDialog";
import CancelSubscriptionDialog from "./CancelSubscriptionDialog";
import BillingHistory from "./BillingHistory";

import {
  getSubscription,
  getEffectivePlan,
  upgradeToPro,
  cancelSubscription,
  reactivateSubscription,
} from "../../services/subscriptionService";

export default function SubscriptionManagementCard() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    try {
      setLoading(true);
      const data = await getSubscription();
      setSubscription(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade() {
    try {
      await upgradeToPro();
      setUpgradeOpen(false);
      await loadSubscription();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleCancelSubscription() {
    try {
      await cancelSubscription();
      setCancelOpen(false);
      await loadSubscription();
    } catch (error) {
      console.error(error);
    }
  }

  async function handleReactivateSubscription() {
    try {
      await reactivateSubscription();
      await loadSubscription();
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return (
      <Card elevation={3} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ py: 6, textAlign: "center" }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  // Effective plan (centralized): an expired PRO resolves to Starter here too,
  // so the displayed plan and the action buttons never present PRO after expiry.
  const plan = getEffectivePlan(subscription);
  const status = subscription?.status || "Active";
  const billingCycle = subscription?.billing_cycle || "Monthly";

  const renewalDate = subscription?.renewal_date
    ? new Date(subscription.renewal_date).toLocaleDateString()
    : "N/A";

  const startedDate = subscription?.created_at
    ? new Date(subscription.created_at).toLocaleDateString()
    : "N/A";

  const price = Number(subscription?.price || 0);

  const features = [
    "AI Farm Intelligence",
    "Farm Intelligence Centre",
    "Predictive Analytics",
    "Unlimited Livestock",
    "Unlimited Crops",
    "Unlimited Machinery",
    "Unlimited Finance",
    "Advanced Reports",
    "Priority Support",
  ];

  const isStarter = plan.toLowerCase() === "starter";
  // Only treat as "pending cancellation" (offering free reactivation) while the
  // subscription is still EFFECTIVELY PRO — i.e. before renewal_date passes.
  // Once expired, effective plan is Starter, so we show the upgrade path instead
  // and never offer a no-payment reactivate on an already-expired period.
  const isPendingCancellation = status === "Pending Cancellation" && !isStarter;
  const isProActive = !isStarter && status === "Active";

  return (
    <>
      <Card elevation={3} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <WorkspacePremiumIcon color="warning" />

              <Typography variant="h6" fontWeight={700}>
                Feldrix Subscription Management
              </Typography>
            </Stack>

            <Chip
              label={status}
              color={
                status === "Active"
                  ? "success"
                  : status === "Pending Cancellation"
                  ? "warning"
                  : "default"
              }
            />
          </Stack>

          <Stack spacing={2.5}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                CURRENT PLAN
              </Typography>

              <Typography variant="h4" fontWeight={700}>
                {plan}
              </Typography>
            </Box>

            <Divider />

            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">
                Billing Cycle
              </Typography>

              <Typography fontWeight={600}>
                {billingCycle}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">
                Price
              </Typography>

              <Typography fontWeight={600}>
                R{price.toFixed(2)}/month
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">
                Renewal Date
              </Typography>

              <Typography fontWeight={600}>
                {renewalDate}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">
                Started Date
              </Typography>

              <Typography fontWeight={600}>
                {startedDate}
              </Typography>
            </Stack>

            <Divider />

            <Typography fontWeight={700}>
              Included Features
            </Typography>

            <Stack spacing={1}>
              {features.map((feature) => (
                <Stack
                  key={feature}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <CheckCircleIcon
                    color="success"
                    fontSize="small"
                  />

                  <Typography variant="body2">
                    {feature}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <BillingHistory
              payments={subscription?.payments || []}
            />

            {isStarter && (
              <Button
                fullWidth
                variant="contained"
                startIcon={<WorkspacePremiumIcon />}
                onClick={() => setUpgradeOpen(true)}
              >
                Upgrade to PRO
              </Button>
            )}

            {isProActive && (
              <>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                >
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<CreditCardIcon />}
                    disabled
                  >
                    Manage Payment (Coming Soon)
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ReceiptLongIcon />}
                    disabled
                  >
                    View Billing History
                  </Button>
                </Stack>

                <Button
                  fullWidth
                  color="error"
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={() => setCancelOpen(true)}
                >
                  Cancel Subscription
                </Button>
              </>
            )}

            {isPendingCancellation && (
              <Button
                fullWidth
                color="success"
                variant="contained"
                startIcon={<WorkspacePremiumIcon />}
                onClick={handleReactivateSubscription}
              >
                Reactivate Subscription
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <UpgradeDialog
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onUpgrade={handleUpgrade}
      />

      <CancelSubscriptionDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancelSubscription}
      />
    </>
  );
}
