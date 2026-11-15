import { supabase } from "./supabase";

export async function getBreedingRecords() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("breeding_records")
    .select(`
      *,
      female:female_id(tag, breed, animal_type),
      male:male_id(tag, breed, animal_type)
    `)
    .eq("user_id", user.id)
    .order("breeding_date", {
      ascending: false,
    });

  if (error) throw error;

  return data || [];
}

/*
 * Get breeding history for ONE animal
 */
export async function getBreedingHistory(animalId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("breeding_records")
    .select(`
      *,
      female:female_id(tag, breed, animal_type),
      male:male_id(tag, breed, animal_type)
    `)
    .eq("user_id", user.id)
    .or(`female_id.eq.${animalId},male_id.eq.${animalId}`)
    .order("breeding_date", {
      ascending: false,
    });

  if (error) throw error;

  return data || [];
}

export async function addBreedingRecord(record) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("breeding_records")
    .insert([
      {
        ...record,
        user_id: user.id,
      },
    ])
    .select();

  if (error) throw error;

  return data;
}

export async function updateBreedingRecord(id, record) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("breeding_records")
    .update(record)
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) throw error;

  return data;
}

export async function deleteBreedingRecord(id) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("breeding_records")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function getFemaleAnimals() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("livestock")
    .select("*")
    .eq("user_id", user.id)
    .in("gender", [
      "Female",
      "Cow",
      "Ewe",
      "Doe",
      "Sow",
      "Hen",
    ])
    .order("tag");

  if (error) throw error;

  return data || [];
}

export async function getMaleAnimals() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("livestock")
    .select("*")
    .eq("user_id", user.id)
    .in("gender", [
      "Male",
      "Bull",
      "Ram",
      "Buck",
      "Boar",
      "Rooster",
    ])
    .order("tag");

  if (error) throw error;

  return data || [];
}

/** Breeding statuses that mean a pregnancy/breeding is still open. */
export const OPEN_BREEDING_STATUSES = ["Bred", "Pregnant"];

/** True when the female already has an open (Bred/Pregnant) breeding record. */
export async function hasOpenBreedingRecord(femaleId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("breeding_records")
    .select("id")
    .eq("user_id", user.id)
    .eq("female_id", femaleId)
    .in("status", OPEN_BREEDING_STATUSES)
    .limit(1);
  if (error) throw error;
  return (data || []).length > 0;
}

/**
 * Keep the female's Livestock status in step with breeding events.
 * Only touches the status when it actually needs to change, and never
 * overrides a removal status (Sold / Deceased / ...).
 */
async function syncFemaleStatus(femaleId, toStatus) {
  const { data: animal, error } = await supabase
    .from("livestock").select("status").eq("id", femaleId).single();
  if (error || !animal) return;
  const current = animal.status || "Active";
  // Only Active/Sick animals become Pregnant; only Pregnant animals go back to Active.
  if (toStatus === "Pregnant" && !["Active", "Sick"].includes(current)) return;
  if (toStatus === "Active" && current !== "Pregnant") return;
  await supabase.from("livestock").update({ status: toStatus }).eq("id", femaleId);
}

/** Heat detection: open a new cycle row for the female (status "Heat Detected"). */
export async function recordHeat({ female_id, heat_date, notes }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("breeding_records").insert([{
    user_id: user.id,
    female_id,
    heat_date,
    breeding_date: null,
    status: "Heat Detected",
    notes: notes || null,
  }]);
  if (error) throw error;
}

/**
 * Open heat record for a female, if any. Used so "Start Breeding" continues
 * the same cycle row instead of creating a second one.
 */
export async function getOpenHeatRecord(femaleId) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("breeding_records")
    .select("id")
    .eq("user_id", user.id)
    .eq("female_id", femaleId)
    .eq("status", "Heat Detected")
    .order("heat_date", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] || null;
}

/** Pregnancy check on an open breeding. Pregnant → status Pregnant; not pregnant → Failed. */
export async function recordPregnancyCheck(record, { check_date, result, method, notes }) {
  const pregnant = result === "Pregnant";
  const { error } = await supabase
    .from("breeding_records")
    .update({
      pregnancy_check_date: check_date,
      pregnancy_check_result: result,
      pregnancy_check_method: method || null,
      status: pregnant ? "Pregnant" : "Failed",
      notes: appendNote(record.notes, notes, `Pregnancy check ${check_date}`),
    })
    .eq("id", record.id);
  if (error) throw error;
  await syncFemaleStatus(record.female_id, pregnant ? "Pregnant" : "Active");
}

