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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("You must be logged in.");

  // Offline capture: queue locally if no connection
  if (!navigator.onLine) {
    await offlineCapture({
      action: "insert",
      module: "Livestock",
      table: "livestock",
      payload: { ...animal, user_id: user.id },
    });
    return { ...animal, user_id: user.id, id: `offline-${Date.now()}`, _offline: true };
  }

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
  const { error } = await supabase
    .from("livestock")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
