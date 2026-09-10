import { useState } from "react";
import { addWeight } from "../../services/weightService";
import { lbToKg, unitLabel, isUsCustomary } from "../../utils/units";
import useFarmContext from "../../hooks/useFarmContext";

export default function WeightEntryModal({
  animal,
  open,
  onClose,
  onSaved,
}) {
  const farmCtx = useFarmContext();
  const [weight, setWeight] = useState("");
  const [recordedAt, setRecordedAt] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!weight) {
      alert("Please enter a weight.");
      return;
    }

    try {
      setSaving(true);

      // The input is entered in the farm's display unit (lb for US farms).
      // Convert back to canonical kilograms before persisting so stored
      // values remain metric regardless of the farm's measurement system.
      const entered = Number(weight);
      const canonicalKg = isUsCustomary(farmCtx) ? lbToKg(entered) : entered;

      await addWeight({
        animal_id: animal.id,
        weight: canonicalKg,
        recorded_at: recordedAt,
        notes,
      });

      if (onSaved) {
        onSaved();
      }

      onClose();
    } catch (err) {
      console.error(err);
      alert("Unable to save weight.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#FFF",
          width: 500,
          maxWidth: "95%",
          borderRadius: 18,
          padding: 28,
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          ⚖️ Record Weight
        </h2>

        <p>
          Animal: <strong>{animal.tag}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label>Weight ({unitLabel("mass", farmCtx)})</label>

            <input
              type="number"
              value={weight}
              onChange={(e) =>
                setWeight(e.target.value)
              }
              style={input}
              required
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Date</label>

            <input
              type="date"
              value={recordedAt}
              onChange={(e) =>
                setRecordedAt(e.target.value)
              }
              style={input}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label>Notes</label>

            <textarea
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              style={{
                ...input,
                minHeight: 90,
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={cancelBtn}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={saveBtn}
            >
              {saving ? "Saving..." : "Save Weight"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const input = {
  width: "100%",
  marginTop: 6,
  padding: 12,
  border: "1px solid #CBD5E1",
  borderRadius: 10,
  fontSize: 14,
  boxSizing: "border-box",
};

const cancelBtn = {
  padding: "10px 18px",
  border: "1px solid #CBD5E1",
  borderRadius: 10,
  background: "#FFF",
  cursor: "pointer",
};

const saveBtn = {
  padding: "10px 18px",
  border: "none",
  borderRadius: 10,
  background: "#2E7D32",
  color: "#FFF",
  cursor: "pointer",
  fontWeight: 700,
};
