/**
 * Feldrix — Edit / undo the events on one breeding record
 * (heat detection, pregnancy check, birth). Opened from Breeding Records.
 */
import { useState } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, MenuItem, Stack, TextField, Typography,
} from "@mui/material";
import { updateBreedingEvent, undoBreedingEvent } from "../../services/breedingService";
import { breedingEvents } from "../../utils/breedingEvents";

const UNDO_TEXT = {
  heat: "Remove the heat detection?",
  check: "Remove this pregnancy check? The breeding goes back to Bred.",
  birth: "Remove this birth? The breeding goes back to Pregnant and the mother is set to Pregnant again.",
};

export default function BreedingEventsEditor({ record, onClose, onChanged }) {
  const [editing, setEditing] = useState(null); // "heat" | "check" | "birth"
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);

  const events = breedingEvents(record).filter((e) => e.type !== "bred");
  const heatOnly = !record.breeding_date;

  function startEdit(type) {
    setEditing(type);
    setFields(
      type === "heat" ? { heat_date: record.heat_date || "" }
        : type === "check" ? {
            pregnancy_check_date: record.pregnancy_check_date || "",
            pregnancy_check_result: record.pregnancy_check_result || "Pregnant",
            pregnancy_check_method: record.pregnancy_check_method || "Scan",
          }
        : {
            birth_date: record.birth_date || "",
            offspring_alive: record.offspring_alive ?? 0,
            offspring_dead: record.offspring_dead ?? 0,
          }
    );
  }
  const set = (name) => (e) => setFields((p) => ({ ...p, [name]: e.target.value }));

  async function save() {
    const dateKey = { heat: "heat_date", check: "pregnancy_check_date", birth: "birth_date" }[editing];
    if (!fields[dateKey]) return alert("Date is required.");
    const payload = { ...fields };
    if (editing === "birth") {
      const a = Number(payload.offspring_alive);
      const d = Number(payload.offspring_dead);
      if (!Number.isInteger(a) || a < 0 || !Number.isInteger(d) || d < 0) {
        return alert("Offspring numbers must be whole numbers, 0 or more.");
      }
      payload.offspring_alive = a;
      payload.offspring_dead = d;
    }
    setBusy(true);
    try {
      await updateBreedingEvent(record, editing, payload);
      await onChanged();
      setEditing(null);
    } catch (err) {
      alert(err.message);
    }
    setBusy(false);
  }

  async function undo(type) {
    const msg = type === "heat" && heatOnly
      ? "This record only has a heat detection. Delete the whole record?"
      : UNDO_TEXT[type];
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      await undoBreedingEvent(record, type);
      setEditing(null);
      await onChanged();
    } catch (err) {
      alert(err.message);
    }
    setBusy(false);
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Edit events: {record.female?.tag || "Unknown"}
        <Typography variant="body2" color="text.secondary">
          Status: {record.status}. To change the breeding date, sire or method, use Edit on the record.
        </Typography>
      </DialogTitle>
      <DialogContent>
        {events.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No heat, pregnancy check or birth recorded on this breeding yet.
          </Typography>
        ) : (
          <Stack divider={<Divider flexItem />} spacing={1.5}>
            {events.map((ev) => (
              <Box key={ev.type}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{ev.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{ev.date}</Typography>
                  </Box>
                  <Button size="small" disabled={busy} onClick={() => startEdit(ev.type)}>Edit</Button>
                  <Button size="small" color="error" disabled={busy || (ev.type === "check" && !!record.birth_date)}
                    onClick={() => undo(ev.type)}>
                    Undo
                  </Button>
                </Stack>
                {ev.type === "check" && record.birth_date && (
                  <Typography variant="caption" color="text.secondary">Undo the birth first to remove the check.</Typography>
                )}

                {editing === ev.type && (
                  <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                    {editing === "heat" && (
                      <TextField size="small" type="date" label="Date observed" value={fields.heat_date}
                        onChange={set("heat_date")} slotProps={{ inputLabel: { shrink: true } }} />
                    )}
                    {editing === "check" && (
                      <>
                        <TextField size="small" type="date" label="Check date" value={fields.pregnancy_check_date}
                          onChange={set("pregnancy_check_date")} slotProps={{ inputLabel: { shrink: true } }} />
                        <Stack direction="row" spacing={1.5}>
                          <TextField select fullWidth size="small" label="Result" value={fields.pregnancy_check_result}
                            onChange={set("pregnancy_check_result")}>
                            <MenuItem value="Pregnant">Pregnant</MenuItem>
                            <MenuItem value="Not pregnant">Not pregnant</MenuItem>
                          </TextField>
                          <TextField select fullWidth size="small" label="Method" value={fields.pregnancy_check_method}
                            onChange={set("pregnancy_check_method")}>
                            {["Scan", "Palpation", "Blood test", "Observation"].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                          </TextField>
                        </Stack>
                      </>
                    )}
                    {editing === "birth" && (
                      <>
                        <TextField size="small" type="date" label="Birth date" value={fields.birth_date}
                          onChange={set("birth_date")} slotProps={{ inputLabel: { shrink: true } }} />
                        <Stack direction="row" spacing={1.5}>
                          <TextField fullWidth size="small" type="number" label="Born alive" value={fields.offspring_alive}
                            onChange={set("offspring_alive")} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
                          <TextField fullWidth size="small" type="number" label="Stillborn / died" value={fields.offspring_dead}
                            onChange={set("offspring_dead")} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
                        </Stack>
                      </>
                    )}
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button size="small" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
                      <Button size="small" variant="contained" color="success" onClick={save} disabled={busy}>
                        {busy ? "Saving..." : "Save"}
                      </Button>
                    </Stack>
                  </Stack>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
    </Dialog>
  );
}
