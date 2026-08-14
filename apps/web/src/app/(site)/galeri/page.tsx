import type { Metadata } from "next";
import Link from "next/link";
import { publicApi } from "@/lib/api";
import { AdSlot } from "@/components/ads/ad-slot";
import styles from "./archive.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Foto galeri",
  description: "Düzce Radikal fotoğraf galerileri",
};

/** Public foto galeri arşivi */
export default async function GaleriIndexPage() {
  let items: Awaited<ReturnType<typeof publicApi.articles.list>>["data"] = [];
  try {
    const res = await publicApi.articles.list({
      contentType: "galeri",
      limit: 24,
    });
    items = res.data;
  } catch {
    items = [];
  }

  return (
    <div className={styles.root}>
      <header className={styles.mast}>
        <div className={`yh-container ${styles.inner}`}>
          <p className={styles.kicker}>Görsel arşiv</p>
          <h1>Foto galeri</h1>
          <p className={styles.lead}>
            Haberlere ve özel albümlere eşlik eden fotoğraf galerileri.
          </p>
        </div>
      </header>

      <div className={`yh-container`}>
        <AdSlot code="gallery-slide" />
      </div>

      <div className={`yh-container ${styles.grid}`}>
        {items.map((a) => (
          <Link key={a.id} href={`/haber/${a.slug}`} className={styles.card}>
            <div className={styles.thumb}>
              {a.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.coverImage} alt="" loading="lazy" />
              ) : (
                <div className={styles.ph} />
              )}
            </div>
            <h2>{a.title}</h2>
            <p>{a.category.name}</p>
          </Link>
        ))}
        {!items.length ? (
          <p className={styles.empty}>Henüz yayında galeri yok.</p>
        ) : null}
      </div>
    </div>
  );
}
