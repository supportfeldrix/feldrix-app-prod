import { useEffect, useState } from "react";

import {
  addFinanceRecord,
  updateFinanceRecord,
} from "../../services/financeService";

import {
  getAnimals,
} from "../../services/livestockService";

import { FINANCE_UNITS, suggestedUnitForType } from "../../constants/financeUnits";

const EXPENSE_TYPES = [
  "Feed",
  "Hay",
  "Silage",
  "Veterinary",
  "Medication",
  "Diesel",
  "Fuel",
  "Machinery Repair",
  "Machinery Service",
  "Equipment",
  "Labour",
  "Transport",
  "Insurance",
  "Utilities",
  "Electricity",
  "Water",
  "Fertilizer",
  "Seed",
  "Irrigation",
  "Fencing",
  "Maintenance",
  "Office",
  "Other",
];

const INCOME_TYPES = [
  "Animal Sale",
  "Crop Sale",
  "Hay Sale",
  "Milk",
  "Eggs",
  "Wool",
  "Services",
  "Other Income",
];

const initialState = {
  applies_to: "farm",
  animal_id: "",
  category: "Expense",
  transaction_type: "Feed",
  amount: "",
  transaction_date: new Date()
    .toISOString()
    .split("T")[0],
  description: "",
  // Phase 2 — all optional. Empty strings are coerced to NULL on save.
  quantity: "",
  unit: "",
  supplier: "",
};

