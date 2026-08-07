import { Button, Chip, Container, Divider, Paper, Stack, Typography } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useNavigate } from "react-router-dom";
import { PLANS } from "../constants/pricing";

export default function PaymentCancelled() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Stack spacing={3} alignItems="center">
          <WarningAmberIcon
            color="warning"
            sx={{ fontSize: 72 }}
          />

          <Typography variant="h4" fontWeight={700}>
            Payment Cancelled
          </Typography>

          <Typography color="text.secondary" align="center">
            Your payment was cancelled.
            <br />
            No payment has been processed.
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

            <Chip
              label="Cancelled"
              color="warning"
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
              onClick={() => navigate("/account")}
            >
              Try Again
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate("/account")}
            >
              Return to Account
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
}
