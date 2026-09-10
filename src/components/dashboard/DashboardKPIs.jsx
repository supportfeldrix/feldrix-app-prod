import MetricCard from "../ui/MetricCard";
import { formatCurrency } from "../../utils/currency";
import { formatArea, formatMass } from "../../utils/units";
import useFarmContext from "../../hooks/useFarmContext";

export default function DashboardKPIs({
  dashboard,
  healthDue = 0,
}) {
  const farmCtx = useFarmContext();
  if (!dashboard) return null;

  const animals = dashboard.animals || [];
  const crops = dashboard.crops || [];

  const healthyAnimals = animals.filter(
    (a) => a.status === "Healthy"
  ).length;

  const pregnantAnimals = dashboard.pregnantBreeding || 0;

  const growingCrops = crops.filter(
    (c) => c.status === "Growing"
  ).length;

  const totalArea = Number(dashboard.totalArea || 0);

  const totalValue = Number(dashboard.totalValue || 0);

  const averageWeight =
    animals.length === 0
      ? 0
      : Math.round(
          animals.reduce(
            (sum, animal) =>
              sum + Number(animal.weight || 0),
            0
          ) / animals.length
        );

  return (
    <section style={{ marginBottom: 30 }}>
      <h2
        style={{
          marginBottom: 6,
          color: "#0F172A",
        }}
      >
        📊 Farm KPIs
      </h2>

      <p
        style={{
          color: "#64748B",
          marginBottom: 22,
        }}
      >
        Live performance overview of your farm.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 18,
        }}
      >
        <MetricCard
          title="Farm Value"
          value={formatCurrency(totalValue, farmCtx)}
          subtitle="Estimated farm value"
          icon="💰"
          color="#16A34A"
        />

        <MetricCard
          title="Animals"
          value={animals.length}
          subtitle="Registered livestock"
          icon="🐄"
          color="#2563EB"
        />

        <MetricCard
          title="Healthy"
          value={healthyAnimals}
          subtitle="Animals in good health"
          icon="❤️"
          color="#16A34A"
        />

        <MetricCard
          title="Pregnant"
          value={pregnantAnimals}
          subtitle="Active pregnancies"
          icon="🍼"
          color="#F59E0B"
        />

        <MetricCard
          title="Crops"
          value={crops.length}
          subtitle="Registered crops"
          icon="🌾"
          color="#2E7D32"
        />

        <MetricCard
          title="Growing"
          value={growingCrops}
          subtitle="Growing crops"
          icon="🌱"
          color="#84CC16"
        />

        <MetricCard
          title="Farm Area"
          value={formatArea(totalArea, farmCtx)}
          subtitle="Total planted area"
          icon="📏"
          color="#0EA5E9"
        />

        <MetricCard
          title="Avg Weight"
          value={formatMass(averageWeight, farmCtx)}
          subtitle="Average herd weight"
          icon="⚖️"
          color="#7C3AED"
        />

        <MetricCard
          title="Health Due"
          value={healthDue}
          subtitle="Treatments due"
          icon="💉"
          color="#DC2626"
        />
      </div>
    </section>
  );
}
