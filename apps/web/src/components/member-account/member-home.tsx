"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMemberSession } from "@/hooks/use-member-session";
import { isStaffRole } from "@/lib/post-login";
import {
  listFollows,
  listSaved,
  type FollowedAuthor,
  type SavedArticle,
} from "@/lib/member-prefs";
import { resolveAdminOrigin } from "@yenihaber/config";
import { memberDisplayRole } from "./member-shell";
import styles from "./member-shell.module.css";

/** Üye özet panosu */
export function MemberHome() {
  const { user } = useMemberSession();
  const [saved, setSaved] = useState<SavedArticle[]>([]);
  const [follows, setFollows] = useState<FollowedAuthor[]>([]);

  useEffect(() => {
    function sync() {
      setSaved(listSaved());
      setFollows(listFollows());
    }
    sync();
    window.addEventListener("yh-member-prefs", sync);
    return () => window.removeEventListener("yh-member-prefs", sync);
  }, []);

  if (!user) return null;

  const recent = saved.slice(0, 4);

  return (
    <div>
      <div className={styles.grid}>
        <div className={styles.stat}>
          <strong>{saved.length}</strong>
          <span>Kayıtlı haber</span>
        </div>
        <div className={styles.stat}>
          <strong>{follows.length}</strong>
          <span>Takip edilen</span>
        </div>
        <div className={styles.stat}>
          <strong style={{ fontSize: "1.15rem" }}>{memberDisplayRole(user)}</strong>
          <span>Üyelik</span>
        </div>
      </div>

      {isStaffRole(user.role) && resolveAdminOrigin() ? (
        <div className={styles.staffBox}>
          <p>
            Personel hesabısınız. Yayın ve yönetim için editör paneline gidin.
          </p>
          <a
            className={`${styles.btn} ${styles.btnPrimary}`}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              const admin = resolveAdminOrigin();
              if (!admin) return;
              const token =
                localStorage.getItem("yh-web-token") ??
                sessionStorage.getItem("yh-web-token");
              const dest = token
                ? `${admin}/auth/handoff#t=${encodeURIComponent(token)}`
                : admin;
              window.location.assign(dest);
            }}
          >
            Editör paneline git
          </a>
        </div>
      ) : isStaffRole(user.role) ? (
        <div className={styles.staffBox}>
          <p>
            Personel hesabısınız. Panel adresi tanımlı değil; üye hesabınızdan
            devam edin.
          </p>
        </div>
      ) : (
        <div className={styles.staffBox}>
          <p>
            Haberi buradan yazıp editör onayına gönderebilirsiniz. Onaylanınca
            sitede yayınlanır ve e-posta alırsınız.
          </p>
          <Link
            href="/hesabim/haber-gonder"
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            Haber gönder
          </Link>
        </div>
      )}

      <section style={{ marginTop: 28 }}>
        <h2 className={styles.sectionTitle}>Son kaydettikleriniz</h2>
        {recent.length === 0 ? (
          <div className={styles.empty}>
            <p>Henüz haber kaydetmediniz. Okurken «Kaydet» ile ekleyebilirsiniz.</p>
            <Link href="/" className={`${styles.btn} ${styles.btnPrimary}`}>
              Haberlere git
            </Link>
          </div>
        ) : (
          <ul className={styles.list}>
            {recent.map((item) => (
              <li key={item.slug} className={styles.row}>
                {item.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.rowMedia}
                    src={item.coverImage}
                    alt=""
                  />
                ) : (
                  <div className={styles.rowMedia} aria-hidden />
                )}
                <div>
                  <Link href={`/haber/${item.slug}`} className={styles.rowTitle}>
                    {item.title}
                  </Link>
                  <p className={styles.rowMeta}>
                    {item.categoryName || "Haber"}
                  </p>
                </div>
                <div className={styles.rowActions} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className={styles.quickLinks}>
        <Link href="/hesabim/haberler">Tüm kayıtlılar</Link>
        <Link href="/hesabim/takip" className="ghost">
          Takip listesi
        </Link>
        <Link href="/yazarlar" className="ghost">
          Yazarları keşfet
        </Link>
      </div>
    </div>
  );
}