export default function FinanceForm({
  record = null,
  refreshRecords,
  onSaved,
}) {
  const [form, setForm] = useState(initialState);
  const [animals, setAnimals] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAnimals();
  }, []);

  useEffect(() => {
    if (record) {
      setForm({
        ...record,
        applies_to: record.applies_to || (record.animal_id ? "animal" : "farm"),
        // Existing rows have NULL quantity/unit/supplier — show as empty,
        // editable. Values persist correctly when re-saved.
        quantity: record.quantity ?? "",
        unit: record.unit ?? "",
        supplier: record.supplier ?? "",
      });
    } else {
      setForm(initialState);
    }
  }, [record]);

  async function loadAnimals() {
    try {
      const data = await getAnimals();
      setAnimals(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      // Reset transaction_type when category changes
      if (name === "category") {
        updated.transaction_type = value === "Income" ? "Animal Sale" : "Feed";
      }

      // Context-aware convenience: suggest a sensible default unit for the
      // chosen expense type, but ONLY when the farmer hasn't picked a unit.
      // Never forces quantity/unit and never overrides an explicit choice.
      if (name === "transaction_type" && !prev.unit) {
        const suggested = suggestedUnitForType(value);
        if (suggested) updated.unit = suggested;
      }

      // Clear animal_id when scope changes away from animal
      if (name === "applies_to" && value !== "animal") {
        updated.animal_id = "";
      }

      return updated;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (form.applies_to === "animal" && !form.animal_id) {
      alert("Please select an animal.");
      return;
    }

    // ── Phase 2: optional quantity/unit validation ──────────────
    const hasQuantity = form.quantity !== "" && form.quantity !== null && form.quantity !== undefined;
    const qtyNum = hasQuantity ? Number(form.quantity) : null;

    if (hasQuantity) {
      if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
        alert("Quantity must be a number greater than 0. Leave it blank if you are not recording a quantity.");
        return;
      }
      if (!form.unit) {
        alert("Please choose a unit for the quantity (e.g. Litres, Kilograms).");
        return;
      }
    }

    // A unit on its own (no quantity) carries no information — clear it so we
    // never store a dangling unit. This is the "safely handled" path.
    const cleanQuantity = hasQuantity ? qtyNum : null;
    const cleanUnit = hasQuantity ? form.unit : null;
    const cleanSupplier = form.supplier?.trim() ? form.supplier.trim() : null;

    const payload = {
      ...form,
      quantity: cleanQuantity,
      unit: cleanUnit,
      supplier: cleanSupplier,
    };

    setSaving(true);

    try {
      if (record) {
        await updateFinanceRecord(record.id, payload);
      } else {
        await addFinanceRecord(payload);
      }

      await refreshRecords();

      if (onSaved) {
        onSaved();
      }

      setForm(initialState);
    } catch (err) {
      alert(err.message);
    }

    setSaving(false);
  }

  const transactionTypes = form.category === "Income" ? INCOME_TYPES : EXPENSE_TYPES;

  return (
    <form onSubmit={handleSubmit} style={card}>
      <h2 style={title}>
        {record ? "✏️ Edit Finance Record" : "💳 Add Finance Record"}
      </h2>

      {/* Row 1: Applies To + Category + Transaction Type */}
      <div style={grid3}>
        <div>
          <label style={label}>Applies To</label>
          <select
            name="applies_to"
            value={form.applies_to}
            onChange={handleChange}
            style={input}
          >
            <option value="farm">🌾 Entire Farm</option>
            <option value="livestock">🐄 Livestock</option>
            <option value="animal">🐄 Individual Animal</option>
          </select>
        </div>

        <div>
          <label style={label}>Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            style={input}
          >
            <option value="Expense">💸 Expense</option>
            <option value="Income">💳 Income</option>
          </select>
        </div>

        <div>
          <label style={label}>Transaction Type</label>
          <select
            name="transaction_type"
            value={form.transaction_type}
            onChange={handleChange}
            style={input}
          >
            {transactionTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Animal Selector — only when applies_to = animal */}
      {form.applies_to === "animal" && (
        <div style={{ marginTop: 20 }}>
          <label style={label}>Animal</label>
          <select
            name="animal_id"
            value={form.animal_id}
            onChange={handleChange}
            style={input}
            required
          >
            <option value="">Select Animal</option>
            {animals.map((animal) => (
              <option key={animal.id} value={animal.id}>
                🐄 {animal.tag} • {animal.breed}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Row 2: Amount + Date */}
      <div style={grid2}>
        <div>
          <label style={label}>Amount (R)</label>
          <input
            type="number"
            step="0.01"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="0.00"
            style={input}
            required
          />
        </div>

        <div>
          <label style={label}>Transaction Date</label>
          <input
            type="date"
            name="transaction_date"
            value={form.transaction_date}
            onChange={handleChange}
            style={input}
            required
          />
        </div>
      </div>

      {/* Row 3: Quantity + Unit (both optional) */}
      <div style={grid2}>
        <div>
          <label style={label}>
            Quantity <span style={optionalHint}>(optional)</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="quantity"
            value={form.quantity}
            onChange={handleChange}
            placeholder="e.g. 500"
            style={input}
          />
        </div>

        <div>
          <label style={label}>
            Unit <span style={optionalHint}>(optional)</span>
          </label>
          <select
            name="unit"
            value={form.unit}
            onChange={handleChange}
            style={input}
          >
            <option value="">— None —</option>
            {FINANCE_UNITS.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Supplier (optional) */}
      <div style={{ marginTop: 18 }}>
        <label style={label}>
          Supplier <span style={optionalHint}>(optional)</span>
        </label>
        <input
          name="supplier"
          value={form.supplier}
          onChange={handleChange}
          placeholder="e.g. ABC Fuel Supplies"
          style={input}
        />
      </div>

      {/* Description */}
      <div style={{ marginTop: 18 }}>
        <label style={label}>Description</label>
        <textarea
          rows={4}
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Add notes about this transaction..."
          style={textarea}
        />
      </div>

      <button type="submit" disabled={saving} style={button}>
        {saving ? "Saving..." : record ? "💾 Update Record" : "💾 Save Record"}
      </button>
    </form>
  );
}

const card = {
  background: "#FFFFFF",
  padding: 28,
  borderRadius: 16,
  boxShadow: "0 8px 20px rgba(15,23,42,.08)",
  marginBottom: 24,
};

const title = {
  marginTop: 0,
  marginBottom: 24,
};

const label = {
  display: "block",
  marginBottom: 6,
  fontSize: 13,
  fontWeight: 600,
  color: "#475569",
};

const optionalHint = {
  fontWeight: 400,
  fontSize: 12,
  color: "#94A3B8",
};

const grid3 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
  gap: 20,
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 20,
  marginTop: 20,
};

const input = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #CBD5E1",
  borderRadius: 10,
  fontSize: 14,
  boxSizing: "border-box",
};

const textarea = {
  width: "100%",
  padding: 14,
  border: "1px solid #CBD5E1",
  borderRadius: 10,
  resize: "vertical",
  fontSize: 14,
  boxSizing: "border-box",
};

const button = {
  marginTop: 24,
  background: "#16A34A",
  color: "#FFFFFF",
  border: "none",
  padding: "14px 28px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 15,
};
