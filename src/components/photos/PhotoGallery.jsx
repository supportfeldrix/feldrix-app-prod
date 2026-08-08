/**
 * Feldrix — Photo Gallery
 * Displays a grid of photo thumbnails with lightbox viewer.
 * Reusable across all modules.
 */

import { useState, useEffect } from "react";
import { Box, Chip, CircularProgress, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Delete, Star, StarBorder, ZoomIn, Download } from "@mui/icons-material";
import toast from "react-hot-toast";
import { fetchGallery, getPhotoUrls, deletePhoto, setCoverPhoto, generateSignedUrl } from "../../services/photoService";
import PhotoLightbox from "./PhotoLightbox";

export default function PhotoGallery({ module, recordId, refreshKey }) {
  const [photos, setPhotos] = useState([]);
  const [urls, setUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  useEffect(() => {
    loadGallery();
  }, [module, recordId, refreshKey]);

  async function loadGallery() {
    setLoading(true);
    try {
      const gallery = await fetchGallery(module, recordId);
      setPhotos(gallery);

      // Load signed URLs for thumbnails
      const urlMap = {};
      await Promise.all(
        gallery.map(async (photo) => {
          const { thumbnailUrl } = await getPhotoUrls(photo);
          urlMap[photo.id] = thumbnailUrl;
        })
      );
      setUrls(urlMap);
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(photo) {
    if (!confirm("Delete this photo?")) return;
    try {
      await deletePhoto(photo.id);
      toast.success("Photo deleted.");
      loadGallery();
    } catch (err) {
      toast.error(err.message || "Failed to delete.");
    }
  }

  async function handleSetCover(photo) {
    try {
      await setCoverPhoto(photo.id, module, recordId);
      toast.success("Cover photo set.");
      loadGallery();
    } catch (err) {
      toast.error(err.message || "Failed to set cover.");
    }
  }

  async function handleDownload(photo) {
    const url = await generateSignedUrl(photo.storage_bucket, photo.storage_path);
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = photo.original_filename || photo.filename;
      a.click();
    }
  }

  if (loading) {
    return <Box sx={{ textAlign: "center", py: 3 }}><CircularProgress size={24} /></Box>;
  }

  if (photos.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body2" color="text.secondary">No photos yet.</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 1.5 }}>
        {photos.map((photo, index) => (
          <Box
            key={photo.id}
            sx={{
              position: "relative",
              borderRadius: 2,
              overflow: "hidden",
              aspectRatio: "1",
              bgcolor: "grey.100",
              cursor: "pointer",
              "&:hover .photo-overlay": { opacity: 1 },
            }}
            onClick={() => setLightboxIndex(index)}
          >
            {urls[photo.id] ? (
              <Box component="img" src={urls[photo.id]} alt={photo.caption || ""} sx={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
            ) : (
              <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress size={16} />
              </Box>
            )}

            {/* Cover badge */}
            {photo.is_cover && (
              <Chip label="Cover" size="small" color="success" sx={{ position: "absolute", top: 4, left: 4, height: 18, fontSize: "0.55rem", fontWeight: 700 }} />
            )}

            {/* Hover overlay */}
            <Box
              className="photo-overlay"
              sx={{
                position: "absolute", inset: 0,
                bgcolor: "rgba(0,0,0,0.5)",
                opacity: 0,
                transition: "opacity 0.2s",
                display: "flex", alignItems: "flex-end", justifyContent: "center", pb: 0.5,
              }}
            >
              <Stack direction="row" spacing={0.25}>
                <Tooltip title="View"><IconButton size="small" sx={{ color: "#fff" }}><ZoomIn sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                <Tooltip title="Set Cover"><IconButton size="small" sx={{ color: "#fff" }} onClick={(e) => { e.stopPropagation(); handleSetCover(photo); }}>{photo.is_cover ? <Star sx={{ fontSize: 16, color: "#FCD34D" }} /> : <StarBorder sx={{ fontSize: 16 }} />}</IconButton></Tooltip>
                <Tooltip title="Download"><IconButton size="small" sx={{ color: "#fff" }} onClick={(e) => { e.stopPropagation(); handleDownload(photo); }}><Download sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                <Tooltip title="Delete"><IconButton size="small" sx={{ color: "#fff" }} onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}><Delete sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              </Stack>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Lightbox */}
      {lightboxIndex >= 0 && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(-1)}
        />
      )}
    </>
  );
}
