import type { Role } from "@yenihaber/shared";
import { STAFF_ROLES } from "@yenihaber/shared";
import { resolveAdminOrigin } from "@yenihaber/config";

/**
 * Giriş sonrası hedef — personel panele (token handoff), üye hesabına.
 * Canlıda localhost:3001 üretilmez.
 */
export function resolvePostAuthDestination(
  role: Role,
  token?: string,
): string {
  if (STAFF_ROLES.includes(role)) {
    const admin = resolveAdminOrigin();
    if (!admin) return "/hesabim";
    if (token) {
      return `${admin}/auth/handoff#t=${encodeURIComponent(token)}`;
    }
    return admin;
  }
  return "/hesabim";
}

export function isStaffRole(role: Role | string | undefined): boolean {
  if (!role) return false;
  return (STAFF_ROLES as string[]).includes(role);
}

export function applyPostAuthNavigation(
  role: Role,
  navigate: (path: string) => void,
  token?: string,
) {
  const dest = resolvePostAuthDestination(role, token);
  if (/^https?:\/\//i.test(dest)) {
    window.location.assign(dest);
    return;
  }
  navigate(dest);
}
