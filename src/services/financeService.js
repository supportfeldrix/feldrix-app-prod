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
  const cleanRecord = { ...record, user_id: user.id };

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

export async function updateFinanceRecord(id, updates) {
  const cleanUpdates = { ...updates };

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
