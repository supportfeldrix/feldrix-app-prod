import { useEffect, useState } from "react";
import { getSubscription } from "../../services/subscriptionService";
import {
  Avatar,
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

import PersonIcon from "@mui/icons-material/Person";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import EditIcon from "@mui/icons-material/Edit";

import { createProfile } from "../../services/profileService";
import EditProfileDialog from "./EditProfileDialog";

export default function ProfileCard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await createProfile();
      setProfile(data);
      const sub = await getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  }

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "";

  const plan = subscription?.plan || "Starter";
  const isPro = String(plan).toLowerCase() === "pro";

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : "-";

  if (loading) {
    return (
      <Card
        elevation={3}
        sx={{
          borderRadius: 3,
          p: 6,
          textAlign: "center",
        }}
      >
        <CircularProgress />
      </Card>
    );
  }

  return (
    <Card
      elevation={3}
      sx={{
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      {/* Hero Banner */}
      <Box
        sx={{
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
          color: "white",
          p: 3,
        }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          alignItems="center"
        >
          <Avatar
            sx={{
              width: 88,
              height: 88,
              bgcolor: "rgba(255,255,255,0.18)",
              border: "3px solid rgba(255,255,255,0.35)",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            {initials || <PersonIcon sx={{ fontSize: 48 }} />}
          </Avatar>

          <Box flex={1}>
            <Typography
              variant="overline"
              sx={{
                letterSpacing: 2,
                opacity: 0.9,
              }}
            >
              WELCOME BACK
            </Typography>

            <Typography
              variant="h4"
              fontWeight={700}
            >
              {profile?.full_name || "Farm Owner"}
            </Typography>

            <Typography
              sx={{
                opacity: 0.9,
                mt: 0.5,
              }}
            >
              {profile?.email || "-"}
            </Typography>

            <Typography
              sx={{
                mt: 1,
                opacity: 0.9,
              }}
            >
              Manage your farm profile, preferences and account settings.
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            <Chip
              icon={<WorkspacePremiumIcon />}
              label={isPro ? "Pro Plan" : "Starter Plan"}
              sx={{
                bgcolor: "rgba(255,255,255,0.18)",
                color: "white",
                fontWeight: 700,
              }}
            />

            <Button
              variant="contained"
              color="inherit"
              startIcon={<EditIcon />}
              onClick={() => setEditOpen(true)}
              sx={{
                color: "primary.main",
                fontWeight: 700,
              }}
            >
              Edit Profile
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Summary */}
      <CardContent>
        <Stack
          direction={{ xs: "column", md: "row" }}
          divider={<Divider orientation="vertical" flexItem />}
          spacing={3}
          justifyContent="space-between"
        >
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              MEMBER SINCE
            </Typography>

            <Typography
              variant="h6"
              fontWeight={600}
            >
              {memberSince}
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              ACCOUNT STATUS
            </Typography>

            <Typography
              variant="h6"
              color="success.main"
              fontWeight={600}
            >
              Active
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              CURRENT PLAN
            </Typography>

            <Typography
              variant="h6"
              fontWeight={600}
            >
              {plan}
            </Typography>
          </Box>
        </Stack>
      </CardContent>

      <EditProfileDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={loadProfile}
      />
    </Card>
  );
}
