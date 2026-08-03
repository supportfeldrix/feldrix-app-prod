/**
 * ============================================================
 * Feldrix Control Centre — Auth Service
 * Sprint 46.2
 *
 * Verifies admin access. Does NOT create a separate login flow.
 * ============================================================
 */

import { supabase } from "../../supabaseClient";
import { ADMIN_ROLES } from "../utils/adminConstants";

/**
 * Returns the current user's admin profile if they have an admin role.
 * Returns null if not authenticated or not an admin.
 */
export async function getAdminSession() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, farm_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) return null;
    if (!ADMIN_ROLES.includes(profile.role)) return null;

    return {
      id: profile.id,
      name: profile.full_name || user.email?.split("@")[0] || "Admin",
      email: profile.email || user.email,
      role: profile.role,
    };
  } catch {
    return null;
  }
}

/**
 * Checks if the current user has admin access (any admin role).
 */
export async function isAdminUser() {
  const session = await getAdminSession();
  return session !== null;
}

/**
 * Signs the admin out.
 */
export async function adminLogout() {
  await supabase.auth.signOut();
}
