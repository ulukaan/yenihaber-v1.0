import type { Metadata } from "next";
import Link from "next/link";
import { publicApi } from "@/lib/api";
import styles from "../galeri/archive.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Video",
  description: "Düzce Radikal video haberleri",
};

/** Public video arşivi */
export default async function VideoIndexPage() {
  let items: Awaited<ReturnType<typeof publicApi.articles.list>>["data"] = [];
  try {
    const res = await publicApi.articles.list({
      contentType: "video",
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
          <p className={styles.kicker}>Video arşiv</p>
          <h1>Videolar</h1>
          <p className={styles.lead}>
            YouTube ve Vimeo üzerinden yayınlanan video haberler.
          </p>
        </div>
      </header>

      <div className={`yh-container ${styles.grid}`}>
        {items.map((a) => (
          <Link key={a.id} href={`/haber/${a.slug}`} className={styles.card}>
            <div className={styles.thumb}>
              {a.videoPoster || a.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.videoPoster || a.coverImage || ""}
                  alt=""
                  loading="lazy"
                />
              ) : (
                <div className={styles.ph} />
              )}
              {a.videoIsLive ? (
                <span className={styles.live}>Canlı</span>
              ) : null}
            </div>
            <h2>{a.title}</h2>
            <p>{a.category.name}</p>
          </Link>
        ))}
        {!items.length ? (
          <p className={styles.empty}>Henüz yayında video yok.</p>
        ) : null}
      </div>
    </div>
  );
}