/** Birth: closes the cycle (status Completed) and sets the mother back to Active. */
export async function recordBirth(record, { birth_date, offspring_alive, offspring_dead, notes }) {
  const { error } = await supabase
    .from("breeding_records")
    .update({
      birth_date,
      offspring_alive,
      offspring_dead,
      status: "Completed",
      notes: appendNote(record.notes, notes, `Birth ${birth_date}`),
    })
    .eq("id", record.id);
  if (error) throw error;
  await syncFemaleStatus(record.female_id, "Active");
}

function appendNote(existing, extra, label) {
  const text = (extra || "").trim();
  if (!text) return existing || null;
  return existing ? `${existing}\n${label}: ${text}` : `${label}: ${text}`;
}

/**
 * Status implied by the events on a record after an edit/undo:
 *   birth → Completed; check → Pregnant / Failed; otherwise "Bred" if bred,
 *   else "Heat Detected". A record that was Pregnant without any check
 *   (marked from Livestock) keeps "Pregnant" when only other events change.
 */
function statusFromEvents(rec, previousStatus) {
  if (rec.birth_date) return "Completed";
  if (rec.pregnancy_check_date) return rec.pregnancy_check_result === "Not pregnant" ? "Failed" : "Pregnant";
  if (rec.breeding_date) return previousStatus === "Pregnant" && !rec._checkRemoved ? "Pregnant" : "Bred";
  return "Heat Detected";
}

/**
 * Correct a recorded event. type: "heat" | "check" | "birth".
 * fields (only the ones for that type):
 *   heat:  { heat_date }
 *   check: { pregnancy_check_date, pregnancy_check_result, pregnancy_check_method }
 *   birth: { birth_date, offspring_alive, offspring_dead }
 */
export async function updateBreedingEvent(record, type, fields) {
  const next = { ...record, ...fields };
  const update = { ...fields };
  if (type !== "heat") update.status = statusFromEvents(next, record.status);
  const { error } = await supabase.from("breeding_records").update(update).eq("id", record.id);
  if (error) throw error;
  if (type === "check" && !next.birth_date) {
    await syncFemaleStatus(record.female_id, update.status === "Pregnant" ? "Pregnant" : "Active");
  }
}

/**
 * Remove a recorded event (undo a mistake).
 *   birth → cleared; record back to Pregnant (or the check result); mother set Pregnant again.
 *   check → cleared (only when no birth is recorded); record back to Bred.
 *   heat  → cleared; a heat-only record is deleted entirely.
 */
export async function undoBreedingEvent(record, type) {
  if (type === "heat" && !record.breeding_date) {
    await deleteBreedingRecord(record.id);
    return;
  }
  if (type === "check" && record.birth_date) {
    throw new Error("Undo the birth first, then the pregnancy check.");
  }
  const cleared = {
    heat: { heat_date: null },
    check: { pregnancy_check_date: null, pregnancy_check_result: null, pregnancy_check_method: null },
    birth: { birth_date: null, offspring_alive: null, offspring_dead: null },
  }[type];
  const next = { ...record, ...cleared, _checkRemoved: type === "check" };
  const update = { ...cleared };
  if (type !== "heat") update.status = statusFromEvents(next, type === "birth" ? "Pregnant" : record.status);
  const { error } = await supabase.from("breeding_records").update(update).eq("id", record.id);
  if (error) throw error;
  if (type === "birth" && update.status === "Pregnant") {
    // Birth was recorded by mistake: she is still pregnant.
    const { data: animal } = await supabase.from("livestock").select("status").eq("id", record.female_id).single();
    if (animal && (animal.status || "Active") === "Active") {
      await supabase.from("livestock").update({ status: "Pregnant" }).eq("id", record.female_id);
    }
  }
}

/** Mark the female Pregnant on Livestock (used when a breeding is saved as Pregnant). */
export async function markFemalePregnant(femaleId) {
  if (femaleId) await syncFemaleStatus(femaleId, "Pregnant");
}
