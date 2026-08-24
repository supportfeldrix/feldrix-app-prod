import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Grid, Stack } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";

import {
  PremiumPageLayout,
  PremiumDashboardSection,
  PremiumActionButton,
  PremiumLoadingState,
  spacing,
} from "../design";

import HeroBanner from "../components/dashboard/HeroBanner";
import AIInsights from "../components/dashboard/AIInsights";
import ActionCenter from "../components/dashboard/ActionCenter";
import TodayPriorities from "../components/dashboard/TodayPriorities";
import DashboardQuickActions from "../components/dashboard/DashboardQuickActions";
import FarmHealthScore from "../components/dashboard/FarmHealthScore";
import WeatherSummary from "../components/dashboard/WeatherSummary";
import FarmTimeline from "../components/dashboard/FarmTimeline";
import NotificationCenter from "../components/dashboard/NotificationCenter";
import FarmIntelligenceCenter from "../components/dashboard/FarmIntelligenceCenter";

import { getDashboardStats } from "../services/dashboardService";
import { getHealthRecords } from "../services/healthService";
import { getNotifications } from "../services/notificationService";
import { getWeatherSummary } from "../services/weatherService";
import { calculateFarmHealthScore } from "../utils/farmHealthScore";
import { generateAIInsights } from "../utils/aiInsights";
import { generateFarmTimeline } from "../utils/farmTimeline";
import { generateActionCenter } from "../utils/actionCenter";
import { getFarmInsights } from "../services/intelligence";
import { getNotifications as getEngineNotifications, markAsRead, clearNotification } from "../services/notificationEngine";
import { getSmartDashboardCards } from "../services/dashboard/smartCards";
import { getDailyFarmBriefing } from "../services/dashboard/dailyBriefing";
import { useNotificationBadge } from "../context/NotificationContext";
import { useOnboarding } from "../hooks/useOnboarding";
import { getCurrentUser, getProfile } from "../services/profileService";

