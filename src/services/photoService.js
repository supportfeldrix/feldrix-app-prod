/**
 * ============================================================
 * Feldrix — Photo Service
 * Version 1.0
 *
 * Universal photo management for all modules.
 * Handles upload, delete, thumbnails, galleries, cover photos.
 * Stores files in Supabase Storage, metadata in photos table.
 *
 * Prepared for future AI Vision integration.
 * ============================================================
 */

import { supabase } from "./supabase";
import { getCurrentUser } from "./profileService";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const THUMBNAIL_MAX_WIDTH = 400;

// ─── Bucket Mapping ─────────────────────────────────────────

const BUCKET_MAP = {
  livestock: "livestock-photos",
  crops: "crop-photos",
  machinery: "machinery-photos",
  support: "support-attachments",
  general: "general-photos",
};

function getBucket(module) {
  return BUCKET_MAP[module] || "general-photos";
}

function getStoragePath(userId, module, recordId, filename) {
  return `${userId}/${module}/${recordId}/${filename}`;
}

// ─── Upload ─────────────────────────────────────────────────

/**
 * Upload a photo to Supabase Storage and save metadata.
 *
 * @param {object} params
 * @param {File} params.file - The file to upload
 * @param {string} params.module - "livestock", "crops", "machinery", "support"
 * @param {string} params.recordId - The ID of the record (animal, crop, machine, ticket)
 * @param {string} [params.caption] - Optional caption
 * @param {string} [params.category] - Optional category
 * @param {string} [params.uploadedFrom] - "web", "mobile", "camera"
 * @returns {object} The created photo record
 */
export async function uploadPhoto({ file, module, recordId, caption, category, uploadedFrom = "web" }) {
  // Validate
  if (!file) throw new Error("No file provided.");
  if (!SUPPORTED_TYPES.includes(file.type)) {
    throw new Error("Unsupported file type. Please upload JPEG, PNG, or WEBP.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File is too large. Maximum size is 10 MB.");
  }

  const user = await getCurrentUser();
  if (!user) throw new Error("You must be logged in to upload photos.");

  const bucket = getBucket(module);
  const timestamp = Date.now();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${timestamp}.${ext}`;
  const storagePath = getStoragePath(user.id, module, recordId, filename);

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Storage upload failed:", uploadError.message);
    throw new Error("Failed to upload photo. Please try again.");
  }

  // Generate thumbnail path (same bucket, /thumb/ prefix)
  const thumbnailPath = getStoragePath(user.id, module, recordId, `thumb_${filename}`);

  // Try to upload a compressed thumbnail
  try {
    const thumbBlob = await generateThumbnailBlob(file);
    if (thumbBlob) {
      await supabase.storage
        .from(bucket)
        .upload(thumbnailPath, thumbBlob, { contentType: "image/jpeg", upsert: false });
    }
  } catch {
    // Thumbnail generation failed — continue without it
  }

  // Save metadata to database
  const { data, error: dbError } = await supabase
    .from("photos")
    .insert([{
      user_id: user.id,
      module,
      record_id: recordId,
      storage_bucket: bucket,
      storage_path: storagePath,
      thumbnail_path: thumbnailPath,
      filename,
      original_filename: file.name,
      mime_type: file.type,
      file_size: file.size,
      caption: caption || null,
      category: category || null,
      is_cover: false,
      uploaded_from: uploadedFrom,
    }])
    .select()
    .single();

  if (dbError) {
    console.error("Photo metadata save failed:", dbError.message);
    throw new Error("Photo uploaded but metadata save failed.");
  }

  return data;
}

// ─── Fetch Gallery ──────────────────────────────────────────

/**
 * Get all photos for a specific record.
 */
export async function fetchGallery(module, recordId) {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("module", module)
    .eq("record_id", recordId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch gallery failed:", error.message);
    return [];
  }

  return data || [];
}

/**
 * Get the cover photo for a record.
 */
export async function getCoverPhoto(module, recordId) {
  const { data } = await supabase
    .from("photos")
    .select("*")
    .eq("module", module)
    .eq("record_id", recordId)
    .eq("is_cover", true)
    .limit(1)
    .maybeSingle();

  return data || null;
}

// ─── Signed URLs ────────────────────────────────────────────

/**
 * Generate a signed URL for a photo (expires in 1 hour).
 */
export async function generateSignedUrl(bucket, path, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) return null;
  return data?.signedUrl || null;
}

/**
 * Get signed URLs for a photo (both thumbnail and original).
 */
export async function getPhotoUrls(photo) {
  const [thumbUrl, originalUrl] = await Promise.all([
    photo.thumbnail_path ? generateSignedUrl(photo.storage_bucket, photo.thumbnail_path) : null,
    generateSignedUrl(photo.storage_bucket, photo.storage_path),
  ]);

  return { thumbnailUrl: thumbUrl || originalUrl, originalUrl };
}

// ─── Delete ─────────────────────────────────────────────────

/**
 * Delete a photo (storage + metadata).
 */
export async function deletePhoto(photoId) {
  const { data: photo, error: fetchError } = await supabase
    .from("photos")
    .select("*")
    .eq("id", photoId)
    .single();

  if (fetchError || !photo) throw new Error("Photo not found.");

  // Delete from storage
  await supabase.storage.from(photo.storage_bucket).remove([photo.storage_path]);
  if (photo.thumbnail_path) {
    await supabase.storage.from(photo.storage_bucket).remove([photo.thumbnail_path]);
  }

  // Delete metadata
  const { error: deleteError } = await supabase
    .from("photos")
    .delete()
    .eq("id", photoId);

  if (deleteError) throw new Error("Failed to delete photo record.");

  return true;
}

// ─── Cover Photo ────────────────────────────────────────────

/**
 * Set a photo as the cover photo (unsets any previous cover).
 */
export async function setCoverPhoto(photoId, module, recordId) {
  // Unset all existing covers for this record
  await supabase
    .from("photos")
    .update({ is_cover: false })
    .eq("module", module)
    .eq("record_id", recordId);

  // Set the new cover
  const { error } = await supabase
    .from("photos")
    .update({ is_cover: true, updated_at: new Date().toISOString() })
    .eq("id", photoId);

  if (error) throw new Error("Failed to set cover photo.");
  return true;
}

/**
 * Remove cover photo designation.
 */
export async function removeCoverPhoto(photoId) {
  const { error } = await supabase
    .from("photos")
    .update({ is_cover: false })
    .eq("id", photoId);

  if (error) throw new Error("Failed to remove cover photo.");
  return true;
}

// ─── Caption ────────────────────────────────────────────────

/**
 * Update a photo's caption.
 */
export async function updateCaption(photoId, caption) {
  const { error } = await supabase
    .from("photos")
    .update({ caption, updated_at: new Date().toISOString() })
    .eq("id", photoId);

  if (error) throw new Error("Failed to update caption.");
  return true;
}

// ─── Thumbnail Generation (Client-Side) ─────────────────────

/**
 * Generate a compressed thumbnail blob using Canvas.
 */
async function generateThumbnailBlob(file) {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ratio = Math.min(THUMBNAIL_MAX_WIDTH / img.width, 1);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              resolve(blob);
            },
            "image/jpeg",
            0.7
          );
        } catch {
          URL.revokeObjectURL(url);
          resolve(null);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

// ─── Delete Gallery ─────────────────────────────────────────

/**
 * Delete all photos for a record.
 */
export async function deleteGallery(module, recordId) {
  const photos = await fetchGallery(module, recordId);
  for (const photo of photos) {
    await deletePhoto(photo.id).catch(() => {});
  }
  return true;
}
