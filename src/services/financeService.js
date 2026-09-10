import { supabase } from "./supabase";
import { offlineCapture } from "./offline/offlineCapture";

export async function getFinanceRecords() {
  const { data, error } = await supabase
    .from("finance_records")
    .select(`
      *,
      animal:livestock (
        id,
        tag,
        breed
      )
    `)
    .order("transaction_date", {
      ascending: false,
    });

  if (error) throw error;

  return data || [];
}

export async function getAnimalFinance(animalId) {
  const { data, error } = await supabase
    .from("finance_records")
    .select("*")
    .eq("animal_id", animalId)
    .order("transaction_date", {
      ascending: false,
    });

  if (error) throw error;

  return data || [];
}

export async function addFinanceRecord(record) {
  // Offline capture: queue locally if no connection
  if (!navigator.onLine) {
    const queued = await offlineCapture({
      action: "insert",
      module: "Finance",
      table: "finance_records",
      payload: record,
    });
    if (queued) return { ...record, id: `offline-${Date.now()}`, _offline: true };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Clean up animal_id — set to null if not an animal-specific transaction
  const cleanRecord = normalizeQuantityFields({ ...record, user_id: user.id });

  if (!cleanRecord.applies_to) {
    cleanRecord.applies_to = cleanRecord.animal_id ? "animal" : "farm";
  }

  if (cleanRecord.applies_to !== "animal") {
    cleanRecord.animal_id = null;
  }

  const { data, error } = await supabase
    .from("finance_records")
    .insert([cleanRecord])
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Phase 2 — normalise optional quantity/unit/supplier so we never send an
 * empty string (which would violate the numeric column / unit CHECK) and
 * never persist a dangling unit without a quantity. Fields left undefined
 * are untouched so partial updates keep working. Money is never touched.
 */
function normalizeQuantityFields(record) {
  const out = { ...record };

  if ("quantity" in out || "unit" in out || "supplier" in out) {
    const hasQty = out.quantity !== "" && out.quantity !== null && out.quantity !== undefined;
    const qty = hasQty ? Number(out.quantity) : null;
    const validQty = Number.isFinite(qty) && qty > 0 ? qty : null;

    out.quantity = validQty;
    out.unit = validQty && out.unit ? out.unit : null; // unit only meaningful with a quantity
    out.supplier = out.supplier && String(out.supplier).trim() ? String(out.supplier).trim() : null;
  }

  return out;
}

export async function updateFinanceRecord(id, updates) {
  const cleanUpdates = normalizeQuantityFields({ ...updates });

  if (!cleanUpdates.applies_to) {
    cleanUpdates.applies_to = cleanUpdates.animal_id ? "animal" : "farm";
  }

  if (cleanUpdates.applies_to !== "animal") {
    cleanUpdates.animal_id = null;
  }

  const { data, error } = await supabase
    .from("finance_records")
    .update(cleanUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteFinanceRecord(id) {
  const { error } = await supabase
    .from("finance_records")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getFinanceSummary() {
  const records = await getFinanceRecords();

  const income = records
    .filter((r) => r.category === "Income")
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const expenses = records
    .filter((r) => r.category === "Expense")
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return {
    income,
    expenses,
    profit: income - expenses,
    records,
  };
}
