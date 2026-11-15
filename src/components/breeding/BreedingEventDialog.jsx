/**
 * Feldrix — Breeding event dialog: Heat Detection, Pregnancy Check, Record Birth.
 *
 *   heat  → pick a female, date observed → new "Heat Detected" cycle row
 *   check → pick an open breeding (Bred/Pregnant), result → Pregnant or Failed
 *   birth → pick an open breeding, birth date + offspring → Completed
 *
 * Pregnancy check and birth also keep the female's Livestock status in step
 * (Pregnant / back to Active). See breedingService.
 */
import { useEffect, useState } from "react";
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import {
  getFemaleAnimals, recordHeat, recordPregnancyCheck, recordBirth,
} from "../../services/breedingService";
import { sireLabel } from "../../utils/breedingSire";
import { addAnimal } from "../../services/livestockService";

// Upper bound on offspring rows offered for registration in one go.
const MAX_OFFSPRING_ROWS = 20;

const todayStr = () => new Date().toISOString().slice(0, 10);

const CONFIG = {
  heat: { title: "Heat Detection", save: "Record heat" },
  check: { title: "Pregnancy Check", save: "Record check" },
  birth: { title: "Record Birth", save: "Record birth" },
};

export default function BreedingEventDialog({ type, records = [], onClose, onSaved }) {
  const cfg = CONFIG[type];
  const [females, setFemales] = useState([]);
  const [targetId, setTargetId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [result, setResult] = useState("Pregnant");
  const [method, setMethod] = useState("Scan");
  const [alive, setAlive] = useState("1");
  const [dead, setDead] = useState("0");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  // After a birth is saved: register the live offspring on Livestock.
  const [offspringFor, setOffspringFor] = useState(null); // { record, birth_date, count }
  useEffect(() => {
    if (type !== "heat") return;
    let cancelled = false;
    getFemaleAnimals()
      .then((list) => { if (!cancelled) setFemales(list); })
      .catch((e) => console.error(e));
    return () => { cancelled = true; };
  }, [type]);

  // Check: anything bred or pregnant. Birth: pregnant first, bred allowed (no check done).
  const openRecords = records.filter((r) =>
    type === "check" ? ["Bred", "Pregnant", "Confirmed"].includes(r.status)
      : ["Pregnant", "Confirmed", "Bred"].includes(r.status)
  );

  if (!cfg) return null;

  async function submit(e) {
    e.preventDefault();
    if (!targetId) return alert(type === "heat" ? "Select a female." : "Select a breeding record.");
    setSaving(true);
    try {
      if (type === "heat") {
        await recordHeat({ female_id: targetId, heat_date: date, notes: notes.trim() });
      } else {
        const record = openRecords.find((r) => String(r.id) === String(targetId));
        if (type === "check") {
          await recordPregnancyCheck(record, { check_date: date, result, method, notes });
        } else {
          const a = Number(alive);
          const d = Number(dead);
          if (!Number.isInteger(a) || a < 0 || !Number.isInteger(d) || d < 0) {
            setSaving(false);
            return alert("Offspring numbers must be whole numbers, 0 or more.");
          }
          await recordBirth(record, { birth_date: date, offspring_alive: a, offspring_dead: d, notes });
          if (a > 0) {
            setOffspringFor({ record, birth_date: date, count: Math.min(a, MAX_OFFSPRING_ROWS) });
            setSaving(false);
            return;
          }
        }
      }
      await onSaved();
    } catch (err) {
      console.error(err);
      alert(err.message);
      setSaving(false);
    }
  }

  if (offspringFor) {
    return <OffspringStep {...offspringFor} onDone={onSaved} />;
  }

  const recordLabel = (r) =>
    `${r.female?.tag || "Unknown"} \u2014 ${r.status}` +
    (r.breeding_date ? `, bred ${r.breeding_date}` : "") +
    `, sire ${sireLabel(r)}` +
    (r.expected_birth ? `, due ${r.expected_birth}` : "");

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={submit}>
        <DialogTitle>{cfg.title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {type === "heat" ? (
              <TextField select required size="small" label="Female" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                {females.length === 0 && <MenuItem value="" disabled>No female animals registered</MenuItem>}
                {females.map((a) => (
                  <MenuItem key={a.id} value={a.id}>{a.tag} | {a.breed} | {a.animal_type}</MenuItem>
                ))}
              </TextField>
            ) : openRecords.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {type === "check"
                  ? "No open breedings to check. Use Start Breeding first."
                  : "No open pregnancies. Use Start Breeding or Pregnancy Check first."}
              </Typography>
            ) : (
              <TextField select required size="small" label="Breeding" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                {openRecords.map((r) => <MenuItem key={r.id} value={r.id}>{recordLabel(r)}</MenuItem>)}
              </TextField>
            )}

            <TextField required size="small" type="date" value={date} onChange={(e) => setDate(e.target.value)}
              label={type === "heat" ? "Date observed" : type === "check" ? "Check date" : "Birth date"}
              slotProps={{ inputLabel: { shrink: true } }} />

            {type === "check" && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField select fullWidth size="small" label="Result" value={result} onChange={(e) => setResult(e.target.value)}>
                  <MenuItem value="Pregnant">Pregnant</MenuItem>
                  <MenuItem value="Not pregnant">Not pregnant</MenuItem>
                </TextField>
                <TextField select fullWidth size="small" label="Method" value={method} onChange={(e) => setMethod(e.target.value)}>
                  {["Scan", "Palpation", "Blood test", "Observation"].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
              </Stack>
            )}

            {type === "birth" && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField fullWidth size="small" type="number" label="Born alive" value={alive}
                  onChange={(e) => setAlive(e.target.value)} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
                <TextField fullWidth size="small" type="number" label="Stillborn / died" value={dead}
                  onChange={(e) => setDead(e.target.value)} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
              </Stack>
            )}

            <TextField size="small" multiline rows={2} label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />

            {type === "check" && result === "Not pregnant" && (
              <Typography variant="caption" color="text.secondary">
                The breeding will be marked Failed and the animal set back to Active.
              </Typography>
            )}
            {type === "birth" && (
              <Typography variant="caption" color="text.secondary">
                The breeding will be marked Completed and the mother set back to Active.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="success"
            disabled={saving || (type !== "heat" && openRecords.length === 0)}>
            {saving ? "Saving..." : cfg.save}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

/** Step 2 of Record Birth: register each live offspring as a Livestock animal. */
function OffspringStep({ record, birth_date, count, onDone }) {
  const [rows, setRows] = useState(() => Array.from({ length: count }, () => ({ tag: "", gender: "Female" })));
  const [saving, setSaving] = useState(false);
  const dam = record.female || {};
  const setRow = (i, key) => (e) =>
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, [key]: e.target.value } : r)));

  async function register() {
    const filled = rows.filter((r) => r.tag.trim());
    if (filled.length === 0) return alert("Enter a tag for at least one offspring, or choose Skip.");
    const tags = filled.map((r) => r.tag.trim().toLowerCase());
    if (new Set(tags).size !== tags.length) return alert("Each offspring needs a different tag.");
    setSaving(true);
    const failed = [];
    const failedRows = [];
    for (const r of filled) {
      try {
        await addAnimal({
          tag: r.tag.trim(),
          gender: r.gender,
          animal_type: dam.animal_type || "Cattle",
          breed: dam.breed || "",
          date_of_birth: birth_date,
          status: "Active",
          dam_id: record.female_id,
          breeding_record_id: record.id,
          notes: `Born ${birth_date} to ${dam.tag || "dam"}. Sire: ${sireLabel(record)}.`,
        });
      } catch (err) {
        failed.push(`${r.tag.trim()}: ${err.message}`);
        failedRows.push(r);
      }
    }
    setSaving(false);
    if (failed.length) {
      // Keep only the rows that failed so retrying can't duplicate saved ones.
      setRows(failedRows);
      alert(`Some offspring were not registered:\n${failed.join("\n")}`);
      return;
    }
    await onDone();
  }

  return (
    <Dialog open onClose={onDone} fullWidth maxWidth="sm">
      <DialogTitle>
        Register offspring
        <Typography variant="body2" color="text.secondary">
          Birth saved. Add the {count === 1 ? "newborn" : `${count} newborns`} of {dam.tag || "this dam"} to Livestock
          ({dam.animal_type || "Cattle"}{dam.breed ? `, ${dam.breed}` : ""}, born {birth_date}). Leave a tag empty to skip that one.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          {rows.map((r, i) => (
            <Stack key={i} direction="row" spacing={1.5}>
              <TextField fullWidth size="small" label={`Tag ${i + 1}`} value={r.tag} onChange={setRow(i, "tag")} />
              <TextField select size="small" label="Gender" value={r.gender} onChange={setRow(i, "gender")} sx={{ minWidth: 130 }}>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
              </TextField>
            </Stack>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onDone} disabled={saving}>Skip</Button>
        <Button variant="contained" color="success" onClick={register} disabled={saving}>
          {saving ? "Registering..." : "Register"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
