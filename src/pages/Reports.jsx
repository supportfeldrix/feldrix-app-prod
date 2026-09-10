import { useEffect, useMemo, useState } from "react";

import {
  Box,
  ButtonBase,
  Chip,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import AddIcon from "@mui/icons-material/Add";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PetsIcon from "@mui/icons-material/Pets";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import GrassIcon from "@mui/icons-material/Grass";
import BuildIcon from "@mui/icons-material/Build";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import SummarizeIcon from "@mui/icons-material/Summarize";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import SearchIcon from "@mui/icons-material/Search";

import {
  PremiumPageLayout,
  PremiumKPIGrid,
  PremiumStatCard,
  PremiumDashboardSection,
  PremiumActionButton,
  PremiumWorkspaceToolbar,
  PremiumLoadingState,
} from "../design";

import IncomeExpenseChart from "../components/reports/IncomeExpenseChart";

import BillingHistory from "../components/billing/BillingHistory";
import SubscriptionTimeline from "../components/billing/SubscriptionTimeline";

import ViewToggle from "../components/livestock/ViewToggle";
import GenerateReportDialog from "../components/reports/GenerateReportDialog";
import ReportPreviewDialog from "../components/reports/ReportPreviewDialog";

import { getFarmReport } from "../services/reportService";
import { generateReport } from "../services/reports/reportGenerator";
import { generateReportPdf } from "../utils/reportPdfGenerator";
import { generateReportExcel } from "../utils/reportExcelGenerator";
import { formatCurrency } from "../utils/currency";
import useFarmContext from "../hooks/useFarmContext";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const REPORT_TEMPLATES = [
  { id: "finance-monthly", title: "Monthly Finance Report", description: "Income, expenses and profitability summary", icon: <AccountBalanceWalletIcon sx={{ fontSize: 22 }} />, color: "success.main" },
  { id: "livestock-perf", title: "Livestock Performance Report", description: "Herd health, weight trends and breeding rates", icon: <PetsIcon sx={{ fontSize: 22 }} />, color: "success.dark" },
  { id: "breeding-perf", title: "Breeding Performance Report", description: "Conception rates, calving intervals and genetics", icon: <FavoriteIcon sx={{ fontSize: 22 }} />, color: "error.light" },
  { id: "health-summary", title: "Animal Health Report", description: "Vaccination coverage, treatments and disease tracking", icon: <LocalHospitalIcon sx={{ fontSize: 22 }} />, color: "error.main" },
  { id: "crop-perf", title: "Crop Performance Report", description: "Yield analysis, growth stages and harvest forecasts", icon: <GrassIcon sx={{ fontSize: 22 }} />, color: "success.light" },
  { id: "machinery-cost", title: "Machinery Cost Report", description: "Running costs, service history and fleet utilisation", icon: <BuildIcon sx={{ fontSize: 22 }} />, color: "warning.main" },
  { id: "rainfall-summary", title: "Rainfall Report", description: "Farmer-recorded rainfall totals for the period", icon: <WaterDropIcon sx={{ fontSize: 22 }} />, color: "info.light" },
  { id: "farm-summary", title: "Farm Summary Report", description: "Complete farm overview for stakeholders and banks", icon: <SummarizeIcon sx={{ fontSize: 22 }} />, color: "info.main" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Reports Page
// ─────────────────────────────────────────────────────────────────────────────

export default function Reports() {
  const farmCtx = useFarmContext();
  const [report, setReport] = useState({
    totalAnimals: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    animals: [],
    finance: [],
    breeding: [],
    health: [],
  });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("table");
  const [reportSearch, setReportSearch] = useState("");

  // Dialog state
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);

  // Generated report history
  const [generatedReports, setGeneratedReports] = useState([]);
  const [historySearch, setHistorySearch] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    try {
      const data = await getFarmReport();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Report Generation Handler
  // ─────────────────────────────────────────────────────────────────────────

  async function handleGenerate(options) {
    setGenerating(true);
    try {
      const result = await generateReport(options.reportId, options);
      setGeneratedReports((prev) => [result, ...prev]);
      setGenerateDialogOpen(false);
      setPreviewReport(result);
      setPreviewOpen(true);
    } catch (err) {
      console.error("Report generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  function handleTemplateClick(template) {
    setSelectedTemplate(template);
    setGenerateDialogOpen(true);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Export Handlers
  // ─────────────────────────────────────────────────────────────────────────

  async function handleDownloadPdf(rpt) {
    await generateReportPdf(rpt || previewReport);
  }

  function handleDownloadExcel(rpt) {
    generateReportExcel(rpt || previewReport);
  }

  function handleDeleteReport(id) {
    setGeneratedReports((prev) => prev.filter((r) => r.id !== id));
  }

  function handlePreviewFromHistory(rpt) {
    setPreviewReport(rpt);
    setPreviewOpen(true);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // AI Recommendations (Phase 6 — live data)
  // ─────────────────────────────────────────────────────────────────────────

  const recommendations = useMemo(() => {
    const items = [];
    if (report.netProfit < 0) {
      items.push({ severity: "high", message: "Farm is operating at a loss. Generate a Finance report to identify cost drivers.", action: "finance-monthly", actionLabel: "Finance Report" });
    }
    if (report.totalAnimals > 0 && report.health.length === 0) {
      items.push({ severity: "medium", message: "No health records found. Generate a Health report to identify monitoring gaps.", action: "health-summary", actionLabel: "Health Report" });
    }
    if (report.breeding.length > 0) {
      items.push({ severity: "low", message: "Breeding data available. Generate a Breeding report to track conception rates.", action: "breeding-perf", actionLabel: "Breeding Report" });
    }
    if (report.totalIncome > 0) {
      items.push({ severity: "low", message: "Financial data ready. Generate a Monthly Finance report for tax filing.", action: "finance-monthly", actionLabel: "Finance Report" });
    }
    if (items.length === 0) {
      items.push({ severity: "low", message: "All reports are up to date. Generate a Farm Summary to share with stakeholders.", action: "farm-summary", actionLabel: "Farm Summary" });
    }
    return items.slice(0, 3);
  }, [report]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PremiumPageLayout
        title="Reports Centre"
        subtitle="Generate professional reports, exports and farm performance summaries."
        icon={<AssessmentIcon sx={{ fontSize: 28 }} />}
      >
        <PremiumLoadingState message="Loading reports..." size={40} />
      </PremiumPageLayout>
    );
  }

  return (
    <PremiumPageLayout
      title="Reports Centre"
      subtitle="Generate professional reports, exports and farm performance summaries."
      icon={<AssessmentIcon sx={{ fontSize: 28 }} />}
    >
      <Stack spacing={4}>
        {/* KPI Cards */}
        <PremiumKPIGrid gap={3.5}>
          <PremiumStatCard
            label="Total Animals"
            value={report.totalAnimals}
            subtitle="In your herd"
            icon={<PetsIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(46,125,50,0.12)"
            iconColor="#2E7D32"
          />
          <PremiumStatCard
            label="Total Income"
            value={formatCurrency(report.totalIncome || 0, farmCtx)}
            subtitle="Revenue"
            icon={<AccountBalanceWalletIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(22,163,74,0.12)"
            iconColor="#16A34A"
          />
          <PremiumStatCard
            label="Total Expenses"
            value={formatCurrency(report.totalExpenses || 0, farmCtx)}
            subtitle="Costs"
            icon={<AccountBalanceWalletIcon sx={{ fontSize: 28 }} />}
            iconBg="rgba(220,38,38,0.12)"
            iconColor="#DC2626"
          />
          <PremiumStatCard
            label="Net Profit"
            value={formatCurrency(report.netProfit || 0, farmCtx)}
            subtitle={report.netProfit >= 0 ? "Profitable" : "Loss"}
            icon={<AssessmentIcon sx={{ fontSize: 28 }} />}
            iconBg={report.netProfit >= 0 ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)"}
            iconColor={report.netProfit >= 0 ? "#16A34A" : "#DC2626"}
          />
        </PremiumKPIGrid>

        {/* Reporting Intelligence */}
        <PremiumDashboardSection
          title="Reporting Intelligence"
          description="AI-powered report recommendations based on your farm data."
        >
          <Stack spacing={2}>
            {recommendations.map((rec, idx) => (
              <Stack
                key={idx}
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={1.5}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: rec.severity === "high" ? "rgba(211,47,47,0.04)" : rec.severity === "medium" ? "rgba(237,108,2,0.04)" : "rgba(46,125,50,0.04)",
                  border: "1px solid",
                  borderColor: rec.severity === "high" ? "rgba(211,47,47,0.12)" : rec.severity === "medium" ? "rgba(237,108,2,0.12)" : "rgba(46,125,50,0.12)",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                  <TipsAndUpdatesIcon sx={{ fontSize: 20, color: rec.severity === "high" ? "error.main" : rec.severity === "medium" ? "warning.main" : "success.main" }} />
                  <span style={{ fontSize: "0.875rem" }}>{rec.message}</span>
                </Stack>
                <PremiumActionButton
                  label={rec.actionLabel}
                  variant="outlined"
                  size="small"
                  onClick={() => handleTemplateClick(REPORT_TEMPLATES.find((t) => t.id === rec.action))}
                />
              </Stack>
            ))}
          </Stack>
        </PremiumDashboardSection>

        {/* Performance Charts */}
        <PremiumDashboardSection
          title="Performance Charts"
          description="Visual farm performance analytics."
        >
          <IncomeExpenseChart income={report.totalIncome} expenses={report.totalExpenses} />
        </PremiumDashboardSection>

        {/* Report Library */}
        <PremiumDashboardSection
          title="Report Library"
          description="Browse and generate farm reports."
        >
          <PremiumWorkspaceToolbar
            primaryAction={
              <PremiumActionButton
                label="Generate Report"
                variant="contained"
                color="success"
                startIcon={<AddIcon />}
                onClick={() => handleTemplateClick(REPORT_TEMPLATES[0])}
              />
            }
            viewToggle={<ViewToggle view={view} setView={setView} />}
            searchPlaceholder="Search reports..."
            searchValue={reportSearch}
            onSearchChange={setReportSearch}
          />
          <ReportLibrary search={reportSearch} onSelect={handleTemplateClick} />
        </PremiumDashboardSection>

        {/* Generated Reports History (Phase 5) */}
        {generatedReports.length > 0 && (
          <PremiumDashboardSection
            title="Generated Reports"
            description="Your report history. Preview, download or delete."
          >
            <GeneratedReportsTable
              reports={generatedReports}
              search={historySearch}
              onSearchChange={setHistorySearch}
              onPreview={handlePreviewFromHistory}
              onDownloadPdf={handleDownloadPdf}
              onDownloadExcel={handleDownloadExcel}
              onDelete={handleDeleteReport}
            />
          </PremiumDashboardSection>
        )}

        {/* Recent Exports / Billing */}
        <PremiumDashboardSection
          title="Recent Exports"
          description="Invoices, receipts and subscription payment history."
        >
          <BillingHistory />
        </PremiumDashboardSection>

        {/* Scheduled Reports / Timeline */}
        <PremiumDashboardSection
          title="Scheduled Reports"
          description="Subscription events and billing timeline."
        >
          <SubscriptionTimeline />
        </PremiumDashboardSection>
      </Stack>

      {/* Generate Report Dialog */}
      <GenerateReportDialog
        open={generateDialogOpen}
        report={selectedTemplate}
        onClose={() => setGenerateDialogOpen(false)}
        onGenerate={handleGenerate}
        generating={generating}
      />

      {/* Report Preview Dialog */}
      <ReportPreviewDialog
        open={previewOpen}
        report={previewReport}
        onClose={() => setPreviewOpen(false)}
        onDownloadPdf={() => handleDownloadPdf(previewReport)}
        onDownloadExcel={() => handleDownloadExcel(previewReport)}
      />
    </PremiumPageLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Report Library (Phase 1 — Interactive)
// ─────────────────────────────────────────────────────────────────────────────

function ReportLibrary({ search = "", onSelect }) {
  const filtered = REPORT_TEMPLATES.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Stack spacing={0} divider={<Divider />}>
      {filtered.length === 0 ? (
        <Box sx={{ py: 4, textAlign: "center" }}>
          <Typography color="text.secondary">No reports match your search.</Typography>
        </Box>
      ) : (
        filtered.map((template) => (
          <ButtonBase
            key={template.id}
            onClick={() => onSelect(template)}
            sx={{
              width: "100%",
              textAlign: "left",
              py: 2,
              px: 1.5,
              borderRadius: 2,
              cursor: "pointer",
              transition: "all 0.2s ease",
              border: "1px solid transparent",
              "&:hover": {
                bgcolor: "action.hover",
                borderColor: "success.main",
                transform: "translateY(-1px)",
                boxShadow: "0 2px 8px rgba(46,125,50,0.08)",
                "& .chevron-icon": { transform: "translateX(4px)", color: "success.main" },
              },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: "100%" }}>
              <Box sx={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "grey.100", color: template.color, flexShrink: 0 }}>
                {template.icon}
              </Box>
              <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} color="text.primary">{template.title}</Typography>
                <Typography variant="caption" color="text.secondary">{template.description}</Typography>
              </Stack>
              <ChevronRightIcon className="chevron-icon" sx={{ color: "text.disabled", fontSize: 20, flexShrink: 0, transition: "all 0.2s ease" }} />
            </Stack>
          </ButtonBase>
        ))
      )}
    </Stack>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Generated Reports Table (Phase 5 — Enterprise Data Grid)
// ─────────────────────────────────────────────────────────────────────────────

function GeneratedReportsTable({ reports, search, onSearchChange, onPreview, onDownloadPdf, onDownloadExcel, onDelete }) {
  const filtered = reports.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Stack spacing={2}>
      {/* Search */}
      <TextField
        size="small"
        placeholder="Search generated reports..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{ startAdornment: <SearchIcon sx={{ color: "text.disabled", mr: 1, fontSize: 20 }} /> }}
        sx={{ maxWidth: 320 }}
      />

      {/* Table */}
      <Box sx={{ overflowX: "auto", borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <Box
            component="thead"
            sx={{ position: "sticky", top: 0, bgcolor: "grey.50", zIndex: 1 }}
          >
            <Box component="tr">
              {["Report", "Generated", "Period", "Format", "Actions"].map((col) => (
                <Box
                  key={col}
                  component="th"
                  sx={{ py: 1.5, px: 2, textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid", borderColor: "divider" }}
                >
                  {col}
                </Box>
              ))}
            </Box>
          </Box>
          <Box component="tbody">
            {filtered.length === 0 ? (
              <Box component="tr">
                <Box component="td" colSpan={5} sx={{ py: 4, textAlign: "center", color: "text.secondary", fontSize: "0.875rem" }}>
                  No generated reports found.
                </Box>
              </Box>
            ) : (
              filtered.map((rpt) => (
                <Box
                  key={rpt.id}
                  component="tr"
                  sx={{
                    transition: "background 0.15s",
                    "&:hover": { bgcolor: "action.hover" },
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Box component="td" sx={{ py: 1.5, px: 2 }}>
                    <Typography variant="body2" fontWeight={600}>{rpt.title}</Typography>
                  </Box>
                  <Box component="td" sx={{ py: 1.5, px: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(rpt.generatedDate).toLocaleString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </Typography>
                  </Box>
                  <Box component="td" sx={{ py: 1.5, px: 2 }}>
                    <Typography variant="caption" color="text.secondary">{rpt.period?.label || "\u2014"}</Typography>
                  </Box>
                  <Box component="td" sx={{ py: 1.5, px: 2 }}>
                    <Chip label={rpt.format?.toUpperCase()} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: "0.65rem" }} />
                  </Box>
                  <Box component="td" sx={{ py: 1, px: 2 }}>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Preview">
                        <IconButton size="small" onClick={() => onPreview(rpt)}><VisibilityIcon sx={{ fontSize: 18 }} /></IconButton>
                      </Tooltip>
                      <Tooltip title="Download PDF">
                        <IconButton size="small" onClick={() => onDownloadPdf(rpt)}><DownloadIcon sx={{ fontSize: 18 }} /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => onDelete(rpt.id)}><DeleteOutlineIcon sx={{ fontSize: 18 }} /></IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>
    </Stack>
  );
}
