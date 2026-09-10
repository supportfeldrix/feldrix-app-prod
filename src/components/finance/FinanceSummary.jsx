import StatCard from "../ui/StatCard";
import { formatCurrency } from "../../utils/currency";
import useFarmContext from "../../hooks/useFarmContext";

export default function FinanceSummary({
  income = 0,
  expenses = 0,
  profit = 0,
  transactions = [],
}) {
  const farmCtx = useFarmContext();
  const fmt = (value) => formatCurrency(value, farmCtx);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: 20,
        marginBottom: 30,
      }}
    >
      <StatCard
        title="Income"
        value={fmt(income)}
        icon="💰"
        color="#16A34A"
      />

      <StatCard
        title="Expenses"
        value={fmt(expenses)}
        icon="💸"
        color="#DC2626"
      />

      <StatCard
        title="Net Profit"
        value={fmt(profit)}
        icon="📈"
        color={profit >= 0 ? "#2563EB" : "#DC2626"}
      />

      <StatCard
        title="Transactions"
        value={transactions.length}
        icon="🧾"
        color="#7C3AED"
      />
    </div>
  );
}
