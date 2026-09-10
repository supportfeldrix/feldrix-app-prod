import StatCard from "../ui/StatCard";
import { formatCurrency } from "../../utils/currency";
import { formatArea } from "../../utils/units";
import useFarmContext from "../../hooks/useFarmContext";

export default function FarmSummary({ dashboard }) {
  const farmCtx = useFarmContext();
  if (!dashboard) return null;

  const {
    totalValue = 0,
    totalArea = 0,
    animals = [],
    crops = [],
  } = dashboard;

  const healthyAnimals = animals.filter(
    (animal) => animal.status === "Healthy"
  ).length;

  const growingCrops = crops.filter(
    (crop) => crop.status === "Growing"
  ).length;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            🚜 Farm Summary
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Live overview of your farm operations.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
        <StatCard
          title="Farm Value"
          value={formatCurrency(totalValue, farmCtx)}
          icon="💰"
          color="#2E7D32"
        />

        <StatCard
          title="Farm Area"
          value={formatArea(totalArea, farmCtx)}
          icon="📏"
          color="#1565C0"
        />

        <StatCard
          title="Healthy Animals"
          value={healthyAnimals}
          icon="❤️"
          color="#43A047"
        />

        <StatCard
          title="Growing Crops"
          value={growingCrops}
          icon="🌱"
          color="#7CB342"
        />
      </div>
    </section>
  );
}
