import type { Metadata } from "next";
import Link from "next/link";
import styles from "../../yasal.module.css";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ token?: string }> };

export const metadata: Metadata = {
  title: "Bülten onayı",
  robots: { index: false, follow: false },
};

/**
 * E-posta çift onay (double opt-in) sayfası.
 */
export default async function NewsletterConfirmPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const API =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

  let state: "missing" | "ok" | "error" | "already" = "missing";

  if (token) {
    try {
      const res = await fetch(
        `${API}/newsletter/confirm?token=${encodeURIComponent(token)}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const data = (await res.json()) as { status?: string };
        state = data.status === "already_active" ? "already" : "ok";
      } else {
        state = "error";
      }
    } catch {
      state = "error";
    }
  }

  const copy = {
    missing: {
      title: "Eksik bağlantı",
      body: "Onay bağlantısı geçersiz görünüyor. Bültenden yeniden kayıt olun.",
    },
    ok: {
      title: "Abonelik onaylandı",
      body: "E-posta listenize eklendiniz. Günde en fazla bir özet alacaksınız.",
    },
    already: {
      title: "Zaten aktif",
      body: "Bu e-posta zaten bülten listesinde.",
    },
    error: {
      title: "Onaylanamadı",
      body: "Bağlantı süresi dolmuş veya kullanılmış olabilir. Yeniden kayıt deneyin.",
    },
  }[state];

  return (
    <div className={`yh-container ${styles.page}`}>
      <article className={styles.card}>
        <h1>{copy.title}</h1>
        <p>{copy.body}</p>
        <p className={styles.actions}>
          <Link href="/">Ana sayfa</Link>
          <Link href="/#bulten">Bültene dön</Link>
        </p>
      </article>
    </div>
  );
}
