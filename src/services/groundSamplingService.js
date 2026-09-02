import { supabase } from "./supabase";
import { offlineCapture } from "./offline/offlineCapture";

/**
 * Feldrix — Ground Sampling (Soil Sampling) Service
 *
 * CRUD for the `ground_samples` table. Mirrors cropService conventions:
 *   - tenant isolation via user_id (set from the authenticated session)
 *   - Supabase RLS enforces ownership server-side as well
 *   - offline capture on insert
 *
 * Unit convention (v1, documented): pH unitless; N/P/K in mg/kg (ppm);
 * organic_matter and moisture in %.
 */

/**
 * 🌱 Get all ground samples for the current farmer (newest first).
 * Joins the linked crop (if any) for display.
 */
export async function getGroundSamples() {
  const { data, error } = await supabase
    .from("ground_samples")
    .select(`
      *,
      crops (
        id,
        crop_name,
        field_name
      )
    `)
    .order("sample_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getGroundSamples error:", error);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * 🔎 Latest ground sample (or null if none).
 */
export async function getLatestGroundSample() {
  const { data, error } = await supabase
    .from("ground_samples")
    .select(`*, crops ( id, crop_name, field_name )`)
    .order("sample_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("getLatestGroundSample error:", error);
    throw new Error(error.message);
  }

  return data?.[0] || null;
}

/**
 * Samples for a specific field (free-text field_name, newest first).
 */
export async function getGroundSamplesForField(fieldName) {
  const { data, error } = await supabase
    .from("ground_samples")
    .select(`*, crops ( id, crop_name, field_name )`)
    .eq("field_name", fieldName)
    .order("sample_date", { ascending: false });

  if (error) {
    console.error("getGroundSamplesForField error:", error);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Samples for a specific crop (newest first).
 */
export async function getGroundSamplesForCrop(cropId) {
  const { data, error } = await supabase
    .from("ground_samples")
    .select(`*, crops ( id, crop_name, field_name )`)
    .eq("crop_id", cropId)
    .order("sample_date", { ascending: false });

  if (error) {
    console.error("getGroundSamplesForCrop error:", error);
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * 🌱 Add a ground sample.
 * user_id is taken from the authenticated session (never trusted from the UI).
 */
export async function addGroundSample(sample) {
  // Offline capture: queue locally if no connection
  if (!navigator.onLine) {
    const queued = await offlineCapture({
      action: "insert",
      module: "Crops",
      table: "ground_samples",
      payload: sample,
    });
    if (queued) return { ...sample, id: `offline-${Date.now()}`, _offline: true };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not logged in.");
  }

  const { data, error } = await supabase
    .from("ground_samples")
    .insert([{ ...sample, user_id: user.id }])
    .select();

  if (error) {
    console.error("addGroundSample error:", error);
    throw new Error(error.message);
  }

  return data?.[0];
}

/**
 * ✏️ Update a ground sample. Ownership enforced by RLS.
 */
export async function updateGroundSample(id, updates) {
  const { data, error } = await supabase
    .from("ground_samples")
    .update(updates)
    .eq("id", id)
    .select();

  if (error) {
    console.error("updateGroundSample error:", error);
    throw new Error(error.message);
  }

  return data?.[0];
}

/**
 * 🗑 Delete a ground sample. Ownership enforced by RLS.
 */
export async function deleteGroundSample(id) {
  const { error } = await supabase
    .from("ground_samples")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("deleteGroundSample error:", error);
    throw new Error(error.message);
  }

  return true;
}
