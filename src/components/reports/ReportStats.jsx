import { useEffect, useState } from "react";

import StatCard from "../ui/StatCard";

import { getFarmReport } from "../../services/reportService";
import { formatCurrency as formatMoney } from "../../utils/currency";
import useFarmContext from "../../hooks/useFarmContext";

export default function ReportStats() {
  const farmCtx = useFarmContext();
  const [stats, setStats] = useState({
    totalAnimals: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const report = await getFarmReport();
      setStats(report);
    } catch (err) {
      console.error(err);
    }
  }

  const formatCurrency = (value) => formatMoney(value || 0, farmCtx);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit,minmax(240px,1fr))",
        gap: 20,
        marginBottom: 30,
      }}
    >
      <StatCard
        title="Total Animals"
        value={stats.totalAnimals}
        icon="🐄"
        color="#2563EB"
      />

      <StatCard
        title="Total Income"
        value={formatCurrency(
          stats.totalIncome
        )}
        icon="💰"
        color="#16A34A"
      />

      <StatCard
        title="Total Expenses"
        value={formatCurrency(
          stats.totalExpenses
        )}
        icon="💸"
        color="#DC2626"
      />

      <StatCard
        title="Net Profit"
        value={formatCurrency(
          stats.netProfit
        )}
        icon={
          stats.netProfit >= 0
            ? "📈"
            : "📉"
        }
        color={
          stats.netProfit >= 0
            ? "#16A34A"
            : "#DC2626"
        }
      />
    </div>
  );
}
