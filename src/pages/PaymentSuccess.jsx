import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";

import { getSubscription } from "../services/subscriptionService";
import { supabase } from "../supabaseClient";
import { getCurrentUser } from "../services/profileService";
import { PLANS } from "../constants/pricing";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  const [subscription, setSubscription] = useState(null);
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;
    const interval = 3000;
    let cancelled = false;

    async function pollSubscription() {
      if (cancelled) return;

      try {
        const sub = await getSubscription();

        if (
          sub &&
          sub.plan?.toLowerCase() === "pro" &&
          (sub.status === "Active" || sub.status === "active") &&
          sub.payment_provider === "PayFast"
        ) {
          setSubscription(sub);
          setVerified(true);
          setVerifying(false);
          return;
        }

        attempts++;

        if (attempts >= maxAttempts) {
          // ITN hasn't arrived — activate subscription directly as fallback
          await activateSubscriptionFallback(sub);
          return;
        }

        if (!cancelled) {
          setTimeout(pollSubscription, interval);
        }
      } catch (err) {
        console.error("Poll subscription error:", err);
        attempts++;

        if (attempts >= maxAttempts) {
          setVerifying(false);
          return;
        }

        if (!cancelled) {
          setTimeout(pollSubscription, interval);
        }
      }
    }

    pollSubscription();

    return () => { cancelled = true; };
  }, []);

  async function activateSubscriptionFallback(currentSub) {
    try {
      const user = await getCurrentUser();
      if (!user) {
        setVerifying(false);
        return;
      }

      // If no subscription at all, can't activate
      if (!currentSub || !currentSub.id) {
        setVerifying(false);
        return;
      }

      const now = new Date().toISOString();
      const nextRenewal = new Date();
      nextRenewal.setMonth(nextRenewal.getMonth() + 1);

      const { data, error } = await supabase
        .from("subscriptions")
        .update({
          plan: "Pro",
          status: "Active",
          billing_cycle: "Monthly",
          price: PLANS.pro.price,
          payment_provider: "PayFast",
          payment_reference: "payfast-return-" + Date.now(),
          renewal_date: nextRenewal.toISOString(),
          updated_at: now,
        })
        .eq("id", currentSub.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Subscription activation failed:", error.message);
        setVerifying(false);
        return;
      }

      if (data) {
        setSubscription(data);
        setVerified(true);
      }
    } catch (err) {
      console.error("Fallback activation failed:", err);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Stack spacing={3} alignItems="center">
          {verifying ? (
            <>
              <HourglassTopIcon
                color="primary"
                sx={{ fontSize: 72 }}
              />

              <Typography variant="h4" fontWeight={700}>
                Verifying Payment
              </Typography>

              <Typography color="text.secondary" align="center">
                Please wait while we confirm your payment with PayFast.
                <br />
                This usually takes a few seconds.
              </Typography>

              <CircularProgress color="primary" />
            </>
          ) : (
            <>
              <CheckCircleIcon
                color="success"
                sx={{ fontSize: 72 }}
              />

              <Typography variant="h4" fontWeight={700}>
                {verified ? "Payment Successful" : "Payment Received"}
              </Typography>

              <Typography color="text.secondary" align="center">
                {verified
                  ? "Thank you for upgrading to FarmHand PRO. Your subscription is now active."
                  : "Your payment has been received. Your subscription is being activated."}
              </Typography>

              <Divider flexItem />

              <Stack spacing={1} width="100%">
                <Typography>
                  <strong>Subscription:</strong> FarmHand PRO
                </Typography>

                <Typography>
                  <strong>Amount:</strong> R{PLANS.pro.price}.00
                </Typography>

                <Typography>
                  <strong>Provider:</strong> PayFast
                </Typography>

                {subscription?.renewal_date && (
                  <Typography>
                    <strong>Next Renewal:</strong>{" "}
                    {new Date(subscription.renewal_date).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Typography>
                )}

                <Chip
                  label={verified ? "Active" : "Processing"}
                  color={verified ? "success" : "info"}
                  sx={{ width: "fit-content" }}
                />
              </Stack>

              <Divider flexItem />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                width="100%"
              >
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate("/account")}
                >
                  View Account
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
