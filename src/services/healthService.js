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

  // Auto-complete a matching prior scheduled treatment (Planner task).
  // Non-fatal: never block the vaccination save if this fails.
  if (created) {
    try {
      await autoCompleteMatchingScheduledTreatment(created, user.id);
    } catch (matchErr) {
      console.error("Auto-complete matching treatment failed:", matchErr);
    }
  }

  return created;
}

/*
 * Auto-match a newly recorded treatment to a prior scheduled treatment
 * and mark that prior record as completed.
 *
 * Match criteria (all required):
 *   - same user_id            (tenant isolation)
 *   - same animal_id
 *   - same treatment_type
 *   - prior record has next_due (still generating a virtual task)
 *   - prior record completed_at IS NULL (not already completed)
 *   - new treatment_date >= prior next_due (new treatment fulfils the due one)
 *   - prior record is not the record we just created
 *
 * If multiple candidates match, only the SINGLE earliest-due one is completed.
 * Medication/vaccine name is intentionally NOT part of the match.
 *
 * Does NOT change next_due or treatment_date. Does NOT delete anything.
 */
async function autoCompleteMatchingScheduledTreatment(newRecord, userId) {
  if (!newRecord?.animal_id || !newRecord?.treatment_type || !newRecord?.treatment_date) {
    return;
  }

  // Fetch candidate prior scheduled treatments for this animal + type,
  // scoped to the current user (RLS also enforces this server-side).
  const { data: candidates, error } = await supabase
    .from("animal_health")
    .select("id, next_due, completed_at")
    .eq("user_id", userId)
    .eq("animal_id", newRecord.animal_id)
    .eq("treatment_type", newRecord.treatment_type)
    .is("completed_at", null)
    .not("next_due", "is", null)
    .neq("id", newRecord.id)
    .lte("next_due", newRecord.treatment_date)
    .order("next_due", { ascending: true })
    .limit(1);

  if (error) {
    console.error(error);
    return;
  }

  const match = candidates?.[0];
  if (!match) return;

  // Preserve original next_due and treatment_date. Only stamp completion.
  // completed_at reflects the actual treatment date the farmer recorded.
  const { error: updateError } = await supabase
    .from("animal_health")
    .update({
      completed_at: new Date(newRecord.treatment_date).toISOString(),
      completed_source: "health_record_auto",
    })
    .eq("id", match.id)
    .eq("user_id", userId);

  if (updateError) {
    console.error(updateError);
  }
}

/*
 * Complete a scheduled Animal Health treatment from the Planner
 * (farmer pressed "Complete" on a virtual Animal Health task).
 *
 * Marks the source animal_health record as completed WITHOUT:
 *   - changing next_due (original schedule preserved for reporting)
 *   - changing treatment_date
 *   - deleting the record
 *
 * @param {object} record - the source animal_health row (task.record)
 */
export async function completeHealthTask(record) {
  const id = record?.id;
  if (!id) throw new Error("Cannot complete task: missing health record id.");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not logged in.");

  const { data, error } = await supabase
    .from("animal_health")
    .update({
      completed_at: new Date().toISOString(),
      completed_source: "planner_manual",
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) {
    console.error(error);
    throw error;
  }

  return data?.[0];
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
