import { Link } from "react-router-dom";

const actions = [
  {
    label: "Add Animal",
    icon: "🐄",
    to: "/livestock",
    color: "#2563EB",
  },
  {
    label: "Add Crop",
    icon: "🌾",
    to: "/crops",
    color: "#16A34A",
  },
  {
    label: "Health",
    icon: "❤️",
    to: "/health",
    color: "#DC2626",
  },
  {
    label: "Finance",
    icon: "💳",
    to: "/finance",
    color: "#F59E0B",
  },
  {
    label: "Machinery",
    icon: "🚜",
    to: "/machinery",
    color: "#6D4C41",
  },
];

export default function QuickActions() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2,1fr)",
        gap: 10,
        marginTop: 24,
      }}
    >
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.to}
          style={{
            textDecoration: "none",
            background: "rgba(255,255,255,.14)",
            color: "white",
            padding: "12px 14px",
            borderRadius: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: ".2s",
          }}
        >
          <span>{action.icon}</span>
          {action.label}
        </Link>
      ))}
    </div>
  );
}
