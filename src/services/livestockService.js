import { supabase } from "./supabase";
import { createPurchaseFinanceRecord } from "./autoFinanceService";
import { offlineCapture } from "./offline/offlineCapture";

export async function getAnimals() {
  const { data, error } = await supabase
    .from("livestock")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

export async function addAnimal(animal) {
  // Offline capture: queue locally if no connection
  if (!navigator.onLine) {
    const queued = await offlineCapture({
      action: "insert",
      module: "Livestock",
      table: "livestock",
      payload: animal,
    });
    if (queued) return { ...animal, id: `offline-${Date.now()}`, _offline: true };
    // If queue failed, fall through and try online
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("You must be logged in.");

  const { data, error } = await supabase.from("livestock").insert([
    {
      ...animal,
      user_id: user.id,
    },
  ]).select().single();

  if (error) throw error;

  // Auto-create finance record if purchase_price is provided
  if (data && Number(animal.purchase_price) > 0) {
    await createPurchaseFinanceRecord(data);
  }

  return data;
}

export async function updateAnimal(id, updates) {
  const { error } = await supabase
    .from("livestock")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteAnimal(id) {
  // Soft-delete: archive instead of permanently removing
  const { error } = await supabase
    .from("livestock")
    .update({ status: "Archived" })
    .eq("id", id);

  if (error) throw error;
}

/**
 * Change an animal's lifecycle status.
 */
export async function changeAnimalStatus(id, newStatus) {
  const { error } = await supabase
    .from("livestock")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) throw error;
}
