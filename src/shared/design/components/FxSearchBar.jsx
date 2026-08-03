/**
 * Feldrix Design System — FxSearchBar
 * Consistent search input used across both apps.
 */

import { TextField, InputAdornment } from "@mui/material";
import { Search } from "@mui/icons-material";
import { radius, semantic } from "../tokens";

export default function FxSearchBar({ value, onChange, placeholder = "Search...", maxWidth = 320, sx = {} }) {
  return (
    <TextField
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size="small"
      sx={{
        flex: 1,
        maxWidth: { sm: maxWidth },
        "& .MuiOutlinedInput-root": {
          borderRadius: radius.md,
          bgcolor: "#fff",
          fontSize: "0.85rem",
        },
        ...sx,
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search sx={{ fontSize: 18, color: semantic.textSecondary }} />
          </InputAdornment>
        ),
      }}
    />
  );
}
