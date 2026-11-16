/**
 * Feldrix — Broiler live cycle UI.
 *   BroilerCycleCard  live view of one batch (age, progress, mortality, feed, weight, FCR)
 *   WeighDialog       record a sample weighing
 *   CloseCycleDialog  end the cycle (sale/slaughter) → Finance income
 *   PastCycles        closed batches with results, and "Start next cycle"
 * Numbers come from utils/broilerCycle.js (canonical kg; converted for display).
 */
import { useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, LinearProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Tooltip, Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { cycleStats } from "../../utils/broilerCycle";
import { addFlockWeighing, deleteFlockWeighing, closeFlockCycle } from "../../services/flockService";
import { formatCurrency } from "../../utils/currency";
import { isUsCustomary, kgToLb, lbToKg, unitLabel, formatMass } from "../../utils/units";

const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtPct = (v) => (v == null ? "\u2014" : `${v.toFixed(1)}%`);
const fmtFcr = (v) => (v == null ? "\u2014" : v.toFixed(2));
/** Average bird weight: g or kg (metric), lb (US). */
function fmtBirdWeight(kg, farmCtx) {
  if (kg == null) return "\u2014";
  if (isUsCustomary(farmCtx)) return `${kgToLb(kg).toFixed(2)} lb`;
  return kg < 1 ? `${Math.round(kg * 1000)} g` : `${kg.toFixed(2)} kg`;
}

function Metric({ label, value, sub }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body1" fontWeight={700}>{value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </Box>
  );
}

