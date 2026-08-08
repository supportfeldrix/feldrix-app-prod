/**
 * Feldrix — Photo Section
 * Combined uploader + gallery component for use in any module.
 * Drop this into any profile/detail page.
 */

import { useState } from "react";
import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import { CameraAlt } from "@mui/icons-material";
import PhotoUploader from "./PhotoUploader";
import PhotoGallery from "./PhotoGallery";

export default function PhotoSection({ module, recordId, title = "Photos", category }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Card elevation={2} sx={{ borderRadius: 3, mt: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <CameraAlt color="primary" sx={{ fontSize: 24 }} />
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
        </Stack>

        <PhotoUploader
          module={module}
          recordId={recordId}
          category={category}
          onUploaded={() => setRefreshKey((k) => k + 1)}
        />

        <Divider sx={{ my: 2.5 }} />

        <PhotoGallery
          module={module}
          recordId={recordId}
          refreshKey={refreshKey}
        />
      </CardContent>
    </Card>
  );
}
