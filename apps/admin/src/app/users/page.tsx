"use client";

import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  KeyRound,
  LogOut,
  ShieldAlert,
  Trash2,
  UserPlus,
} from "lucide-react";
import type {
  AdminAuthorRow,
  AdminInviteRow,
  AdminUserRow,
  Role,
} from "@yenihaber/shared";
import { PANEL_ROLE_LABELS } from "@yenihaber/shared";
import { AdminShell } from "@/components/admin-shell/admin-shell";
import { AdminPage } from "@/components/admin-page/admin-page";
import { AdminButton } from "@/components/admin-page/admin-button";
import { useAuth } from "@/components/auth-provider/auth-provider";
import { adminApi } from "@/lib/api";
import styles from "./users.module.css";

type Tab = "users" | "authors" | "invites";

function parseTab(raw: string | null): Tab {
  if (raw === "authors" || raw === "invites" || raw === "users") return raw;
  return "users";
}

const ROLE_OPTIONS: Role[] = ["ADMIN", "EDITOR", "MUHABIR", "MODERATOR"];

const MATRIX: { key: string; label: string; roles: Role[] }[] = [
  {
    key: "write",
    label: "Haber yazar",
    roles: ["ADMIN", "EDITOR", "MUHABIR"],
  },
  { key: "publish", label: "Yayınlar", roles: ["ADMIN", "EDITOR"] },
  { key: "manset", label: "Manşet", roles: ["ADMIN", "EDITOR"] },
  {
    key: "mod",
    label: "Yorum",
    roles: ["ADMIN", "EDITOR", "MODERATOR"],
  },
  { key: "settings", label: "Ayarlar", roles: ["ADMIN"] },
];

function formatLastLogin(iso: string | null): string {
  if (!iso) return "Hiç";
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (d >= startToday) {
    return d.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (days === 1) return "Dün";
  if (days < 60) return `${days} gün önce`;
  return d.toLocaleDateString("tr-TR");
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toLocaleUpperCase("tr-TR") ?? "")
    .join("");
}

function inviteStatusLabel(s: AdminInviteRow["status"]) {
  if (s === "kabul") return "Kabul edildi";
  if (s === "suresi_doldu") return "Süresi doldu";
  return "Bekliyor";
}

export default function UsersAdminPage() {
  return (
    <Suspense
      fallback={
        <AdminShell>
          <p className={styles.muted}>Yükleniyor…</p>
        </AdminShell>
      }
    >
      <UsersAdminPageInner />
    </Suspense>
  );
}