export function BroilerCycleCard({ flock, logs, deaths, weighings, farmCtx, onWeigh, onClose }) {
  const s = cycleStats(flock, { logs, deaths, weighings });
  const overdue = s.daysLeft != null && s.daysLeft < 0;
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>{flock.coop_name}</Typography>
            <Typography variant="caption" color="text.secondary">
              Cycle {flock.cycle_number || 1} · {flock.breed || flock.species} · placed {flock.placed_date || "\u2014"}
            </Typography>
          </Box>
          <Chip size="small" color={overdue ? "warning" : "success"}
            label={s.age == null ? "No placement date" : s.target ? `Day ${s.age} of ${s.target}` : `Day ${s.age}`} />
        </Stack>

        {s.progress != null && (
          <Box sx={{ mb: 1.5 }}>
            <LinearProgress variant="determinate" value={s.progress} color={overdue ? "warning" : "success"}
              sx={{ height: 8, borderRadius: 4 }} />
            <Typography variant="caption" color="text.secondary">
              {overdue
                ? `${-s.daysLeft} day${s.daysLeft === -1 ? "" : "s"} past target (${s.endDate})`
                : `${s.daysLeft} day${s.daysLeft === 1 ? "" : "s"} to target (${s.endDate})`}
            </Typography>
          </Box>
        )}
        {s.target == null && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Set a target slaughter age (Edit) to see progress.
          </Typography>
        )}

        <Grid container spacing={1.5}>
          <Grid size={6}><Metric label="Birds alive" value={s.alive.toLocaleString()} sub={`of ${s.placed.toLocaleString()} placed`} /></Grid>
          <Grid size={6}><Metric label="Mortality" value={fmtPct(s.mortalityPct)} sub={`${s.dead.toLocaleString()} died, ${s.deathsToday} today`} /></Grid>
          <Grid size={6}><Metric label="Feed so far" value={formatMass(s.feedKg, farmCtx)} sub={`${fmtBirdWeight(s.feedPerBirdKg, farmCtx)} per bird placed`} /></Grid>
          <Grid size={6}>
            <Metric label="Avg weight" value={fmtBirdWeight(s.avgWeightKg, farmCtx)}
              sub={s.latestWeighDate
                ? `weighed ${s.latestWeighDate}${s.targetWeightKg ? `, target ${fmtBirdWeight(s.targetWeightKg, farmCtx)}` : ""}`
                : "no weighing yet"} />
          </Grid>
          <Grid size={6}><Metric label="FCR (feed ÷ live weight)" value={fmtFcr(s.fcr)} sub={s.fcr == null ? "needs feed + a weighing" : "lower is better"} /></Grid>
        </Grid>

        <Stack spacing={0.75} sx={{ mt: 1.5 }}>
          {!s.loggedToday && <Alert severity="warning" sx={{ py: 0 }}>No feed/water log today.</Alert>}
          {s.mortalitySpike && (
            <Alert severity="error" sx={{ py: 0 }}>{s.deathsToday} deaths today, well above this cycle's daily average.</Alert>
          )}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button size="small" variant="outlined" onClick={onWeigh}>Record weighing</Button>
          <Button size="small" variant="outlined" color="secondary" onClick={onClose}>End cycle</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function WeighDialog({ flock, weighings, farmCtx, onClose, onChanged }) {
  const us = isUsCustomary(farmCtx);
  const [date, setDate] = useState(todayStr());
  const [birds, setBirds] = useState("");
  const [total, setTotal] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const n = Number(birds);
    const w = Number(total);
    if (!Number.isInteger(n) || n < 1) return alert("Birds weighed must be a whole number, 1 or more.");
    if (!(w > 0)) return alert("Enter the total weight of the weighed birds.");
    setSaving(true);
    try {
      await addFlockWeighing({ flock_id: flock.id, weigh_date: date, birds_weighed: n, total_weight_kg: us ? lbToKg(w) : w });
      setBirds("");
      setTotal("");
      await onChanged();
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  }

  async function remove(id) {
    if (!window.confirm("Delete this weighing?")) return;
    try { await deleteFlockWeighing(id); await onChanged(); } catch (err) { alert(err.message); }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Record weighing: {flock.coop_name}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Weigh a sample of birds together and enter how many and their total weight. The average is used for FCR.
        </Typography>
        <form onSubmit={submit}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField required size="small" type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField required fullWidth size="small" type="number" label="Birds weighed" value={birds}
                onChange={(e) => setBirds(e.target.value)} slotProps={{ htmlInput: { min: 1, step: 1 } }} />
              <TextField required fullWidth size="small" type="number" label={`Total weight (${unitLabel("mass", farmCtx)})`}
                value={total} onChange={(e) => setTotal(e.target.value)} slotProps={{ htmlInput: { min: 0, step: "any" } }} />
            </Stack>
            {Number(birds) > 0 && Number(total) > 0 && (
              <Typography variant="body2">
                Average: <b>{fmtBirdWeight((us ? lbToKg(Number(total)) : Number(total)) / Number(birds), farmCtx)}</b> per bird
              </Typography>
            )}
            <Button type="submit" variant="contained" color="success" disabled={saving}>{saving ? "Saving..." : "Save weighing"}</Button>
          </Stack>
        </form>
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Weighings this cycle</Typography>
        {weighings.length === 0 ? (
          <Typography variant="body2" color="text.secondary">None yet.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Birds</TableCell>
                <TableCell align="right">Average</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {weighings.map((w) => (
                <TableRow key={w.id}>
                  <TableCell>{w.weigh_date}</TableCell>
                  <TableCell align="right">{w.birds_weighed}</TableCell>
                  <TableCell align="right">{fmtBirdWeight(Number(w.total_weight_kg) / w.birds_weighed, farmCtx)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => remove(w.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}

export function CloseCycleDialog({ flock, farmCtx, onClose, onClosed }) {
  const us = isUsCustomary(farmCtx);
  const [date, setDate] = useState(todayStr());
  const [sold, setSold] = useState(String(flock.bird_count || 0));
  const [weight, setWeight] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const n = Number(sold);
    if (!Number.isInteger(n) || n < 0) return alert("Birds sold must be a whole number, 0 or more.");
    if (n > flock.bird_count) return alert(`Only ${flock.bird_count} birds are in this batch.`);
    if (weight !== "" && !(Number(weight) >= 0)) return alert("Total weight cannot be negative.");
    if (amount !== "" && !(Number(amount) >= 0)) return alert("Sale amount cannot be negative.");
    const left = flock.bird_count - n;
    if (left > 0 && !window.confirm(`${left} bird${left === 1 ? "" : "s"} are not sold and not recorded as dead. Close the cycle anyway?`)) return;
    setSaving(true);
    try {
      const res = await closeFlockCycle(flock, {
        closed_date: date,
        birds_sold: n,
        total_weight_sold_kg: weight === "" ? null : us ? lbToKg(Number(weight)) : Number(weight),
        sale_amount: amount === "" ? null : Number(amount),
      });
      if (res?._financeError) alert(`Cycle closed, but the sale was not logged in Finance: ${res._financeError}`);
      await onClosed();
    } catch (err) {
      alert(err.message);
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={submit}>
        <DialogTitle>End cycle: {flock.coop_name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Record the slaughter or sale. The batch moves to past cycles, the coop shows 0 birds, and the sale amount is added to Finance as income.
          </Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField required size="small" type="date" label="Slaughter / sale date" value={date}
              onChange={(e) => setDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField required fullWidth size="small" type="number" label="Birds sold" value={sold}
                onChange={(e) => setSold(e.target.value)} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
              <TextField fullWidth size="small" type="number" label={`Total live weight sold (${unitLabel("mass", farmCtx)})`}
                value={weight} onChange={(e) => setWeight(e.target.value)} slotProps={{ htmlInput: { min: 0, step: "any" } }} />
            </Stack>
            <TextField size="small" type="number" label="Sale amount (total)" value={amount}
              onChange={(e) => setAmount(e.target.value)} slotProps={{ htmlInput: { min: 0, step: "any" } }}
              helperText={amount ? `Income to Finance: ${formatCurrency(Number(amount), farmCtx)}` : "Leave empty if there is no sale income."} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="success" disabled={saving}>{saving ? "Closing..." : "End cycle"}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export function PastCycles({ flocks, logsFor, deathsFor, weighingsFor, farmCtx, onStartNext, onDelete }) {
  if (flocks.length === 0) return null;
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Past cycles</Typography>
      <Box sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Coop</TableCell>
              <TableCell>Cycle</TableCell>
              <TableCell>Placed → closed</TableCell>
              <TableCell align="right">Days</TableCell>
              <TableCell align="right">Placed</TableCell>
              <TableCell align="right">Mortality</TableCell>
              <TableCell align="right">Sold</TableCell>
              <TableCell align="right">Avg sold weight</TableCell>
              <TableCell align="right">FCR</TableCell>
              <TableCell align="right">Sale</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flocks.map((f) => {
              const s = cycleStats(f, { logs: logsFor(f.id), deaths: deathsFor(f.id), weighings: weighingsFor(f.id) });
              return (
                <TableRow key={f.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{f.coop_name}</TableCell>
                  <TableCell>{f.cycle_number || 1}</TableCell>
                  <TableCell>{f.placed_date || "\u2014"} → {f.closed_date || "\u2014"}</TableCell>
                  <TableCell align="right">{s.age ?? "\u2014"}</TableCell>
                  <TableCell align="right">{s.placed.toLocaleString()}</TableCell>
                  <TableCell align="right">{fmtPct(s.mortalityPct)}</TableCell>
                  <TableCell align="right">
                    {s.birdsSold.toLocaleString()}
                    {s.unaccounted > 0 && (
                      <Tooltip title="Placed minus deaths minus sold">
                        <Typography component="span" variant="caption" color="warning.main"> ({s.unaccounted} unaccounted)</Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="right">{fmtBirdWeight(s.avgSoldWeightKg, farmCtx)}</TableCell>
                  <TableCell align="right">{fmtFcr(s.fcr)}</TableCell>
                  <TableCell align="right">{f.sale_amount != null ? formatCurrency(Number(f.sale_amount), farmCtx) : "\u2014"}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Button size="small" onClick={() => onStartNext(f)}>Start next cycle</Button>
                    <Tooltip title="Delete this cycle and its records">
                      <IconButton size="small" color="error" onClick={() => onDelete(f)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}
