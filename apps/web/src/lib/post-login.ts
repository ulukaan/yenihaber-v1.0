import type { Role } from "@yenihaber/shared";
import { STAFF_ROLES } from "@yenihaber/shared";

const DEFAULT_ADMIN =
  process.env.NEXT_PUBLIC_ADMIN_URL?.replace(/\/$/, "") ||
  "http://localhost:3001";

/**
 * Giriş sonrası hedef — personel panele (token handoff), üye hesabına.
 */
export function resolvePostAuthDestination(
  role: Role,
  token?: string,
): string {
  if (STAFF_ROLES.includes(role)) {
    if (token) {
      return `${DEFAULT_ADMIN}/auth/handoff#t=${encodeURIComponent(token)}`;
    }
    return DEFAULT_ADMIN;
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
