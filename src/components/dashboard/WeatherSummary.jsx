import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import CloudIcon from "@mui/icons-material/Cloud";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import { radius, transitions } from "../../design/tokens";

function generateWeatherInsight(weather) {
  if (!weather?.available || !weather.current) return null;

  const condition = (weather.current.condition || "").toLowerCase();
  const temp = weather.current.temperature ?? null;
  const wind = weather.current.windSpeed ?? 0;
  const humidity = weather.current.humidity ?? 0;

  // Check forecast for rain
  const forecast = weather.forecast || [];
  const rainTomorrow = forecast.length > 0 && (
    (forecast[0]?.condition || "").toLowerCase().includes("rain") ||
    (forecast[0]?.rainfall && forecast[0].rainfall > 5)
  );

  if (condition.includes("rain") || condition.includes("thunder")) {
    return "Wet conditions today. Avoid spraying and delay fieldwork where possible.";
  }

  if (rainTomorrow) {
    return "Rain expected tomorrow. Consider delaying irrigation and bringing in hay.";
  }

  if (wind > 30) {
    return "High winds today. Postpone chemical spraying to prevent drift.";
  }

  if (temp !== null && temp > 35) {
    return "Very warm afternoon ahead. Ensure livestock have sufficient water and shade.";
  }

  if (temp !== null && temp < 3) {
    return "Frost risk tonight. Protect sensitive crops and check water troughs.";
  }

  if (humidity > 85 && temp !== null && temp > 20) {
    return "High humidity may increase disease pressure. Monitor crops closely.";
  }

  if (condition.includes("clear") || condition.includes("sunny")) {
    return "Clear skies today. Ideal conditions for outdoor farm operations.";
  }

  return "No severe weather expected today. Normal operations can continue.";
}

export default function WeatherSummary({ weather }) {
  const insight = generateWeatherInsight(weather);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: radius.card,
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        transition: transitions.hover,
        "&:hover": { boxShadow: 2 },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <CloudIcon sx={{ fontSize: 20, color: "info.main" }} />
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            Weather
          </Typography>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {weather?.available ? (
          <Stack spacing={2}>
            {/* Current weather */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography sx={{ fontSize: 36, lineHeight: 1 }}>
                {weather.current?.icon || "\u2600\uFE0F"}
              </Typography>
              <Box>
                <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ lineHeight: 1 }}>
                  {weather.current?.temperature}°C
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mt: 0.5 }}>
                  {weather.current?.condition}
                </Typography>
              </Box>
            </Stack>

            {/* Details */}
            <Stack spacing={0.5}>
              {weather.current?.windSpeed != null && (
                <Typography variant="caption" color="text.secondary">
                  Wind: {weather.current.windSpeed} km/h
                </Typography>
              )}
              {weather.current?.humidity != null && (
                <Typography variant="caption" color="text.secondary">
                  Humidity: {weather.current.humidity}%
                </Typography>
              )}
              {weather.current?.rainfall != null && weather.current.rainfall > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Rainfall: {weather.current.rainfall} mm
                </Typography>
              )}
            </Stack>

            {/* Tomorrow forecast */}
            {weather.forecast?.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Tomorrow
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }} color="text.primary">
                    {weather.forecast[0]?.icon} {weather.forecast[0]?.temperature}°C — {weather.forecast[0]?.condition}
                  </Typography>
                </Box>
              </>
            )}

            {/* Weather Insight */}
            {insight && (
              <>
                <Divider />
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <TipsAndUpdatesIcon sx={{ fontSize: 16, color: "warning.main", mt: 0.2 }} />
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Weather Insight
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.5 }}>
                      {insight}
                    </Typography>
                  </Box>
                </Stack>
              </>
            )}
          </Stack>
        ) : (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <CloudIcon sx={{ fontSize: 32, color: "text.disabled", mb: 1 }} />
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {weather?.locationError ? "Location Not Found" : "Weather Unavailable"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {weather?.locationError
                ? "Update your Weather Location in Account → Farm Information."
                : "Configure an API key to enable weather intelligence."}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
