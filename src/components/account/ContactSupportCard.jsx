import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";

import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { createSupportTicket } from "../../services/supportTicketService";

const CATEGORIES = [
  "Technical Issue",
  "Billing",
  "Subscription",
  "Livestock",
  "Animal Health",
  "Breeding",
  "Crops",
  "Finance",
  "Planner",
  "Weather",
  "Reports",
  "Feature Request",
  "General Question",
  "Other",
];

export default function ContactSupportCard() {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");

    if (!subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    if (!category) {
      setError("Please select a category.");
      return;
    }

    if (!message.trim()) {
      setError("Please enter a message.");
      return;
    }

    setSubmitting(true);

    try {
      const ticket = await createSupportTicket({
        subject: subject.trim(),
        category,
        message: message.trim(),
      });

      toast.success(`Support request submitted successfully.\nTicket ${ticket.ticket_number} has been created.`);

      setSubmitted(ticket.ticket_number);

      // Reset form
      setSubject("");
      setCategory("");
      setMessage("");
    } catch (err) {
      console.error("Support ticket creation failed:", err);
      toast.error("Failed to submit support request. Please try again.");
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
          <SupportAgentIcon color="primary" sx={{ fontSize: 34 }} />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Contact Support
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Need help? Submit a request and our team will get back to you.
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Success State */}
        {submitted && (
          <Alert
            severity="success"
            icon={<CheckCircleIcon />}
            sx={{ mb: 2 }}
            onClose={() => setSubmitted(null)}
          >
            <Typography variant="body2" fontWeight={600}>
              Support request submitted successfully.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ticket {submitted} has been created. Our support team will contact you shortly.
            </Typography>
          </Alert>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Stack spacing={2.5}>
          <TextField
            fullWidth
            label="Subject"
            value={subject}
            onChange={(e) => { setSubject(e.target.value); if (error) setError(""); }}
            placeholder="What do you need help with?"
            size="small"
            required
          />

          <TextField
            select
            fullWidth
            label="Category"
            value={category}
            onChange={(e) => { setCategory(e.target.value); if (error) setError(""); }}
            size="small"
            required
          >
            <MenuItem value="" disabled>
              Select a category...
            </MenuItem>
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Message"
            value={message}
            onChange={(e) => { setMessage(e.target.value); if (error) setError(""); }}
            placeholder="Describe your issue or question in detail..."
            multiline
            rows={4}
            size="small"
            required
          />

          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSubmit}
            disabled={submitting}
            sx={{
              alignSelf: "flex-start",
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
            }}
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
