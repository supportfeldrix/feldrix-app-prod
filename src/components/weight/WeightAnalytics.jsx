import { calculateWeightAnalytics } from "../../utils/weightAnalytics";
import { formatMass, unitLabel } from "../../utils/units";
import useFarmContext from "../../hooks/useFarmContext";

export default function WeightAnalytics({
  records = [],
}) {
  const farmCtx = useFarmContext();
  const analytics =
    calculateWeightAnalytics(records);

  if (!analytics) return null;

  const massUnit = unitLabel("mass", farmCtx);

  const cards = [
    {
      title: "Highest Weight",
      value: formatMass(analytics.highestWeight, farmCtx),
      color: "#16A34A",
    },
    {
      title: "Lowest Weight",
      value: formatMass(analytics.lowestWeight, farmCtx),
      color: "#2563EB",
    },
    {
      title: "Weight Gain",
      value: `${analytics.totalGain >= 0 ? "+" : "-"}${formatMass(Math.abs(analytics.totalGain), farmCtx)}`,
      color:
        analytics.totalGain >= 0
          ? "#16A34A"
          : "#DC2626",
    },
    {
      title: "Growth %",
      value: `${analytics.growthPercentage.toFixed(
        1
      )}%`,
      color: "#7C3AED",
    },
    {
      title: "Avg Daily Gain",
      value: `${formatMass(analytics.averageDailyGain, farmCtx, { withUnit: false })} ${massUnit}/day`,
      color: "#0891B2",
    },
    {
      title: "Days Tracked",
      value: analytics.totalDays,
      color: "#F59E0B",
    },
    {
      title: "Weight Records",
      value: analytics.records,
      color: "#6366F1",
    },
    {
      title: "Last Weighed",
      value: `${analytics.daysSinceLastWeight} days ago`,
      color: "#EA580C",
    },
  ];

  return (
    <>
      <h3
        style={{
          marginBottom: 16,
          fontSize: 20,
          fontWeight: 700,
          color: "#1E293B",
        }}
      >
        📊 Weight Analytics
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
          marginBottom: 24,
        }}
      >
        {cards.map((card) => (
          <div
            key={card.title}
            style={{
              background: "#FFFFFF",
              borderRadius: 16,
              padding: 20,
              boxShadow:
                "0 8px 20px rgba(15,23,42,.08)",
              border: "1px solid #E2E8F0",
            }}
          >
            <div
              style={{
                color: "#64748B",
                fontSize: 13,
              }}
            >
              {card.title}
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 28,
                fontWeight: 700,
                color: card.color,
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
