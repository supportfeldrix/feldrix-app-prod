/**
 * Feldrix — Daily egg count dialog for a layer flock.
 * Enter today's (or any day's) good and damaged eggs; re-saving a day updates it.
 * Shows today / 7 days / this month / all-time totals, lay % and a 14-day chart.
 */
import { useState } from "react";
import {
  Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton,
  Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import { isUsCustomary, kgToLb } from "../../utils/units";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid, Legend,
} from "recharts";
import { saveEggLog, deleteEggLog } from "../../services/flockService";
import { eggStats, eggSeries, trays, EGGS_PER_TRAY } from "../../utils/eggProduction";

const todayStr = () => new Date().toISOString().slice(0, 10);
const n = (v) => (v == null ? "\u2014" : Number(v).toLocaleString());
const pct = (v) => (v == null ? "\u2014" : `${v.toFixed(1)}%`);

function Total({ label, eggs, sub }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{n(eggs)}</Typography>
      <Typography variant="caption" color="text.secondary">
        {sub ?? (eggs ? `${trays(eggs).toLocaleString()} trays of ${EGGS_PER_TRAY}` : "\u00A0")}
      </Typography>
    </Box>
  );
}

/** Feed per dozen eggs: g / kg (metric), lb (US). */
function fmtFeedPerDozen(kg, farmCtx) {
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

/** Live card for a layer flock, shown next to the broiler cycle cards. */
export function LayerCard({ flock, eggLogs, feedLogs, deaths, farmCtx, onCountEggs, onLogFeed }) {
  const s = eggStats(flock, eggLogs, feedLogs);
  const today = todayStr();
  const fedToday = feedLogs.some((l) => l.log_date === today);
  const dead = deaths.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
  const placed = Number(flock.initial_count ?? flock.bird_count) || 0;
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>{flock.coop_name}</Typography>
            <Typography variant="caption" color="text.secondary">
              Layers · {flock.breed || flock.species}{flock.placed_date ? ` · placed ${flock.placed_date}` : ""}
            </Typography>
          </Box>
          <Chip size="small" color={s.loggedToday ? "warning" : "default"}
            label={s.loggedToday ? `${n(s.today)} eggs today` : "Not counted today"} />
        </Stack>

        <Grid container spacing={1.5}>
          <Grid size={6}>
            <Metric label="Eggs today" value={n(s.today)}
              sub={s.today ? `${trays(s.today).toLocaleString()} trays, ${n(s.todayDamaged)} damaged` : "no count yet"} />
          </Grid>
          <Grid size={6}>
            <Metric label="Lay % today" value={pct(s.layPctToday)}
              sub={s.layPctPrior != null ? `prior 6-day avg ${pct(s.layPctPrior)}` : "needs a few days of counts"} />
          </Grid>
          <Grid size={6}>
            <Metric label="Last 7 days" value={n(s.week)}
              sub={`${trays(s.week).toLocaleString()} trays · lay ${pct(s.layPct7)}`} />
          </Grid>
          <Grid size={6}>
            <Metric label="This month" value={n(s.month)} sub={`${trays(s.month).toLocaleString()} trays`} />
          </Grid>
          <Grid size={6}>
            <Metric label="Birds alive" value={n(flock.bird_count)}
              sub={`${n(dead)} died${placed > 0 ? ` (${((dead / placed) * 100).toFixed(1)}%)` : ""}`} />
          </Grid>
          <Grid size={6}>
            <Metric label="Feed per dozen (7 days)" value={fmtFeedPerDozen(s.feedPerDozenKg, farmCtx)}
              sub={s.feedPerDozenKg == null ? "needs feed + egg counts" : `damaged ${pct(s.damagedPct7)}`} />
          </Grid>
        </Grid>

        <Stack spacing={0.75} sx={{ mt: 1.5 }}>
          {!s.loggedToday && <Alert severity="warning" sx={{ py: 0 }}>No egg count today.</Alert>}
          {!fedToday && <Alert severity="warning" sx={{ py: 0 }}>No feed/water log today.</Alert>}
          {s.layDrop && (
            <Alert severity="error" sx={{ py: 0 }}>
              Lay % today is well below the recent average ({pct(s.layPctToday)} vs {pct(s.layPctPrior)}).
            </Alert>
          )}
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button size="small" variant="outlined" onClick={onCountEggs}>Count eggs</Button>
          <Button size="small" variant="outlined" color="secondary" onClick={onLogFeed}>Log feed & water</Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function EggDialog({ flock, eggLogs, onClose, onChanged }) {
  const find = (d) => eggLogs.find((l) => l.log_date === d);
  const initial = find(todayStr());
  const [date, setDate] = useState(todayStr());
  const [good, setGood] = useState(initial ? String(initial.eggs_collected) : "");
  const [damaged, setDamaged] = useState(initial ? String(initial.eggs_damaged || 0) : "0");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [saving, setSaving] = useState(false);

  // Picking a date loads that day's saved count, if any.
  function changeDate(d) {
    setDate(d);
    const l = find(d);
    setGood(l ? String(l.eggs_collected) : "");
    setDamaged(l ? String(l.eggs_damaged || 0) : "0");
    setNotes(l?.notes || "");
  }

  async function submit(e) {
    e.preventDefault();
    const g = Number(good);
    const dmg = damaged === "" ? 0 : Number(damaged);
    if (!Number.isInteger(g) || g < 0) return alert("Good eggs must be a whole number, 0 or more.");
    if (!Number.isInteger(dmg) || dmg < 0) return alert("Damaged eggs must be a whole number, 0 or more.");
    const birds = Number(flock.bird_count) || 0;
    if (birds > 0 && g + dmg > birds
      && !window.confirm(`${(g + dmg).toLocaleString()} eggs is more than the ${birds.toLocaleString()} birds in this coop. Save anyway?`)) return;
    setSaving(true);
    try {
      await saveEggLog({ flock_id: flock.id, log_date: date, eggs_collected: g, eggs_damaged: dmg, notes: notes.trim() || null });
      await onChanged();
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  }

  async function remove(id) {
    if (!window.confirm("Delete this egg count?")) return;
    try { await deleteEggLog(id); await onChanged(); } catch (err) { alert(err.message); }
  }

  const s = eggStats(flock, eggLogs);
  const series = eggSeries(eggLogs, 14);
  const editingExisting = !!find(date);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Eggs: {flock.coop_name}
        <Typography variant="body2" color="text.secondary">{n(flock.bird_count)} birds in this coop</Typography>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 6, sm: 3 }}><Total label="Today" eggs={s.today} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><Total label="Last 7 days" eggs={s.week} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><Total label="This month" eggs={s.month} /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}><Total label="All time" eggs={s.total} /></Grid>
        </Grid>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mb: 2 }}>
          <Typography variant="body2">Lay % today: <b>{pct(s.layPctToday)}</b></Typography>
          <Typography variant="body2">
            Lay % (7-day avg): <b>{pct(s.layPct7)}</b>
            {s.daysLogged7 > 0 && s.daysLogged7 < 7 && <Typography component="span" variant="caption" color="text.secondary"> over {s.daysLogged7} logged days</Typography>}
          </Typography>
          <Typography variant="body2">Damaged (7 days): <b>{pct(s.damagedPct7)}</b></Typography>
        </Stack>

        <form onSubmit={submit}>
          <Stack spacing={2}>
            <TextField required size="small" type="date" label="Date" value={date}
              onChange={(e) => changeDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }}
              helperText={editingExisting ? "This day already has a count. Saving replaces it." : " "} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField required fullWidth size="small" type="number" label="Good eggs collected" value={good}
                onChange={(e) => setGood(e.target.value)} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
              <TextField fullWidth size="small" type="number" label="Cracked / damaged" value={damaged}
                onChange={(e) => setDamaged(e.target.value)} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
            </Stack>
            <TextField size="small" label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button type="submit" variant="contained" color="success" disabled={saving}>
              {saving ? "Saving..." : editingExisting ? "Update count" : "Save count"}
            </Button>
          </Stack>
        </form>

        {eggLogs.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Last 14 days</Typography>
            <Box sx={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={series} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <RTooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="good" stackId="eggs" name="Good" fill="#F59E0B" />
                  <Bar dataKey="damaged" stackId="eggs" name="Damaged" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {series.filter((d) => !d.logged).length} of the last 14 days have no count.
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Recent counts</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Good</TableCell>
                  <TableCell align="right">Damaged</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {eggLogs.slice(0, 14).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.log_date}</TableCell>
                    <TableCell align="right">{n(l.eggs_collected)}</TableCell>
                    <TableCell align="right">{n(l.eggs_damaged)}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="error" onClick={() => remove(l.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
          Lay % = eggs laid (good + damaged) ÷ birds alive now.
        </Typography>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}
