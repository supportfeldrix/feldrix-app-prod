import { useEffect, useState } from "react";
import {
  addBreedingRecord,
  updateBreedingRecord,
  getFemaleAnimals,
  getMaleAnimals,
  getOpenHeatRecord,
  markFemalePregnant,
} from "../../services/breedingService";

const emptyForm = {
  female_id: "",
  male_id: "",
  sire_details: "",
  breeding_date: "",
  breeding_method: "Natural",
  expected_birth: "",
  status: "Bred",
  technician: "",
  notes: "",
};

const GESTATION_DAYS = {
  Cattle: 283,
  Sheep: 147,
  Goat: 150,
  Goats: 150,
  Pig: 114,
  Pigs: 114,
};

export default function BreedingForm({
  record,
  refreshRecords,
  onSaved,
  animalId = null,
  defaultStatus = "Bred",
}) {
  const [femaleAnimals, setFemaleAnimals] = useState([]);
  const [maleAnimals, setMaleAnimals] = useState([]);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    async function loadAnimals() {
      try {
        const females = await getFemaleAnimals();
        const males = await getMaleAnimals();

        setFemaleAnimals(females);
        setMaleAnimals(males);

        if (animalId && !record) {
          setForm((prev) => ({
            ...prev,
            female_id: animalId,
          }));
        }
      } catch (e) {
        console.error(e);
      }
    }

    loadAnimals();
  }, [animalId, record]);

  useEffect(() => {
    if (record) {
      setForm({
        female_id: record.female_id || "",
        male_id: record.male_id || "",
        sire_details: record.sire_details || "",
        breeding_date: record.breeding_date || "",
        breeding_method:
          record.breeding_method || "Natural",
        expected_birth:
          record.expected_birth || "",
        status: record.status || "Bred",
        technician: record.technician || "",
        notes: record.notes || "",
      });
    } else {
      setForm({
        ...emptyForm,
        status: defaultStatus,
        female_id: animalId || "",
      });
    }
  }, [record, animalId, defaultStatus]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    const updatedForm = {
      ...form,
      [name]: value,
    };

    if (
      name === "female_id" ||
      name === "breeding_date"
    ) {
      const female = femaleAnimals.find(
        (a) =>
          String(a.id) ===
          String(
            name === "female_id"
              ? value
              : updatedForm.female_id
          )
      );

      if (
        female &&
        updatedForm.breeding_date
      ) {
        const days =
          GESTATION_DAYS[female.animal_type];

        if (days) {
          const birth = new Date(
            updatedForm.breeding_date
          );

          birth.setDate(
            birth.getDate() + days
          );

          updatedForm.expected_birth =
            birth
              .toISOString()
              .split("T")[0];
        }
      }
    }

    setForm(updatedForm);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    // Sire is optional (AI / outside bull / unknown). Empty strings must be
    // sent as NULL: male_id is a uuid and expected_birth is a date column.
    const payload = {
      ...form,
      male_id: form.male_id || null,
      sire_details: form.sire_details.trim() || null,
      expected_birth: form.expected_birth || null,
      breeding_date: form.breeding_date || null,
    };
    try {
      if (record) {
        await updateBreedingRecord(
          record.id,
          payload
        );
      } else {
        // Continue an open heat-detection cycle for this female instead of
        // creating a second row (keeps heat_date with the breeding).
        const heat = await getOpenHeatRecord(payload.female_id);
        if (heat) await updateBreedingRecord(heat.id, payload);
        else await addBreedingRecord(payload);
      }
      // Keep the Livestock status in step (only Active/Sick animals change).
      if (payload.status === "Pregnant") await markFemalePregnant(payload.female_id);

      await refreshRecords();

      setForm({
        ...emptyForm,
        status: defaultStatus,
        female_id: animalId || "",
      });
      onSaved?.();
    } catch (err) {
      alert(err.message);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #D0D7DE",
    borderRadius: 8,
    marginTop: 6,
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        background: "#fff",
        padding: 24,
        borderRadius: 14,
        boxShadow:
          "0 6px 18px rgba(0,0,0,.08)",
      }}
    >
      <h2>
        {record
          ? "Edit Breeding Record"
          : "New Breeding Record"}
      </h2>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(240px,1fr))",
            gap: 20,
          }}
        >
          <div>
            <label>Female Animal</label>

            <select
              name="female_id"
              value={form.female_id}
              onChange={handleChange}
              style={inputStyle}
              required
              disabled={!!animalId}
            >
              <option value="">
                Select Female
              </option>

              {femaleAnimals.map((a) => (
                <option
                  key={a.id}
                  value={a.id}
                >
                  {a.tag} | {a.breed} |{" "}
                  {a.animal_type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Sire (optional)</label>
            <select
              name="male_id"
              value={form.male_id}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="">
                Not on farm / AI / unknown
              </option>

              {maleAnimals.map((a) => (
                <option
                  key={a.id}
                  value={a.id}
                >
                  {a.tag} | {a.breed} |{" "}
                  {a.animal_type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Sire details (optional)</label>
            <input
              name="sire_details"
              value={form.sire_details}
              onChange={handleChange}
              style={inputStyle}
              placeholder={
                form.breeding_method === "Artificial Insemination"
                  ? "e.g. AI straw code / bull name"
                  : "e.g. Neighbour's bull"
              }
            />
          </div>
          <div>
            <label>Breeding Date</label>

            <input
              type="date"
              name="breeding_date"
              value={form.breeding_date}
              onChange={handleChange}
              style={inputStyle}
              required={form.status !== "Heat Detected"}
            />
          </div>

          <div>
            <label>Method</label>

            <select
              name="breeding_method"
              value={form.breeding_method}
              onChange={handleChange}
              style={inputStyle}
            >
              <option>Natural</option>
              <option>
                Artificial Insemination
              </option>
              <option>
                Embryo Transfer
              </option>
            </select>
          </div>

          <div>
            <label>Expected Birth</label>

            <input
              type="date"
              name="expected_birth"
              value={form.expected_birth}
              readOnly
              style={{
                ...inputStyle,
                background: "#F5F7FA",
              }}
            />
          </div>

          <div>
            <label>Status</label>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              style={inputStyle}
            >
              <option>Heat Detected</option>
              <option>Bred</option>
              <option>Pregnant</option>
              <option>Completed</option>
              <option>Failed</option>
            </select>
          </div>

          <div>
            <label>Technician</label>

            <input
              name="technician"
              value={form.technician}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <div
            style={{
              gridColumn: "1 / -1",
            }}
          >
            <label>Notes</label>

            <textarea
              rows="4"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          style={{
            marginTop: 24,
            padding: "12px 24px",
            background: "#2E7D32",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          💾 Save Breeding Record
        </button>
      </form>
    </div>
  );
}
