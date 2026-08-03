/**
 * ============================================================
 * Feldrix Control Centre — Permissions Hook
 * Sprint 46.2
 *
 * Returns the permission set for the current admin's role.
 * ============================================================
 */

import { useMemo } from "react";
import { PERMISSION_MATRIX } from "../utils/adminConstants";
import { useAdminContext } from "../context/AdminContext";

export function useAdminPermissions() {
  const { admin } = useAdminContext();
  const role = admin?.role || "readonly";

  const permissions = useMemo(() => {
    return PERMISSION_MATRIX[role] || PERMISSION_MATRIX.readonly;
  }, [role]);

  return permissions;
}