export default function Dashboard() {
  const navigate = useNavigate();
  const { setUnreadCount } = useNotificationBadge();
  const { markDashboardVisited } = useOnboarding();

  const [dashboard, setDashboard] = useState(null);
  const [healthDue, setHealthDue] = useState(0);
  const [notifications, setNotifications] = useState(null);
  const [weather, setWeather] = useState(null);
  const [engineNotifications, setEngineNotifications] = useState([]);
  const [smartCards, setSmartCards] = useState([]);
  const [dailyBriefing, setDailyBriefing] = useState(null);
  const [farmInsights, setFarmInsights] = useState([]);
  const [userName, setUserName] = useState("");
  const [farmName, setFarmName] = useState("");
  const [farmRegion, setFarmRegion] = useState("");
  const [loading, setLoading] = useState(true);

  // Mark dashboard as visited for onboarding progress
  useEffect(() => {
    markDashboardVisited();
  }, [markDashboardVisited]);

  async function loadDashboard() {
    try {
      // Load user name for personalised greeting
      let weatherLocation = "";
      try {
        const user = await getCurrentUser();
        if (user) {
          const profile = await getProfile().catch(() => null);
          const name = profile?.full_name?.split(" ")[0]
            || user.user_metadata?.full_name?.split(" ")[0]
            || user.user_metadata?.name?.split(" ")[0]
            || user.email?.split("@")[0]
            || "Farmer";
          setUserName(name);
          setFarmName(profile?.farm_name || "");
          setFarmRegion(profile?.province || "South Africa");
          weatherLocation = profile?.weather_location || "";
        }
      } catch { /* non-blocking */ }

      const [dash, health, notifs, weatherData] = await Promise.all([
        getDashboardStats(),
        getHealthRecords(),
        getNotifications(),
        getWeatherSummary(weatherLocation || undefined),
      ]);

      setDashboard(dash);
      setNotifications(notifs);
      setWeather(weatherData);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const due = (health || []).filter((record) => {
        if (!record.next_due) return false;
        const dueDate = new Date(record.next_due);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate <= today;
      });

      setHealthDue(due.length);

      // Assemble unified farm data object for all engines
      const farmData = {
        planner: {
          overdue: notifs?.planner?.overdue || [],
          today: notifs?.planner?.today || [],
          upcoming: notifs?.planner?.upcoming || [],
          completed: notifs?.planner?.completed || [],
          tasks: [
            ...(notifs?.planner?.overdue || []),
            ...(notifs?.planner?.today || []),
            ...(notifs?.planner?.upcoming || []),
          ],
        },
        livestock: {
          animals: dash?.animals || [],
          healthRecords: health || [],
          breedingRecords: dash?.breedingRecords || [],
          weightRecords: dash?.weightRecords || [],
        },
        crops: dash?.crops || [],
        finance: { records: dash?.financeRecords || [] },
        machinery: {
          machines: dash?.machines || [],
          maintenancePlans: dash?.maintenancePlans || [],
          serviceHistory: dash?.serviceHistory || [],
        },
        weather: weatherData,
        intelligence: { insights: [] },
        system: { events: [] },
      };

      // Intelligence Engine
      const insights = await getFarmInsights(farmData);
      farmData.intelligence.insights = insights;
      setFarmInsights(insights);

      // Notification Engine
      const engineNotifs = getEngineNotifications(farmData);
      setEngineNotifications(engineNotifs);
      setUnreadCount(engineNotifs.filter((n) => !n.read).length);

      // Smart Card Engine
      setSmartCards(getSmartDashboardCards(farmData));

      // Daily Briefing Engine
      const briefing = getDailyFarmBriefing({
        ...farmData,
        notifications: engineNotifs,
      });
      setDailyBriefing(briefing);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading || !dashboard) {
    return (
      <PremiumPageLayout title="Dashboard" subtitle="Loading your farm...">
        <PremiumLoadingState message="Preparing your dashboard..." size={40} />
      </PremiumPageLayout>
    );
  }

  // Derived values for presentation engines
  const plannerOverdue = Number(notifications?.planner?.overdue?.length || 0);
  const plannerToday = Number(notifications?.planner?.today?.length || 0);
  const growingCrops = (dashboard.crops || []).filter((c) => c.status === "Growing").length;

  const farmHealth = calculateFarmHealthScore({
    planner: { overdue: plannerOverdue },
    health: { attention: Number(healthDue || 0) },
    machinery: { overdue: Number(notifications?.modules?.machinery || 0) },
    crops: { overdue: 0 },
    finance: { profit: 0 },
  });

  const aiInsights = generateAIInsights({
    planner: { overdue: plannerOverdue },
    health: { attention: Number(healthDue || 0) },
    machinery: { overdue: Number(notifications?.modules?.machinery || 0) },
    crops: { harvestSoon: 0 },
    finance: { profit: 0 },
    weather,
  });

  const farmTimeline = generateFarmTimeline({
    planner: { overdue: plannerOverdue },
    health: { attention: Number(healthDue || 0) },
    machinery: { overdue: Number(notifications?.modules?.machinery || 0) },
    crops: { harvestSoon: 0 },
    finance: { profit: 0 },
  });

  const actions = generateActionCenter({
    planner: { overdue: plannerOverdue, today: plannerToday },
    health: { attention: Number(healthDue || 0) },
    machinery: { overdue: Number(notifications?.modules?.machinery || 0) },
    breeding: { birthsDue: Number(notifications?.modules?.breeding || 0) },
    crops: { harvestSoon: 0 },
    finance: { profit: 0 },
    weather,
    predictions: [],
    aiInsights,
  });

  return (
    <PremiumPageLayout title="" subtitle="">
      <Stack spacing={4}>

        {/* HERO BANNER */}
        <HeroBanner
          weather={weather}
          farmHealthScore={farmHealth.score}
          farmHealthStatus={farmHealth.status}
          smartCards={smartCards}
          onCardClick={(route) => navigate(route)}
          dailyBriefing={dailyBriefing}
          userName={userName}
          farmName={farmName}
          farmRegion={farmRegion}
        />

        {/* OPERATIONS CENTRE */}
        <PremiumDashboardSection
          title="Operations Centre"
          description="AI-generated priorities and recommended actions."
        >
          <Grid container spacing={spacing.cardGap}>
            <Grid size={{ xs: 12, md: 4 }}>
              <AIInsights
                insights={aiInsights}
                onViewAll={() => navigate("/planner")}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <ActionCenter
                actions={actions}
                onViewAll={() => navigate("/planner")}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TodayPriorities
                healthDue={healthDue}
                pregnant={dashboard.pregnantBreeding}
                growing={growingCrops}
                tasksDue={plannerOverdue + plannerToday}
                onViewPlanner={() => navigate("/planner")}
              />
            </Grid>
          </Grid>
        </PremiumDashboardSection>

        {/* FARM INTELLIGENCE */}
        <PremiumDashboardSection
          title="Farm Intelligence"
          description="Smart insights powered by your farm data."
        >
          <FarmIntelligenceCenter
            insights={farmInsights}
            onAction={(route) => navigate(route)}
          />
        </PremiumDashboardSection>

        {/* QUICK ACTIONS */}
        <DashboardQuickActions />

        {/* FARM OVERVIEW */}
        <PremiumDashboardSection
          title="Farm Overview"
          description="Health score, weather and activity timeline."
        >
          <Grid container spacing={spacing.cardGap}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FarmHealthScore
                score={farmHealth.score}
                status={farmHealth.status}
                breakdown={farmHealth.breakdown}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <WeatherSummary weather={weather} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FarmTimeline events={farmTimeline} />
            </Grid>
          </Grid>
        </PremiumDashboardSection>

        {/* NOTIFICATIONS */}
        <PremiumDashboardSection
          title="Notifications"
          description="Recent farm alerts and system messages."
        >
          <NotificationCenter
            notifications={engineNotifications}
            onNotificationClick={(n) => navigate(n.route || "/dashboard")}
            onMarkAsRead={(n) => {
              markAsRead(n.id);
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }}
            onClear={(n) => {
              clearNotification(n.id);
              setEngineNotifications((prev) => prev.filter((x) => x.id !== n.id));
              if (!n.read) setUnreadCount((prev) => Math.max(0, prev - 1));
            }}
          />
        </PremiumDashboardSection>

        {/* VIEW ANALYTICS */}
        <Stack direction="row" justifyContent="center" sx={{ pt: 1, pb: 2 }}>
          <PremiumActionButton
            label="View Farm Analytics"
            variant="outlined"
            size="medium"
            startIcon={<ArrowForward />}
            onClick={() => navigate("/reports")}
            sx={{ px: 4 }}
          />
        </Stack>

      </Stack>
    </PremiumPageLayout>
  );
}
