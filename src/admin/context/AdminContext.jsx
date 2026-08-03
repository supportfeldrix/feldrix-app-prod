/**
 * ============================================================
 * Feldrix Control Centre — Admin Context (Production)
 * Sprint 46.3
 *
 * Provides admin session, permissions, and loading state.
 * Distinguishes between "not logged in" and "logged in but not admin".
 * ============================================================
 */

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { getAdminSession, adminLogout } from "../services/adminAuthService";
import { PERMISSION_MATRIX } from "../utils/adminConstants";
import { supabase } from "../../supabaseClient";

const AdminContext = createContext({
  admin: null,
  permissions: {},
  isLoading: true,
  isAuthenticated: false, // true = Supabase session exists (any role)
  isAdmin: false,         // true = has an admin role
  logout: () => {},
  refresh: () => {},
});

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      // First check if ANY session exists (farmer or admin)
      const { data: { user } } = await supabase.auth.getUser();
      setHasSession(!!user);

      if (!user) {
        setAdmin(null);
        return;
      }

      // Then check if it's an admin session
      const session = await getAdminSession();
      setAdmin(session);
    } catch {
      setAdmin(null);
      setHasSession(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const logout = useCallback(async () => {
    await adminLogout();
    setAdmin(null);
    setHasSession(false);
  }, []);

  const permissions = useMemo(() => {
    if (!admin?.role) return {};
    return PERMISSION_MATRIX[admin.role] || {};
  }, [admin?.role]);

  const value = useMemo(
    () => ({
      admin,
      permissions,
      isLoading,
      isAuthenticated: hasSession,  // Has Supabase session (any role)
      isAdmin: admin !== null,      // Has admin role specifically
      logout,
      refresh: loadSession,
    }),
    [admin, permissions, isLoading, hasSession, logout, loadSession]
  );

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminContext() {
  return useContext(AdminContext);
}

export default AdminContext;
