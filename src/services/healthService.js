import { supabase } from "./supabase";
import { createHealthFinanceRecord } from "./autoFinanceService";
import { offlineCapture } from "./offline/offlineCapture";

/*
 * Get all health records (Health page)
 */
export async function getHealthRecords() {
  const { data, error } = await supabase
    .from("animal_health")
    .select(`
      *,
      livestock (
        id,
        tag,
        breed,
        animal_type
      )
    `)
    .order("treatment_date", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    throw error;
  }

  return data || [];
}

/*
 * Get health records for ONE animal
 * (Animal Profile)
 */
export async function getHealthRecordsByAnimal(animalId) {
  const { data, error } = await supabase
    .from("animal_health")
    .select("*")
    .eq("animal_id", animalId)
    .order("treatment_date", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    throw error;
  }

  return data || [];
}

/*
 * Get all animals
 */
export async function getAnimals() {
  const { data, error } = await supabase
    .from("livestock")
    .select(`
      id,
      tag,
      breed,
      animal_type
    `)
    .order("tag");

  if (error) {
    console.error(error);
    throw error;
  }

  return data || [];
}

/*
 * Add health record
 */
export async function addHealthRecord(record) {
  // Offline capture: queue locally if no connection
  if (!navigator.onLine) {
    const queued = await offlineCapture({
      action: "insert",
      module: "Health",
      table: "animal_health",
      payload: record,
    });
    if (queued) return { ...record, id: `offline-${Date.now()}`, _offline: true };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("animal_health")
    .insert([
      {
        ...record,
        user_id: user.id,
      },
    ])
    .select();

  if (error) {
    console.error(error);
    throw error;
  }

  const created = data[0];

  // Auto-create finance record if cost is provided
  if (created && Number(record.cost) > 0) {
    await createHealthFinanceRecord(created);
  }

  return created;
}

/*
 * Update health record
 */
export async function updateHealthRecord(id, updates) {
  const { data, error } = await supabase
    .from("animal_health")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) {
    console.error(error);
    throw error;
  }

  return data[0];
}

/*
 * Delete health record
 */
export async function deleteHealthRecord(id) {
  const { error } = await supabase
    .from("animal_health")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }

  return true;
}

/*
 * Alias used by Animal Profile
 */
export const getHealthHistory = getHealthRecordsByAnimal;
