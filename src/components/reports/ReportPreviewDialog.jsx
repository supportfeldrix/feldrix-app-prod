import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { generateInvoicePdf } from "../../utils/invoicePdfGenerator";

function formatDate(iso) {
  if (!iso) return "\u2014";
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

export default function ReportPreviewDialog({ open, report, onClose, onDownloadPdf, onDownloadExcel }) {
  if (!report) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogContent sx={{ px: { xs: 3, md: 5 }, pt: 5, pb: 2 }}>
        <Stack spacing={4}>
          {/* Header */}
          <Stack alignItems="center" spacing={1}>
            <Box component="img" src="/branding/feldrix-logo-green.png" alt="Feldrix" sx={{ width: 120, height: "auto" }} />
            <Typography variant="h5" fontWeight={700}>{report.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(report.period?.from)} — {formatDate(report.period?.to)}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Generated: {formatDate(report.generatedDate)}
            </Typography>
          </Stack>

          <Divider />

          {/* Statistics */}
          {report.statistics && (
            <Stack spacing={2}>
              <Typography variant="subtitle2" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                Key Metrics
              </Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 2 }}>
                {Object.entries(report.statistics).map(([key, value]) => (
                  <Box key={key} sx={{ p: 2, borderRadius: 2, bgcolor: "grey.50", border: "1px solid", borderColor: "divider" }}>
                    <Typography variant="caption" color="text.disabled" sx={{ textTransform: "uppercase", fontSize: "0.6rem", fontWeight: 700 }}>
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>{typeof value === "number" ? value.toLocaleString() : value}</Typography>
                  </Box>
                ))}
              </Box>
            </Stack>
          )}

          {/* Sections */}
          {report.sections?.map((section, idx) => (
            <Stack key={idx} spacing={1.5}>
              <Typography variant="subtitle2" fontWeight={700}>{section.title}</Typography>
              <Stack spacing={0.5}>
                {section.items?.map((item, i) => (
                  <Stack
                    key={i}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="baseline"
                    spacing={2}
                    sx={{
                      py: 0.5,
                      borderBottom: "1px dashed",
                      borderColor: "divider",
                      "&:last-of-type": { borderBottom: "none" },
                    }}
                  >
                    {/* Label: allowed to wrap; flexes to fill available space. */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ flex: 1, minWidth: 0, wordBreak: "break-word", pr: 1 }}
                    >
                      {item.label}
                    </Typography>
                    {/* Value: right-aligned, never collides with the label,
                        does not shrink below its content width. */}
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ flexShrink: 0, textAlign: "right", whiteSpace: "nowrap" }}
                    >
                      {item.value}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          ))}

          {/* AI Summary */}
          {report.aiSummary && report.options?.includeAiSummary && (
            <>
              <Divider />
              <Stack spacing={1}>
                <Typography variant="subtitle2" fontWeight={700} color="text.disabled" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>
                  AI Summary
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {report.aiSummary}
                </Typography>
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 3, md: 5 }, pb: 4, pt: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2.5, px: 3 }}>
          Close
        </Button>
        {onDownloadExcel && (
          <Button variant="outlined" color="success" startIcon={<DownloadIcon />} onClick={onDownloadExcel} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2.5, px: 3 }}>
            Excel
          </Button>
        )}
        {onDownloadPdf && (
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={onDownloadPdf} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2.5, px: 3 }}>
            Download PDF
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
