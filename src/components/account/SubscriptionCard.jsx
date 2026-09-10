import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
  Alert,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";

import {
  getSubscription,
  getEffectivePlan,
  upgradeToPro,
  cancelSubscription,
  reactivateSubscription,
} from "../../services/subscriptionService";

import UpgradeDialog from "./UpgradeDialog";
import CancelSubscriptionDialog from "./CancelSubscriptionDialog";
import StarterPlanCard from "./StarterPlanCard";
import BillingDashboard from "./BillingDashboard";

export default function SubscriptionCard() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  async function loadSubscription() {
    try {
      setLoading(true);
      setError(false);

      const data = await getSubscription();
      setSubscription(data);
    } catch (err) {
      console.error("Subscription Error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubscription();
  }, []);

  async function handleUpgrade() {
    try {
      await upgradeToPro();

      toast.success("Subscription upgraded successfully.");

      setUpgradeOpen(false);

      await loadSubscription();
    } catch (err) {
      toast.error(err.message || "Unable to upgrade.");
    }
  }

  async function handleCancelConfirm() {
    try {
      await cancelSubscription();

      toast.success(
        "Subscription scheduled for cancellation."
      );

      setCancelOpen(false);

      await loadSubscription();
    } catch {
      toast.error(
        "Unable to cancel subscription."
      );
    }
  }

  async function handleReactivate() {
    try {
      await reactivateSubscription();

      toast.success("Subscription reactivated.");

      await loadSubscription();
    } catch {
      toast.error(
        "Unable to reactivate subscription."
      );
    }
  }

  if (loading) {
    return (
      <Card elevation={1} sx={{ borderRadius: 3 }}>
        <CardContent
          sx={{
            p: 4,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 220,
          }}
        >
          <CircularProgress color="success" />
        </CardContent>
      </Card>
    );
  }

  if (error || !subscription) {
    return (
      <Card elevation={1} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Alert severity="warning">
            No subscription found.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Use the EFFECTIVE plan so an expired PRO renders the Starter card even if
  // the stored plan column has not yet been reconciled by the daily job.
  const isStarter =
    getEffectivePlan(subscription)?.toLowerCase() === "starter";

  return (
    <>
      {isStarter ? (
        <StarterPlanCard
          onUpgrade={() => setUpgradeOpen(true)}
        />
      ) : (
        <BillingDashboard
          subscription={subscription}
          onBillingHistory={() =>
            toast("Billing History coming in Phase 2.2")
          }
          onDownloadInvoice={() =>
            toast("Invoice downloads coming in Phase 2.3")
          }
          onManagePayment={() =>
            toast("Payment management coming soon")
          }
          onCancel={() => setCancelOpen(true)}
          onReactivate={handleReactivate}
        />
      )}

      <UpgradeDialog
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onUpgrade={handleUpgrade}
      />

      <CancelSubscriptionDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancelConfirm}
      />
    </>
  );
}
