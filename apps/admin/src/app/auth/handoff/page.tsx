"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { STAFF_ROLES, type Role } from "@yenihaber/shared";
import { adminApi, setToken } from "@/lib/api";
import { useAuth } from "@/components/auth-provider/auth-provider";

/**
 * Site girişinden gelen JWT’yi paneli oturumuna yazar.
 * URL: /auth/handoff#t=<token>
 */
export default function AuthHandoffPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      const raw = hash.startsWith("#") ? hash.slice(1) : hash;
      const params = new URLSearchParams(raw);
      const token = params.get("t")?.trim();

      // URL’den token’ı temizle (geçmiş / referrer sızıntısı azalt)
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", "/auth/handoff");
      }

      if (!token) {
        setError("Oturum anahtarı yok");
        router.replace("/login");
        return;
      }

      setToken(token);
      try {
        const me = await adminApi.auth.me();
        if (cancelled) return;
        if (!(STAFF_ROLES as string[]).includes(me.role as Role)) {
          setToken(null);
          setError("Panel yetkisi yok");
          router.replace("/login");
          return;
        }
        await refresh();
        router.replace("/dashboard");
      } catch {
        if (cancelled) return;
        setToken(null);
        setError("Oturum geçersiz");
        router.replace("/login");
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [refresh, router]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui, sans-serif",
        color: "#2B2D42",
      }}
    >
      <p>{error || "Panele yönlendiriliyor…"}</p>
    </main>
  );
}
