import { useEffect, useMemo, useState } from "react";

import { Chip, Grid, Stack } from "@mui/material";
import GrassIcon from "@mui/icons-material/Grass";
import AddIcon from "@mui/icons-material/Add";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import LandscapeIcon from "@mui/icons-material/Landscape";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import {
  PremiumPageLayout,
  PremiumKPIGrid,
  PremiumStatCard,
  PremiumDashboardSection,
  PremiumActionButton,
  PremiumWorkspaceToolbar,
  PremiumLoadingState,
  spacing,
} from "../../design";

import CropForm from "../../components/crops/CropForm";
import CropTable from "../../components/crops/CropTable";
import CropHealthScore from "../../components/crops/CropHealthScore";
import CropInsights from "../../components/crops/CropInsights";
import ViewToggle from "../../components/livestock/ViewToggle";

import { getCrops } from "../../services/cropService";
import { getWeatherSummary } from "../../services/weatherService";
import { generateCropAnalytics } from "../../utils/cropAnalytics";
import { getCropLifecycle, getCropLifecycleDistribution, getHarvestReadyCrops, getCropStageColor } from "../../utils/cropLifecycle";
import PhotoSection from "../../components/photos/PhotoSection";

export default function CropPage() {
  const [crops, setCrops] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState("table");
  const [lifecycleFilter, setLifecycleFilter] = useState("all");

  async function loadCrops() {
    setLoading(true);
    try {
      const [data, weatherData] = await Promise.all([
        getCrops(),
        getWeatherSummary().catch(() => null),
      ]);
      setCrops(data || []);
      setWeather(weatherData);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCrops();
  }, []);

  const analytics = useMemo(
    () => generateCropAnalytics({ crops, weather }),
    [crops, weather]
  );

  const totalCrops = crops.length;
  const growing = crops.filter((c) => c.status === "Growing").length;
  const harvested = crops.filter((c) => c.status === "Harvested").length;
  const totalArea = crops.reduce((sum, c) => sum + Number(c.area || 0), 0);

  // Lifecycle-aware stats
  const lifecycleDist = getCropLifecycleDistribution(crops);
  const harvestReady = getHarvestReadyCrops(crops).length;
  const flowering = lifecycleDist["Flowering"] || 0;

  if (loading) {
    return (
      <PremiumPageLayout
        title="Crops"
        subtitle="Manage planting, crop health, harvesting and seasonal performance."
        icon={<GrassIcon sx={{ fontSize: 28 }} />}
      >
        <PremiumLoadingState message="Loading crop data..." size={40} />
      </PremiumPageLayout>
    );
  }

  return (
    <PremiumPageLayout
      title="Crops"
      subtitle="Manage planting, crop health, harvesting and seasonal performance."
      icon={<GrassIcon sx={{ fontSize: 28 }} />}
    >
      <Stack spacing={4}>
        {/* KPI Cards */}
        <PremiumKPIGrid gap={3.5}>
          <PremiumStatCard
            label="Growing Fields"
            value={growing}
            subtitle="Active growth"
            icon={<GrassIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(46,125,50,0.12)"
            iconColor="#2E7D32"
          />
          <PremiumStatCard
            label="Flowering"
            value={flowering}
            subtitle="In bloom"
            icon={<GrassIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(202,138,4,0.12)"
            iconColor="#CA8A04"
          />
          <PremiumStatCard
            label="Harvest Ready"
            value={harvestReady}
            subtitle="Ready to harvest"
            icon={<CheckCircleIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(180,83,9,0.12)"
            iconColor="#B45309"
          />
          <PremiumStatCard
            label="Total Area"
            value={`${totalArea.toFixed(1)} ha`}
            subtitle="Under management"
            icon={<LandscapeIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(21,101,192,0.12)"
            iconColor="#1565C0"
          />
        </PremiumKPIGrid>

        {/* Crop Intelligence */}
        <PremiumDashboardSection
          title="Crop Intelligence"
          description="AI-powered crop monitoring and harvest recommendations."
        >
          <Grid container spacing={spacing.cardGap}>
            <Grid size={{ xs: 12, md: 4 }}>
              <CropHealthScore analytics={analytics} />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <CropInsights analytics={analytics} />
            </Grid>
          </Grid>
        </PremiumDashboardSection>

        {/* Crop Form (toggle) */}
        {showForm && (
          <CropForm
            crop={selectedCrop}
            refreshCrops={loadCrops}
            onSaved={() => { setSelectedCrop(null); setShowForm(false); }}
          />
        )}

        {/* Photo Gallery for selected crop */}
        {selectedCrop && selectedCrop.id && (
          <PhotoSection module="crops" recordId={String(selectedCrop.id)} title="Crop Photos" />
        )}

        {/* Crop Records */}
        <PremiumDashboardSection
          title="Crop Registry"
          description={`${totalCrops} crop${totalCrops !== 1 ? "s" : ""} in your registry.`}
        >
          <PremiumWorkspaceToolbar
            primaryAction={
              <PremiumActionButton
                label="Add Crop"
                variant="contained"
                color="success"
                startIcon={<AddIcon />}
                onClick={() => setShowForm((prev) => !prev)}
              />
            }
            viewToggle={<ViewToggle view={view} setView={setView} />}
          />
          {/* Lifecycle Filter */}
          {(() => {
            const dist = getCropLifecycleDistribution(crops);
            const stages = Object.keys(dist).filter((s) => s !== "Unknown");
            if (stages.length === 0) return null;
            return (
              <Stack direction="row" spacing={0.75} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
                <Chip label="All Stages" size="small" variant={lifecycleFilter === "all" ? "filled" : "outlined"} color={lifecycleFilter === "all" ? "primary" : "default"} onClick={() => setLifecycleFilter("all")} sx={{ fontWeight: 600, cursor: "pointer", fontSize: "0.7rem" }} />
                {stages.map((stage) => {
                  const sc = getCropStageColor(stage);
                  return (
                    <Chip key={stage} label={`${stage} (${dist[stage]})`} size="small" variant={lifecycleFilter === stage ? "filled" : "outlined"} onClick={() => setLifecycleFilter(stage)} sx={{ fontWeight: 600, cursor: "pointer", fontSize: "0.7rem", ...(lifecycleFilter === stage ? { bgcolor: sc.bg, color: sc.color, borderColor: sc.color } : {}) }} />
                  );
                })}
              </Stack>
            );
          })()}
          <CropTable
            crops={lifecycleFilter === "all" ? crops : crops.filter((c) => getCropLifecycle(c).lifecycleStage === lifecycleFilter)}
            onEdit={(crop) => { setSelectedCrop(crop); setShowForm(true); }}
            refreshCrops={loadCrops}
          />
        </PremiumDashboardSection>
      </Stack>
    </PremiumPageLayout>
  );
}
