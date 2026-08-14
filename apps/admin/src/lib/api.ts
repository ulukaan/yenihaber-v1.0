import { API_BASE } from "@/lib/public-env";
import { createApiClient } from "@yenihaber/api-client";

const TOKEN_KEY = "yh_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** Admin paneli API istemcisi (token inject) */
export const adminApi = createApiClient({
  baseUrl: API_BASE,
  getToken,
});
