import { useEffect, useState } from "react";

import { Grid, Stack } from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import AddIcon from "@mui/icons-material/Add";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ShowChartIcon from "@mui/icons-material/ShowChart";

import {
  PremiumPageLayout,
  PremiumKPIGrid,
  PremiumStatCard,
  PremiumDashboardSection,
  PremiumActionButton,
  PremiumWorkspaceToolbar,
  PremiumLoadingState,
  spacing,
} from "../design";

import FinanceForm from "../components/finance/FinanceForm";
import FinanceTable from "../components/finance/FinanceTable";
import FinanceInsights from "../components/finance/FinanceInsights";
import FinancialHealthScore from "../components/finance/FinancialHealthScore";

import { getFinanceRecords } from "../services/financeService";
import { generateFinanceAnalytics } from "../utils/financeAnalytics";
import { formatCurrency } from "../utils/currency";
import useFarmContext from "../hooks/useFarmContext";

export default function Finance() {
  const farmCtx = useFarmContext(); // farm operating currency/locale (null → ZAR/en-ZA)
  const fmtMoney = (v) => formatCurrency(Math.abs(Number(v || 0)), farmCtx);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadRecords() {
    try {
      const data = await getFinanceRecords();
      setRecords(data || []);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  if (loading) {
    return (
      <PremiumPageLayout
        title="Finance"
        subtitle="Track farm income, expenses, profitability and cash flow."
        icon={<AccountBalanceWalletIcon sx={{ fontSize: 28 }} />}
      >
        <PremiumLoadingState message="Loading financial data..." size={40} />
      </PremiumPageLayout>
    );
  }

  const analytics = generateFinanceAnalytics({ financeRecords: records });

  const income = records
    .filter((r) => r.category === "Income")
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const expenses = records
    .filter((r) => r.category === "Expense")
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const profit = income - expenses;

  return (
    <PremiumPageLayout
      title="Finance"
      subtitle="Track farm income, expenses, profitability and cash flow."
      icon={<AccountBalanceWalletIcon sx={{ fontSize: 28 }} />}
    >
      <Stack spacing={4}>
        {/* KPI Cards */}
        <PremiumKPIGrid gap={3.5}>
          <PremiumStatCard
            label="Total Income"
            value={fmtMoney(income)}
            subtitle="All revenue"
            icon={<TrendingUpIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(22,163,74,0.12)"
            iconColor="#16A34A"
          />
          <PremiumStatCard
            label="Total Expenses"
            value={fmtMoney(expenses)}
            subtitle="All costs"
            icon={<TrendingDownIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(220,38,38,0.12)"
            iconColor="#DC2626"
          />
          <PremiumStatCard
            label="Net Profit"
            value={`${profit >= 0 ? "+" : "-"}${fmtMoney(profit)}`}
            subtitle={profit >= 0 ? "Profitable" : "Operating at loss"}
            icon={<ShowChartIcon sx={{ fontSize: 28 }} />}
            iconBg={profit >= 0 ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)"}
            iconColor={profit >= 0 ? "#16A34A" : "#DC2626"}
          />
          <PremiumStatCard
            label="Transactions"
            value={records.length}
            subtitle="Total records"
            icon={<ReceiptLongIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(245,158,11,0.12)"
            iconColor="#F59E0B"
          />
        </PremiumKPIGrid>

        {/* Financial Intelligence */}
        <PremiumDashboardSection
          title="Financial Intelligence"
          description="AI-powered profitability monitoring and cost insights."
        >
          <Grid container spacing={spacing.cardGap}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FinancialHealthScore analytics={analytics} />
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <FinanceInsights analytics={analytics} />
            </Grid>
          </Grid>
        </PremiumDashboardSection>

        {/* Transaction Form (toggle) */}
        {showForm && (
          <FinanceForm
            record={selectedRecord}
            refreshRecords={loadRecords}
            onSaved={() => { setSelectedRecord(null); setShowForm(false); }}
          />
        )}

        {/* Finance Records */}
        <PremiumDashboardSection
          title="Transactions"
          description={`${records.length} financial record${records.length !== 1 ? "s" : ""} in your ledger.`}
        >
          <PremiumWorkspaceToolbar
            primaryAction={
              <PremiumActionButton
                label="Record Transaction"
                variant="contained"
                color="success"
                startIcon={<AddIcon />}
                onClick={() => setShowForm((prev) => !prev)}
              />
            }
          />
          <FinanceTable
            records={records}
            refreshRecords={loadRecords}
            onEdit={(record) => { setSelectedRecord(record); setShowForm(true); }}
          />
        </PremiumDashboardSection>
      </Stack>
    </PremiumPageLayout>
  );
}
