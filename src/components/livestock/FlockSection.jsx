/**
 * Feldrix — Poultry Flocks (bulk add by coop) + daily feed & water log.
 * One record per coop with a bird count, so 1000+ birds is a single entry.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField,
  Tooltip, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import HeartBrokenIcon from "@mui/icons-material/HeartBroken";
import { PremiumDashboardSection, PremiumActionButton } from "../../design";
import {
  getFlocks, addFlock, updateFlock, deleteFlock,
  getFlockLogs, saveFlockLog, deleteFlockLog,
  getFlockMortality, addFlockMortality, deleteFlockMortality, costPerBird,
} from "../../services/flockService";
import { formatCurrency } from "../../utils/currency";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid, Legend,
} from "recharts";
import useFarmContext from "../../hooks/useFarmContext";
import {
  isUsCustomary, kgToLb, lbToKg, litresToGallons, gallonsToLitres, unitLabel,
  formatMass, formatVolume,
} from "../../utils/units";

const POULTRY_TYPES = ["Chicken", "Duck", "Turkey", "Goose", "Quail", "Guinea Fowl", "Other"];
const DEATH_CAUSES = ["Disease", "Heat / cold", "Predator", "Accident", "Unknown", "Other"];
const PURPOSES = ["Broiler (meat)", "Layer (eggs)", "Breeder", "Mixed"];
const todayStr = () => new Date().toISOString().slice(0, 10);
const EMPTY_FLOCK = {
  coop_name: "", species: "Chicken", breed: "", purpose: "", bird_count: "",
  placed_date: "", purchase_price: "", notes: "",
};

export default function FlockSection({ onBirdsChange }) {
  const farmCtx = useFarmContext();
  const us = isUsCustomary(farmCtx);
  const [flocks, setFlocks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [flockDlg, setFlockDlg] = useState(null); // null | {flock?: existing}
  const [logFlock, setLogFlock] = useState(null);
  const [deaths, setDeaths] = useState([]);
  const [deathFlock, setDeathFlock] = useState(null);

  const load = useCallback(async () => {
    try {
      const [f, l, d] = await Promise.all([getFlocks(), getFlockLogs(), getFlockMortality()]);
      setFlocks(f);
      setLogs(l);
      setDeaths(d);
      if (onBirdsChange) onBirdsChange(f.reduce((sum, x) => sum + (x.bird_count || 0), 0));
      setError("");
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  }, [onBirdsChange]);
  useEffect(() => { load(); }, [load]);

  const today = todayStr();
  const todayByFlock = useMemo(() => {
    const m = {};
    logs.filter((l) => l.log_date === today).forEach((l) => { m[l.flock_id] = l; });
    return m;
  }, [logs, today]);

  const deathsByFlock = useMemo(() => {
    const m = {};
    deaths.forEach((d) => { m[d.flock_id] = (m[d.flock_id] || 0) + d.quantity; });
    return m;
  }, [deaths]);

  const totalBirds = flocks.reduce((s, f) => s + (f.bird_count || 0), 0);

  async function handleDelete(f) {
    if (!window.confirm(`Delete "${f.coop_name}" and all its feed/water logs?`)) return;
    try { await deleteFlock(f.id); await load(); } catch (e) { alert(e.message); }
  }

  return (
    <PremiumDashboardSection
      title="Poultry Flocks"
      description={`${flocks.length} coops, ${totalBirds.toLocaleString()} birds. Add a whole coop at once and log daily feed and water.`}
    >
      <Stack direction="row" sx={{ mb: 2 }}>
        <PremiumActionButton
          label="Add Flock"
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => setFlockDlg({})}
        />
      </Stack>
      {error && <Typography color="error" variant="body2" sx={{ mb: 1 }}>{error}</Typography>}
      {flocks.length === 0 && !error ? (
        <Typography variant="body2" color="text.secondary">No flocks yet. Add a coop with its bird count, for example 1000 chickens.</Typography>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Coop</TableCell>
                <TableCell>Species</TableCell>
                <TableCell align="right">Birds alive</TableCell>
                <TableCell align="right">Deaths</TableCell>
                <TableCell align="right">Loss value</TableCell>
                <TableCell align="right">Feed today</TableCell>
                <TableCell align="right">Water today</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {flocks.map((f) => {
                const t = todayByFlock[f.id];
                return (
                  <TableRow key={f.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{f.coop_name}</TableCell>
                    <TableCell>{f.species}{f.breed ? ` (${f.breed})` : ""}</TableCell>
                    <TableCell align="right">{(f.bird_count || 0).toLocaleString()}</TableCell>
                    <TableCell align="right">{(deathsByFlock[f.id] || 0).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      {costPerBird(f) && deathsByFlock[f.id]
                        ? formatCurrency(deathsByFlock[f.id] * costPerBird(f), farmCtx)
                        : "\u2014"}
                    </TableCell>
                    <TableCell align="right">{t ? formatMass(t.feed_kg, farmCtx) : "\u2014"}</TableCell>
                    <TableCell align="right">{t ? formatVolume(t.water_l, farmCtx) : "\u2014"}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Tooltip title="Log feed & water"><IconButton size="small" onClick={() => setLogFlock(f)}><RestaurantIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Record deaths"><IconButton size="small" onClick={() => setDeathFlock(f)}><HeartBrokenIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => setFlockDlg({ flock: f })}><EditIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(f)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}

      {flockDlg && (
        <FlockDialog
          flock={flockDlg.flock}
          onClose={() => setFlockDlg(null)}
          onSaved={async () => { setFlockDlg(null); await load(); }}
        />
      )}
      {deathFlock && (
        <DeathDialog
          flock={flocks.find((f) => f.id === deathFlock.id) || deathFlock}
          deaths={deaths.filter((d) => d.flock_id === deathFlock.id)}
          farmCtx={farmCtx}
          onClose={() => setDeathFlock(null)}
          onChanged={load}
        />
      )}
      {logFlock && (
        <LogDialog
          flock={logFlock}
          logs={logs.filter((l) => l.flock_id === logFlock.id)}
          us={us}
          farmCtx={farmCtx}
          onClose={() => setLogFlock(null)}
          onChanged={load}
        />
      )}
    </PremiumDashboardSection>
  );
}

function FlockDialog({ flock, onClose, onSaved }) {
  const [form, setForm] = useState(
    flock
      ? {
          coop_name: flock.coop_name || "", species: flock.species || "Chicken", breed: flock.breed || "",
          purpose: flock.purpose || "", bird_count: flock.bird_count ?? "",
          placed_date: flock.placed_date || "", purchase_price: flock.purchase_price ?? "", notes: flock.notes || "",
        }
      : EMPTY_FLOCK
  );
  const [saving, setSaving] = useState(false);
  const set = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    const count = Number(form.bird_count);
    if (!form.coop_name.trim()) return alert("Coop name is required.");
    if (!Number.isInteger(count) || count < 0) return alert("Number of birds must be a whole number, 0 or more.");
    setSaving(true);
    try {
      const payload = {
        coop_name: form.coop_name.trim(),
        species: form.species,
        breed: form.breed.trim() || null,
        purpose: form.purpose || null,
        bird_count: count,
        placed_date: form.placed_date || null,
        purchase_price: form.purchase_price === "" ? null : Number(form.purchase_price),
        notes: form.notes.trim() || null,
      };
      const res = flock ? await updateFlock(flock.id, payload) : await addFlock(payload);
      if (res?._financeError) alert(`Flock saved, but it was not logged in Finance: ${res._financeError}`);
      await onSaved();
    } catch (err) {
      alert(err.message);
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={submit}>
        <DialogTitle>{flock ? "Edit Flock" : "Add Flock"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField required size="small" label="Coop / House name" name="coop_name" value={form.coop_name} onChange={set} placeholder="e.g. Coop 1" />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField select fullWidth size="small" label="Species" name="species" value={form.species} onChange={set}>
                {POULTRY_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField fullWidth size="small" label="Breed" name="breed" value={form.breed} onChange={set} />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField required fullWidth size="small" type="number" label="Number of birds" name="bird_count"
                value={form.bird_count} onChange={set} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
              <TextField select fullWidth size="small" label="Purpose" name="purpose" value={form.purpose} onChange={set}>
                <MenuItem value="">Not set</MenuItem>
                {PURPOSES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </TextField>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField fullWidth size="small" type="date" label="Date placed" name="placed_date" value={form.placed_date}
                onChange={set} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField fullWidth size="small" type="number" label="Total purchase price" name="purchase_price"
                value={form.purchase_price} onChange={set} slotProps={{ htmlInput: { min: 0, step: "any" } }} />
            </Stack>
            <TextField multiline rows={2} size="small" label="Notes" name="notes" value={form.notes} onChange={set} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="success" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function LogDialog({ flock, logs, us, farmCtx, onClose, onChanged }) {
  const toFeed = (kg) => (kg == null ? "" : us ? Math.round(kgToLb(kg) * 100) / 100 : Number(kg));
  const toWater = (l) => (l == null ? "" : us ? Math.round(litresToGallons(l) * 100) / 100 : Number(l));
  const initial = logs.find((l) => l.log_date === todayStr());
  const [date, setDate] = useState(todayStr());
  const [feed, setFeed] = useState(initial ? toFeed(initial.feed_kg) : "");
  const [water, setWater] = useState(initial ? toWater(initial.water_l) : "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [saving, setSaving] = useState(false);

  // Changing the date loads that day's existing log (if any) into the form.
  function changeDate(d) {
    setDate(d);
    const existing = logs.find((l) => l.log_date === d);
    setFeed(existing ? toFeed(existing.feed_kg) : "");
    setWater(existing ? toWater(existing.water_l) : "");
    setNotes(existing?.notes || "");
  }

  async function submit(e) {
    e.preventDefault();
    if (feed === "" && water === "") return alert("Enter feed, water, or both.");
    if ((feed !== "" && Number(feed) < 0) || (water !== "" && Number(water) < 0)) return alert("Amounts cannot be negative.");
    setSaving(true);
    try {
      await saveFlockLog({
        flock_id: flock.id,
        log_date: date,
        feed_kg: feed === "" ? null : us ? lbToKg(Number(feed)) : Number(feed),
        water_l: water === "" ? null : us ? gallonsToLitres(Number(water)) : Number(water),
        notes: notes.trim() || null,
      });
      await onChanged();
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  }

  async function remove(id) {
    if (!window.confirm("Delete this log entry?")) return;
    try { await deleteFlockLog(id); await onChanged(); } catch (err) { alert(err.message); }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Feed &amp; Water: {flock.coop_name}</DialogTitle>
      <DialogContent>
        <form onSubmit={submit}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField size="small" type="date" label="Date" value={date} onChange={(e) => changeDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }} required />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField fullWidth size="small" type="number" label={`Feed (${unitLabel("mass", farmCtx)})`} value={feed}
                onChange={(e) => setFeed(e.target.value)} slotProps={{ htmlInput: { min: 0, step: "any" } }} />
              <TextField fullWidth size="small" type="number" label={`Water (${unitLabel("volume", farmCtx)})`} value={water}
                onChange={(e) => setWater(e.target.value)} slotProps={{ htmlInput: { min: 0, step: "any" } }} />
            </Stack>
            <TextField size="small" label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button type="submit" variant="contained" color="success" disabled={saving}>
              {saving ? "Saving..." : "Save log"}
            </Button>
          </Stack>
        </form>
        <FeedHistory flock={flock} logs={logs} us={us} farmCtx={farmCtx} />
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Recent logs</Typography>
        {logs.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No logs yet.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Feed</TableCell>
                <TableCell align="right">Water</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.slice(0, 14).map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.log_date}</TableCell>
                  <TableCell align="right">{formatMass(l.feed_kg, farmCtx)}</TableCell>
                  <TableCell align="right">{formatVolume(l.water_l, farmCtx)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => remove(l.id)}><DeleteIcon fontSize="small" /></IconButton>
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

function DeathDialog({ flock, deaths, farmCtx, onClose, onChanged }) {
  const perBird = costPerBird(flock);
  const totalDead = deaths.reduce((sum, d) => sum + d.quantity, 0);
  const [date, setDate] = useState(todayStr());
  const [qty, setQty] = useState("");
  const [cause, setCause] = useState("Unknown");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const n = Number(qty);
    if (!Number.isInteger(n) || n < 1) return alert("Enter a whole number of birds, 1 or more.");
    if (n > flock.bird_count) return alert(`Only ${flock.bird_count} birds are left in this coop.`);
    setSaving(true);
    try {
      await addFlockMortality({ flock_id: flock.id, log_date: date, quantity: n, cause, notes: notes.trim() || null });
      setQty("");
      setNotes("");
      await onChanged();
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  }

  async function remove(d) {
    if (!window.confirm(`Delete this entry? ${d.quantity} birds will be added back to the coop.`)) return;
    try { await deleteFlockMortality(d.id); await onChanged(); } catch (err) { alert(err.message); }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Record deaths: {flock.coop_name}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {flock.bird_count.toLocaleString()} birds alive. Saving subtracts the deaths from this count.
        </Typography>
        {perBird && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Cost per bird {formatCurrency(perBird, farmCtx)}. Value lost so far: {formatCurrency(totalDead * perBird, farmCtx)} ({totalDead.toLocaleString()} birds).
            This is part of the flock purchase already in Finance, so it is not added as a new expense.
          </Typography>
        )}
        <form onSubmit={submit}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField required fullWidth size="small" type="date" label="Date" value={date}
                onChange={(e) => setDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField required fullWidth size="small" type="number" label="Birds that died" value={qty}
                onChange={(e) => setQty(e.target.value)} slotProps={{ htmlInput: { min: 1, step: 1 } }} />
            </Stack>
            <TextField select size="small" label="Cause" value={cause} onChange={(e) => setCause(e.target.value)}>
              {DEATH_CAUSES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
            <TextField size="small" label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <Button type="submit" variant="contained" color="success" disabled={saving}>
              {saving ? "Saving..." : "Record deaths"}
            </Button>
          </Stack>
        </form>
        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Recent deaths</Typography>
        {deaths.length === 0 ? (
          <Typography variant="body2" color="text.secondary">None recorded.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Birds</TableCell>
                <TableCell>Cause</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {deaths.slice(0, 14).map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.log_date}</TableCell>
                  <TableCell align="right">{d.quantity.toLocaleString()}</TableCell>
                  <TableCell>{d.cause || "\u2014"}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => remove(d)}><DeleteIcon fontSize="small" /></IconButton>
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

/** Last 14 days of feed/water for one coop: totals, feed per bird, and a bar chart. */
function FeedHistory({ flock, logs, us, farmCtx }) {
  const days = [];
  const byDate = Object.fromEntries(logs.map((l) => [l.log_date, l]));
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const l = byDate[key];
    days.push({
      date: key.slice(5),
      feed: l?.feed_kg != null ? Math.round((us ? kgToLb(l.feed_kg) : Number(l.feed_kg)) * 10) / 10 : 0,
      water: l?.water_l != null ? Math.round((us ? litresToGallons(l.water_l) : Number(l.water_l)) * 10) / 10 : 0,
      logged: !!l,
    });
  }
  const last7 = logs.filter((l) => {
    const diff = (new Date(todayStr()) - new Date(l.log_date)) / 86400000;
    return diff >= 0 && diff < 7;
  });
  const feed7 = last7.reduce((s, l) => s + (Number(l.feed_kg) || 0), 0);
  const water7 = last7.reduce((s, l) => s + (Number(l.water_l) || 0), 0);
  const feedDays = last7.filter((l) => l.feed_kg != null).length;
  // Average feed per bird per day over logged days, in g (metric) or oz (US).
  const perBirdKg = feedDays > 0 && flock.bird_count > 0 ? feed7 / feedDays / flock.bird_count : null;
  const perBird = perBirdKg == null ? null : us ? perBirdKg * 35.274 : perBirdKg * 1000;
  const massUnit = unitLabel("mass", farmCtx);
  const volUnit = unitLabel("volume", farmCtx);

  if (logs.length === 0) return null;
  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Last 14 days</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mb: 1 }}>
        <Typography variant="body2">Feed (7 days): <b>{formatMass(feed7, farmCtx)}</b></Typography>
        <Typography variant="body2">Water (7 days): <b>{formatVolume(water7, farmCtx)}</b></Typography>
        <Typography variant="body2">
          Feed per bird per day: <b>{perBird == null ? "\u2014" : `${perBird.toFixed(1)} ${us ? "oz" : "g"}`}</b>
        </Typography>
      </Stack>
      <Box sx={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={days} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="feed" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="water" orientation="right" tick={{ fontSize: 11 }} />
            <RTooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar yAxisId="feed" dataKey="feed" name={`Feed (${massUnit})`} fill="#2E7D32" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="water" dataKey="water" name={`Water (${volUnit})`} fill="#1565C0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {days.filter((d) => !d.logged).length} of the last 14 days have no log.
      </Typography>
    </Box>
  );
}
