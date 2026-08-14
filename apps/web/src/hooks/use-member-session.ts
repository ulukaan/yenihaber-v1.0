"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiUser } from "@yenihaber/shared";
import { clearSession, getStoredUser } from "@/lib/client-api";

export function useMemberSession() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setUser(getStoredUser<ApiUser>());
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("yh-session", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("yh-session", refresh);
    };
  }, [refresh]);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    window.dispatchEvent(new Event("yh-session"));
  }, []);

  return { user, ready, refresh, logout, isLoggedIn: Boolean(user) };
}
