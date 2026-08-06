import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import SendIcon from "@mui/icons-material/Send";
import EmailIcon from "@mui/icons-material/Email";

const SUPPORT_EMAIL = "support@feldrix.com";

export default function ContactSupportCard() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function handleSend() {
    setError("");

    if (!subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    if (!message.trim()) {
      setError("Please enter a message.");
      return;
    }

    // Open the user's default email client with pre-filled fields
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject.trim())}&body=${encodeURIComponent(message.trim())}`;
    window.location.href = mailtoUrl;

    setSent(true);

    // Reset after a few seconds so the user can send another if needed
    setTimeout(() => setSent(false), 5000);
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
              Need help? Send us a message and we will get back to you.
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {sent && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Your email client has been opened. Send the message to complete your request.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Stack spacing={2.5}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <EmailIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                {SUPPORT_EMAIL}
              </Typography>
            </Stack>
          </Box>

          <TextField
            fullWidth
            label="Subject"
            value={subject}
            onChange={(e) => { setSubject(e.target.value); if (error) setError(""); }}
            placeholder="What do you need help with?"
            size="small"
          />

          <TextField
            fullWidth
            label="Message"
            value={message}
            onChange={(e) => { setMessage(e.target.value); if (error) setError(""); }}
            placeholder="Describe your issue or question..."
            multiline
            rows={4}
            size="small"
          />

          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSend}
            sx={{
              alignSelf: "flex-start",
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
            }}
          >
            Send Message
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
