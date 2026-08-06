import { Box, Grid, Stack, Typography } from "@mui/material";

import ProfileCard from "../components/account/ProfileCard";
import FarmInformation from "../components/account/FarmInformation";
import PreferencesCard from "../components/account/PreferencesCard";
import SecurityCard from "../components/account/SecurityCard";
import StatisticsCard from "../components/account/StatisticsCard";
import SubscriptionCard from "../components/account/SubscriptionCard";
import QuickActionsCard from "../components/account/QuickActionsCard";
import ContactSupportCard from "../components/account/ContactSupportCard";
import MySupportTickets from "../components/account/MySupportTickets";
import EmailNotificationPreferences from "../components/account/EmailNotificationPreferences";
import OnboardingTrigger from "../components/onboarding/OnboardingTrigger";

export default function Account() {
  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Account Centre
          </Typography>

          <Typography color="text.secondary">
            Manage your FarmHand PRO account.
          </Typography>
        </Box>

        <ProfileCard />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 6 }}>
            <FarmInformation />
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <PreferencesCard />
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <SecurityCard />
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <StatisticsCard />
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <SubscriptionCard />
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <Stack spacing={3}>
              <QuickActionsCard />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 6 }}>
            <ContactSupportCard />
          </Grid>
        </Grid>

        {/* Email Notification Preferences — full width */}
        <MySupportTickets />

        <EmailNotificationPreferences />

        {/* Getting Started — onboarding trigger */}
        <OnboardingTrigger />
      </Stack>
    </Box>
  );
}
