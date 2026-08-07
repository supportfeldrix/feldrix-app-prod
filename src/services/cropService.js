import { supabase } from "./supabase";
import { offlineCapture } from "./offline/offlineCapture";

/**
 * 🌾 Get all crops
 */
export async function getCrops() {
  const { data, error } = await supabase
    .from("crops")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getCrops error:", error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * 🌱 Add new crop
 */
export async function addCrop(crop) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not logged in.");
  }

  // Offline capture
  if (!navigator.onLine) {
    await offlineCapture({
      action: "insert",
      module: "Crops",
      table: "crops",
      payload: { ...crop, user_id: user.id },
    });
    return { ...crop, user_id: user.id, id: `offline-${Date.now()}`, _offline: true };
  }

  const { data, error } = await supabase
    .from("crops")
    .insert([
      {
        ...crop,
        user_id: user.id,
      },
    ])
    .select();

  if (error) {
    console.error("addCrop error:", error);
    throw new Error(error.message);
  }

  return data?.[0];
}

/**
 * ✏️ Update existing crop
 */
export async function updateCrop(id, updates) {
  const { data, error } = await supabase
    .from("crops")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) {
    console.error("updateCrop error:", error);
    throw new Error(error.message);
  }

  return data?.[0];
}

/**
 * 🗑 Delete crop
 */
export async function deleteCrop(id) {
  const { error } = await supabase
    .from("crops")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteCrop error:", error);
    throw new Error(error.message);
  }

  return true;
}

/**
 * 🔍 Get single crop by ID
 */
export async function getCropById(id) {
  const { data, error } = await supabase
    .from("crops")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("getCropById error:", error);
    throw new Error(error.message);
  }

  return data;
}
