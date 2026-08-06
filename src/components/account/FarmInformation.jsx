import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import AgricultureIcon from "@mui/icons-material/Agriculture";
import EditIcon from "@mui/icons-material/Edit";

import { getProfile } from "../../services/profileService";
import EditFarmDialog from "./EditFarmDialog";

export default function FarmInformation() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadFarmInformation();
  }, []);

  async function loadFarmInformation() {
    try {
      setLoading(true);

      const data = await getProfile();
      setProfile(data);
    } catch (error) {
      console.error("Failed to load farm information:", error);
    } finally {
      setLoading(false);
    }
  }

  const farmDetails = [
    {
      label: "Farm Name",
      value: profile?.farm_name || "Not Set",
    },
    {
      label: "Farm Type",
      value: profile?.farm_type || "Not Set",
    },
    {
      label: "Province",
      value: profile?.province || "Not Set",
    },
    {
      label: "Country",
      value: profile?.country || "Not Set",
    },
    {
      label: "Farm Size",
      value:
        profile?.farm_size !== null &&
        profile?.farm_size !== undefined
          ? `${profile.farm_size} ha`
          : "-- ha",
    },
    {
      label: "Preferred Units",
      value: profile?.preferred_units || "Metric",
    },
    {
      label: "Weather Location",
      value: profile?.weather_location
        ? profile.weather_location.replace(",ZA", "")
        : "Default (Johannesburg)",
    },
  ];

  if (loading) {
    return (
      <Card
        elevation={2}
        sx={{
          height: "100%",
          minHeight: 250,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 3,
        }}
      >
        <CircularProgress />
      </Card>
    );
  }

  return (
    <>
      <Card
        elevation={2}
        sx={{
          height: "100%",
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            sx={{ mb: 3 }}
          >
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
            >
              <AgricultureIcon
                color="success"
                sx={{ fontSize: 34 }}
              />

              <Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                >
                  Farm Information
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Basic information about your farm.
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              startIcon={<EditIcon />}
              size="small"
              onClick={() => setDialogOpen(true)}
              sx={{
                minWidth: 135,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Edit Farm
            </Button>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* Details */}
          <Grid container spacing={2}>
            {farmDetails.map((item) => (
              <Grid
                key={item.label}
                size={{ xs: 12, sm: 6 }}
              >
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: "grey.50",
                    border: "1px solid",
                    borderColor: "divider",
                    height: "100%",
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      mb: 0.75,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      fontWeight: 600,
                    }}
                  >
                    {item.label}
                  </Typography>

                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                  >
                    {item.value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <EditFarmDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={loadFarmInformation}
      />
    </>
  );
}
