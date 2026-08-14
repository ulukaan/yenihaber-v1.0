"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMemberSession } from "@/hooks/use-member-session";
import { memberDisplayRole } from "./member-shell";
import styles from "./member-shell.module.css";

/** Basit profil / tercihler */
export function MemberSettings() {
  const { user, logout } = useMemberSession();
  const router = useRouter();
  const [themeNote, setThemeNote] = useState("");

  if (!user) return null;

  function onLogout() {
    logout();
    router.push("/");
    router.refresh();
  }

  function toggleTheme() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    localStorage.setItem("yh-theme", next ? "dark" : "light");
    setThemeNote(next ? "Koyu tema açıldı." : "Açık tema açıldı.");
  }

  return (
    <div className={styles.form}>
      <h2 className={styles.sectionTitle}>Profil</h2>
      <label className={styles.field}>
        <span>Ad soyad</span>
        <input type="text" value={user.name} readOnly aria-readonly="true" />
        <em>Şimdilik salt okunur</em>
      </label>
      <label className={styles.field}>
        <span>E-posta</span>
        <input type="email" value={user.email} readOnly aria-readonly="true" />
      </label>
      <label className={styles.field}>
        <span>Üyelik tipi</span>
        <input
          type="text"
          value={memberDisplayRole(user)}
          readOnly
          aria-readonly="true"
        />
      </label>

      <h2 className={styles.sectionTitle} style={{ marginTop: 12 }}>
        Tercihler
      </h2>
      <p className={styles.hint}>
        Tema sitesinin üst barından da değiştirilebilir.
      </p>
      <button type="button" className={styles.btn} onClick={toggleTheme}>
        Temayı değiştir
      </button>
      {themeNote ? <p className={styles.hint}>{themeNote}</p> : null}

      <h2 className={styles.sectionTitle} style={{ marginTop: 12 }}>
        Oturum
      </h2>
      <button
        type="button"
        className={`${styles.btn} ${styles.btnDanger}`}
        onClick={onLogout}
        aria-label="Hesaptan çıkış yap"
      >
        Çıkış yap
      </button>
      <p className={styles.hint}>
        <Link href="/">Siteye dön</Link>
      </p>
    </div>
  );
}
