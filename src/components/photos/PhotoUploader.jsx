/**
 * Feldrix — Photo Uploader
 * Supports: file browse, drag & drop, mobile camera.
 * Reusable across all modules.
 */

import { useState, useRef } from "react";
import { Box, Button, CircularProgress, LinearProgress, Stack, Typography } from "@mui/material";
import { CameraAlt, CloudUpload, Image as ImageIcon } from "@mui/icons-material";
import toast from "react-hot-toast";
import { uploadPhoto } from "../../services/photoService";

export default function PhotoUploader({ module, recordId, category, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  async function handleFiles(files) {
    if (!files || files.length === 0) return;

    setUploading(true);
    setProgress(0);

    let uploaded = 0;
    const total = files.length;

    for (const file of Array.from(files)) {
      try {
        await uploadPhoto({
          file,
          module,
          recordId,
          category,
          uploadedFrom: "web",
        });
        uploaded++;
        setProgress(Math.round((uploaded / total) * 100));
      } catch (err) {
        toast.error(err.message || `Failed to upload ${file.name}`);
      }
    }

    if (uploaded > 0) {
      toast.success(`${uploaded} photo${uploaded !== 1 ? "s" : ""} uploaded.`);
      onUploaded?.();
    }

    setUploading(false);
    setProgress(0);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }

  return (
    <Box>
      {/* Drop Zone */}
      <Box
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        sx={{
          p: 3,
          border: "2px dashed",
          borderColor: dragOver ? "primary.main" : "divider",
          borderRadius: 3,
          bgcolor: dragOver ? "primary.50" : "grey.50",
          textAlign: "center",
          transition: "all 0.2s ease",
          cursor: "pointer",
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <Stack spacing={1.5} alignItems="center">
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">Uploading... {progress}%</Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ width: "100%", maxWidth: 200, borderRadius: 2 }} />
          </Stack>
        ) : (
          <Stack spacing={1} alignItems="center">
            <CloudUpload sx={{ fontSize: 36, color: "text.disabled" }} />
            <Typography variant="body2" fontWeight={600}>
              Drop photos here or click to browse
            </Typography>
            <Typography variant="caption" color="text.secondary">
              JPEG, PNG or WEBP — Max 10 MB
            </Typography>
          </Stack>
        )}
      </Box>

      {/* Action Buttons */}
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ImageIcon sx={{ fontSize: 16 }} />}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          sx={{ textTransform: "none", fontSize: "0.75rem", borderRadius: 2 }}
        >
          Browse
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<CameraAlt sx={{ fontSize: 16 }} />}
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
          sx={{ textTransform: "none", fontSize: "0.75rem", borderRadius: 2 }}
        >
          Camera
        </Button>
      </Stack>

      {/* Hidden Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
    </Box>
  );
}
