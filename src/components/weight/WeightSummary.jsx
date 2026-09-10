import { formatMass } from "../../utils/units";
import useFarmContext from "../../hooks/useFarmContext";

export default function WeightSummary({
  records = [],
}) {
  const farmCtx = useFarmContext();
  if (records.length === 0) return null;

  // Always sort by creation time (newest first)
  const sorted = [...records].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const latest = sorted[0];
  const oldest = sorted[sorted.length - 1];

  const gain =
    Number(latest.weight) -
    Number(oldest.weight);

  const cards = [
    {
      title: "Latest Weight",
      value: formatMass(latest.weight, farmCtx),
      color: "#2563EB",
    },
    {
      title: "First Weight",
      value: formatMass(oldest.weight, farmCtx),
      color: "#64748B",
    },
    {
      title: "Weight Gain",
      value: `${gain >= 0 ? "+" : "-"}${formatMass(Math.abs(gain), farmCtx)}`,
      color: gain >= 0 ? "#16A34A" : "#DC2626",
    },
    {
      title: "Records",
      value: sorted.length,
      color: "#F59E0B",
    },
  ];

  return (
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
            boxShadow: "0 8px 20px rgba(15,23,42,.08)",
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
  );
}
