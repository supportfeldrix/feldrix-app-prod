/**
 * Feldrix — Photo Lightbox
 * Full-screen photo viewer with next/prev/download/close.
 */

import { useState, useEffect } from "react";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { Close, ArrowBack, ArrowForward, Download } from "@mui/icons-material";
import { generateSignedUrl } from "../../services/photoService";

export default function PhotoLightbox({ photos, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const [url, setUrl] = useState(null);

  const photo = photos[index];

  useEffect(() => {
    if (!photo) return;
    generateSignedUrl(photo.storage_bucket, photo.storage_path).then(setUrl);
  }, [index, photo]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, photos.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [photos.length, onClose]);

  if (!photo) return null;

  return (
    <Box sx={{ position: "fixed", inset: 0, zIndex: 9999, bgcolor: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column" }} onClick={onClose}>
      {/* Top bar */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2 }} onClick={(e) => e.stopPropagation()}>
        <Typography sx={{ color: "#fff", fontSize: "0.8rem" }}>
          {photo.caption || photo.original_filename || `Photo ${index + 1}`}
        </Typography>
        <Stack direction="row" spacing={1}>
          <IconButton sx={{ color: "#fff" }} onClick={() => { if (url) { const a = document.createElement("a"); a.href = url; a.download = photo.original_filename || "photo"; a.click(); } }}>
            <Download />
          </IconButton>
          <IconButton sx={{ color: "#fff" }} onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
      </Stack>

      {/* Image */}
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", px: 2 }} onClick={(e) => e.stopPropagation()}>
        {url ? (
          <Box component="img" src={url} alt="" sx={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain", borderRadius: 2 }} />
        ) : (
          <Typography sx={{ color: "#fff" }}>Loading...</Typography>
        )}
      </Box>

      {/* Navigation */}
      <Stack direction="row" justifyContent="center" spacing={3} sx={{ pb: 3 }} onClick={(e) => e.stopPropagation()}>
        <IconButton sx={{ color: "#fff" }} disabled={index === 0} onClick={() => setIndex(index - 1)}>
          <ArrowBack />
        </IconButton>
        <Typography sx={{ color: "#fff", fontSize: "0.8rem", alignSelf: "center" }}>
          {index + 1} / {photos.length}
        </Typography>
        <IconButton sx={{ color: "#fff" }} disabled={index === photos.length - 1} onClick={() => setIndex(index + 1)}>
          <ArrowForward />
        </IconButton>
      </Stack>
    </Box>
  );
}