function UsersAdminPageInner() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [authors, setAuthors] = useState<AdminAuthorRow[]>([]);
  const [invites, setInvites] = useState<AdminInviteRow[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("MUHABIR");
  const [inviteLink, setInviteLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState("");

  function setTab(next: Tab) {
    router.push(`/users?tab=${next}`);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "users") setUsers(await adminApi.users.list());
      if (tab === "authors") setAuthors(await adminApi.users.authors());
      if (tab === "invites") setInvites(await adminApi.users.invites());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendInvite(e: FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    setBusy(true);
    setError("");
    setOk("");
    setInviteLink("");
    try {
      const res = await adminApi.users.createInvite({
        email: inviteEmail.trim(),
        role: inviteRole as "ADMIN" | "EDITOR" | "MUHABIR" | "MODERATOR",
      });
      setOk(`Davet gönderildi: ${res.email} (7 gün geçerli)`);
      setInviteLink(res.acceptUrl ?? "");
      setInviteEmail("");
      setInvites(await adminApi.users.invites());
      setTab("invites");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Davet başarısız");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(row: AdminUserRow, status: "aktif" | "askida") {
    if (!isAdmin) return;
    setBusy(true);
    try {
      const updated = await adminApi.users.update(row.id, { status });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setOk(
        status === "askida"
          ? "Hesap pasife alındı (giriş kapalı, haberler duruyor)"
          : "Hesap aktif",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Güncellenemedi");
    } finally {
      setBusy(false);
    }
  }

  async function setRole(row: AdminUserRow, role: Role) {
    if (!isAdmin || row.role === role) return;
    setBusy(true);
    try {
      const updated = await adminApi.users.update(row.id, {
        role: role as "ADMIN" | "EDITOR" | "MUHABIR" | "MODERATOR",
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setOk("Rol güncellendi (Loglar’a yazıldı)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rol değişmedi");
    } finally {
      setBusy(false);
    }
  }

  async function sendReset(row: AdminUserRow) {
    if (!isAdmin) return;
    setBusy(true);
    setError("");
    try {
      const res = await adminApi.users.sendReset(row.id);
      setOk(res.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gönderilemedi");
    } finally {
      setBusy(false);
    }
  }

  async function logoutAll(row: AdminUserRow) {
    if (!isAdmin) return;
    if (
      !window.confirm(
        `${row.name} hesabının tüm oturumları sonlandırılsın mı?`,
      )
    )
      return;
    setBusy(true);
    try {
      const res = await adminApi.users.logoutAll(row.id);
      setOk(`${res.revoked} oturum sonlandırıldı`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Başarısız");
    } finally {
      setBusy(false);
    }
  }

  async function deleteUser(row: AdminUserRow) {
    if (!isAdmin || row.id === user?.id) return;
    let transferAuthorId: string | undefined;
    if (row.articleCount > 0) {
      const okTransfer = window.confirm(
        `${row.name} hesabının ${row.articleCount} haberi var.\n\n` +
          `Haberler yazar profilinde kalır, hesap silinir.\n` +
          `Devam etmek istiyor musunuz?\n\n` +
          `(Varsayılan aksiyon “Pasife al”dır — silmek için Tamam.)`,
      );
      if (!okTransfer) return;
      const list =
        authors.length > 0 ? authors : await adminApi.users.authors();
      const example = list.find((a) => a.id !== row.authorId);
      const slug = window.prompt(
        `İsteğe bağlı: haberleri başka yazara devret.\n` +
          `Yazar slug yazın veya boş bırakın (künye mevcut profilde kalır).\n` +
          (example ? `Örn: ${example.slug}` : ""),
        "",
      );
      if (slug?.trim()) {
        const target = list.find((a) => a.slug === slug.trim());
        if (!target) {
          setError("Hedef yazar slug bulunamadı");
          return;
        }
        transferAuthorId = target.id;
      }
    } else if (
      !window.confirm(
        `${row.name} kalıcı silinsin mi? Yazar profili ve haberler korunur.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await adminApi.users.remove(row.id, { transferAuthorId });
      setUsers((prev) => prev.filter((u) => u.id !== row.id));
      setOk("Hesap silindi (Loglar’a yazıldı)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi");
    } finally {
      setBusy(false);
    }
  }

  async function createAuthorOnly(e: FormEvent) {
    e.preventDefault();
    if (!newAuthorName.trim()) return;
    setBusy(true);
    try {
      await adminApi.users.createAuthor({ displayName: newAuthorName.trim() });
      setNewAuthorName("");
      setAuthors(await adminApi.users.authors());
      setOk("Yazar profili eklendi (panel hesabı yok — misafir/dış yazar)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Oluşturulamadı");
    } finally {
      setBusy(false);
    }
  }

  async function setAuthorStatus(
    row: AdminAuthorRow,
    status: "yayinda" | "gizli",
  ) {
    setBusy(true);
    setError("");
    try {
      const updated = await adminApi.users.updateAuthor(row.id, { status });
      setAuthors((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setOk(status === "yayinda" ? "Yazar yayında" : "Yazar gizlendi (sitede görünmez)");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Durum güncellenemedi");
    } finally {
      setBusy(false);
    }
  }

  async function sendAuthorReset(row: AdminAuthorRow) {
    if (!isAdmin || !row.user) return;
    setBusy(true);
    setError("");
    try {
      const res = await adminApi.users.sendReset(row.user.id);
      setOk(res.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gönderilemedi");
    } finally {
      setBusy(false);
    }
  }

  async function deleteAuthor(row: AdminAuthorRow) {
    if (!isAdmin) return;
    let transferAuthorId: string | undefined;
    if (row.articleCount > 0) {
      const proceed = window.confirm(
        `${row.displayName} profilinin ${row.articleCount} haberi var.\n\n` +
          `Silmek için haberleri başka yazara devretmeniz gerekir.\n` +
          `Devam edilsin mi?`,
      );
      if (!proceed) return;
      const list =
        authors.length > 0 ? authors : await adminApi.users.authors();
      const example = list.find((a) => a.id !== row.id);
      const slug = window.prompt(
        `Haberlerin gideceği yazar slug’ını yazın (zorunlu).\n` +
          (example ? `Örn: ${example.slug}` : ""),
        "",
      );
      if (!slug?.trim()) {
        setError("Devretme iptal — slug gerekli");
        return;
      }
      const target = list.find((a) => a.slug === slug.trim());
      if (!target) {
        setError("Hedef yazar slug bulunamadı");
        return;
      }
      transferAuthorId = target.id;
    } else if (
      !window.confirm(
        `${row.displayName} yazar profili kalıcı silinsin mi?` +
          (row.user
            ? `\nBağlı panel hesabı (${row.user.email}) silinmez.`
            : ""),
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await adminApi.users.deleteAuthor(row.id, { transferAuthorId });
      setAuthors((prev) => prev.filter((a) => a.id !== row.id));
      setOk("Yazar profili silindi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Silinemedi");
    } finally {
      setBusy(false);
    }
  }

  async function resendInvite(id: string) {
    setBusy(true);
    try {
      const res = await adminApi.users.resendInvite(id);
      setInviteLink(res.acceptUrl ?? "");
      setOk(`${res.email} — davet yeniden gönderildi (7 gün)`);
      setInvites(await adminApi.users.invites());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tekrar gönderilemedi");
    } finally {
      setBusy(false);
    }
  }

  async function cancelInvite(id: string) {
    if (!window.confirm("Davet iptal edilsin mi?")) return;
    setBusy(true);
    try {
      await adminApi.users.deleteInvite(id);
      setInvites(await adminApi.users.invites());
      setOk("Davet iptal edildi");
    } catch (e) {
      setError(e instanceof Error ? e.message : "İptal edilemedi");
    } finally {
      setBusy(false);
    }
  }

  const titles: Record<Tab, { h: string; p: string }> = {
    users: {
      h: "Kullanıcılar",
      p: "Aktif/pasif anahtar · şifre sıfırlama · oturum kapat · sil. Şifreyi admin yazmaz; link gider.",
    },
    authors: {
      h: "Yazar profilleri",
      p: "Yayında/gizli anahtar · sil · hesaplıysa şifre sıfırlama. Misafir yazar hesap zorunlu değil.",
    },
    invites: {
      h: "Davetler",
      p: "Henüz hesabı olmayan kişiler · e-posta + rol, 7 gün geçerli link, kendi şifresini kurar.",
    },
  };

  return (
    <AdminShell>
      <AdminPage
        title={titles[tab].h}
        subtitle={titles[tab].p}
        wide
        actions={
          isAdmin && tab !== "authors" ? (
            <AdminButton variant="primary" onClick={() => setTab("invites")}>
              <UserPlus size={18} aria-hidden />
              Kullanıcı davet et
            </AdminButton>
          ) : null
        }
      >
        <nav className={styles.tabs} aria-label="Kişiler sekmeleri">
          <Link
            href="/users?tab=users"
            className={tab === "users" ? styles.tabOn : styles.tab}
          >
            Kullanıcılar
          </Link>
          <Link
            href="/users?tab=authors"
            className={tab === "authors" ? styles.tabOn : styles.tab}
          >
            Yazar profilleri
          </Link>
          {isAdmin ? (
            <Link
              href="/users?tab=invites"
              className={tab === "invites" ? styles.tabOn : styles.tab}
            >
              Davetler
            </Link>
          ) : null}
        </nav>

        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
        {ok ? <p className={styles.ok}>{ok}</p> : null}
        {loading ? <p className={styles.muted}>Yükleniyor…</p> : null}

        {tab === "users" && !loading ? (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Kişi</th>
                    <th>E-posta</th>
                    <th>Rol</th>
                    <th>Durum</th>
                    <th>Son giriş</th>
                    <th>Haber</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {users.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className={styles.person}>
                          {row.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.avatarUrl}
                              alt=""
                              className={styles.avatar}
                            />
                          ) : (
                            <span className={styles.avatarFall} aria-hidden>
                              {initials(row.name)}
                            </span>
                          )}
                          <div>
                            <strong>{row.name}</strong>
                            {row.staleLogin ? (
                              <span className={styles.stale}>
                                <ShieldAlert size={12} /> 90 gündür giriş yok
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className={styles.emailCell}>{row.email}</td>
                      <td>
                        {isAdmin ? (
                          <select
                            className={styles.roleSelect}
                            value={
                              row.role === "YAZAR" ? "MUHABIR" : row.role
                            }
                            disabled={busy || row.id === user?.id}
                            onChange={(e) =>
                              void setRole(row, e.target.value as Role)
                            }
                            aria-label="Rol"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r} value={r}>
                                {PANEL_ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={styles.badge}>
                            {PANEL_ROLE_LABELS[row.role] ?? row.role}
                          </span>
                        )}
                      </td>
                      <td>
                        {isAdmin && row.id !== user?.id ? (
                          <button
                            type="button"
                            className={styles.switch}
                            role="switch"
                            aria-checked={row.status === "aktif"}
                            aria-label={`${row.name} hesabı ${row.status === "aktif" ? "aktif" : "pasif"}`}
                            data-on={row.status === "aktif" ? "1" : "0"}
                            disabled={busy}
                            onClick={() =>
                              void setStatus(
                                row,
                                row.status === "aktif" ? "askida" : "aktif",
                              )
                            }
                          >
                            <span className={styles.switchKnob} aria-hidden />
                            <span className={styles.switchLabel}>
                              {row.status === "aktif" ? "Aktif" : "Pasif"}
                            </span>
                          </button>
                        ) : (
                          <span
                            className={
                              row.status === "aktif"
                                ? styles.dotOk
                                : styles.dotWarn
                            }
                          >
                            {row.status === "aktif" ? "Aktif" : "Pasif"}
                          </span>
                        )}
                      </td>
                      <td>{formatLastLogin(row.lastLoginAt)}</td>
                      <td className={styles.num}>{row.articleCount}</td>
                      <td className={styles.rowActions}>
                        {isAdmin && row.id !== user?.id ? (
                          <>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              disabled={busy}
                              title="Şifre sıfırlama bağlantısı gönder"
                              aria-label={`${row.name} için şifre sıfırlama`}
                              onClick={() => void sendReset(row)}
                            >
                              <KeyRound size={16} aria-hidden />
                              Şifre
                            </button>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              disabled={busy}
                              title="Tüm oturumları sonlandır"
                              aria-label={`${row.name} oturumlarını kapat`}
                              onClick={() => void logoutAll(row)}
                            >
                              <LogOut size={16} aria-hidden />
                              Oturum
                            </button>
                            <button
                              type="button"
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              disabled={busy}
                              title="Hesabı sil"
                              aria-label={`${row.name} hesabını sil`}
                              onClick={() => void deleteUser(row)}
                            >
                              <Trash2 size={16} aria-hidden />
                              Sil
                            </button>
                          </>
                        ) : row.id === user?.id ? (
                          <span className={styles.meta}>Siz</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <section className={styles.matrix} aria-labelledby="rol-matrix">
              <h2 id="rol-matrix">Rol yetkileri</h2>
              <p className={styles.matrixHint}>
                Muhabir kendi haberini yayınlamaz; taslak/onaya gönderir, editör
                onaylar.
              </p>
              <table className={styles.matrixTable}>
                <thead>
                  <tr>
                    <th />
                    {ROLE_OPTIONS.map((r) => (
                      <th key={r}>{PANEL_ROLE_LABELS[r]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MATRIX.map((m) => (
                    <tr key={m.key}>
                      <td>{m.label}</td>
                      {ROLE_OPTIONS.map((r) => (
                        <td key={r} className={styles.matrixCell}>
                          {m.roles.includes(r) ? (
                            <Check size={16} className={styles.faOk} />
                          ) : (
                            <span className={styles.dash}>—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        ) : null}

        {tab === "authors" && !loading ? (
          <>
            <form className={styles.inlineForm} onSubmit={createAuthorOnly}>
              <label>
                Hesapsız yazar (ajans / misafir)
                <input
                  value={newAuthorName}
                  onChange={(e) => setNewAuthorName(e.target.value)}
                  placeholder="Haber Merkezi"
                  aria-label="Yazar adı"
                />
              </label>
              <button
                type="submit"
                className={styles.secondaryBtn}
                disabled={busy}
              >
                Profil ekle
              </button>
            </form>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Profil</th>
                    <th>Panel hesabı</th>
                    <th>Durum</th>
                    <th>Haber</th>
                    <th>Köşe</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {authors.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className={styles.person}>
                          {a.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={a.photoUrl}
                              alt=""
                              className={styles.avatar}
                            />
                          ) : (
                            <span className={styles.avatarFall} aria-hidden>
                              {initials(a.displayName)}
                            </span>
                          )}
                          <div>
                            <strong>{a.displayName}</strong>
                            <span className={styles.meta}>
                              /yazar/{a.slug}
                              {a.title ? ` · ${a.title}` : ""}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {a.user ? (
                          <span className={styles.meta}>{a.user.email}</span>
                        ) : (
                          <span className={styles.badge}>Hesapsız</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.switch}
                          role="switch"
                          aria-checked={a.status === "yayinda"}
                          aria-label={`${a.displayName} ${a.status === "yayinda" ? "yayında" : "gizli"}`}
                          data-on={a.status === "yayinda" ? "1" : "0"}
                          disabled={busy}
                          onClick={() =>
                            void setAuthorStatus(
                              a,
                              a.status === "yayinda" ? "gizli" : "yayinda",
                            )
                          }
                        >
                          <span className={styles.switchKnob} aria-hidden />
                          <span className={styles.switchLabel}>
                            {a.status === "yayinda" ? "Yayında" : "Gizli"}
                          </span>
                        </button>
                      </td>
                      <td className={styles.num}>{a.articleCount}</td>
                      <td>
                        {a.isColumnist ? (
                          <Check size={16} className={styles.faOk} />
                        ) : (
                          <span className={styles.dash}>—</span>
                        )}
                      </td>
                      <td className={styles.rowActions}>
                        {isAdmin && a.user ? (
                          <button
                            type="button"
                            className={styles.iconBtn}
                            disabled={busy || a.user.id === user?.id}
                            title="Bağlı hesabın şifresini sıfırla"
                            aria-label={`${a.displayName} şifre sıfırlama`}
                            onClick={() => void sendAuthorReset(a)}
                          >
                            <KeyRound size={16} aria-hidden />
                            Şifre
                          </button>
                        ) : null}
                        {isAdmin ? (
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            disabled={busy}
                            title="Yazar profilini sil"
                            aria-label={`${a.displayName} profilini sil`}
                            onClick={() => void deleteAuthor(a)}
                          >
                            <Trash2 size={16} aria-hidden />
                            Sil
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {tab === "invites" && !loading ? (
          <>
            {isAdmin ? (
              <form className={styles.inviteForm} onSubmit={sendInvite}>
                <label>
                  E-posta
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="ornek@duzceradikal.com"
                  />
                </label>
                <label>
                  Rol
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as Role)}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {PANEL_ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={busy}
                >
                  Davet gönder (7 gün)
                </button>
              </form>
            ) : null}
            {inviteLink ? (
              <p className={styles.inviteLink}>
                Tek kullanımlık link (mail log / SMTP):{" "}
                <code>{inviteLink}</code>
              </p>
            ) : null}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>E-posta</th>
                    <th>Rol</th>
                    <th>Durum</th>
                    <th>Bitiş</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {invites.map((i) => (
                    <tr key={i.id}>
                      <td>{i.email}</td>
                      <td>{PANEL_ROLE_LABELS[i.role]}</td>
                      <td>
                        <span
                          className={
                            i.status === "bekliyor"
                              ? styles.dotWarn
                              : i.status === "kabul"
                                ? styles.dotOk
                                : styles.dash
                          }
                        >
                          {inviteStatusLabel(i.status)}
                        </span>
                      </td>
                      <td>
                        {new Date(i.expiresAt).toLocaleDateString("tr-TR")}
                      </td>
                      <td className={styles.rowActions}>
                        {i.status !== "kabul" ? (
                          <>
                            <button
                              type="button"
                              className={styles.linkBtn}
                              disabled={busy}
                              onClick={() => void resendInvite(i.id)}
                            >
                              Tekrar gönder
                            </button>
                            <button
                              type="button"
                              className={styles.dangerLink}
                              disabled={busy}
                              onClick={() => void cancelInvite(i.id)}
                            >
                              İptal
                            </button>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {!invites.length ? (
                    <tr>
                      <td colSpan={5} className={styles.muted}>
                        Davet yok
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </AdminPage>
    </AdminShell>
  );
}
