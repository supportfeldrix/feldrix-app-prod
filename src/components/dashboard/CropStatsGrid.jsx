import StatCard from "../ui/StatCard";

import { formatArea, cropAreaToHa } from "../../utils/units";
import useFarmContext from "../../hooks/useFarmContext";

export default function CropStatsGrid({ crops = [] }) {
  const farmCtx = useFarmContext();
  const totalCrops = crops.length;

  const growing = crops.filter(
    (crop) => crop.status === "Growing"
  ).length;

  const harvested = crops.filter(
    (crop) => crop.status === "Harvested"
  ).length;

  // Canonical hectares: normalize each crop from its own area_unit before
  // summing; display converts to the farm's measurement system.
  const totalArea = crops.reduce((sum, crop) => sum + cropAreaToHa(crop), 0);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
        gap: 20,
        marginTop: 30,
        marginBottom: 30,
      }}
    >
      <StatCard
        title="Total Crops"
        value={totalCrops}
        icon="🌾"
      />

      <StatCard
        title="Growing"
        value={growing}
        icon="🌱"
        color="#2E7D32"
      />

      <StatCard
        title="Harvested"
        value={harvested}
        icon="🚜"
        color="#EF6C00"
      />

      <StatCard
        title="Total Area"
        value={formatArea(totalArea, farmCtx)}
        icon="📏"
        color="#1565C0"
      />
    </div>
  );
}
