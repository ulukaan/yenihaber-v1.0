import Link from "next/link";
import type { ApiArticle } from "@yenihaber/shared";
import { formatRelative } from "@/lib/api";
import styles from "./featured-rail.module.css";

export type FeaturedRailProps = {
  items: ApiArticle[];
  title?: string;
};

/**
 * Öne çıkanlar — numaralı, sıkı liste; manşet yan sütunu
 */
export function FeaturedRail({
  items,
  title = "Öne çıkanlar",
}: FeaturedRailProps) {
  if (!items.length) return null;

  return (
    <aside className={styles.rail} aria-label={title}>
      <h2 className={styles.head}>{title}</h2>
      <ul className={styles.list}>
        {items.map((a, i) => {
          const cover = a.coverImage11 || a.coverImage || a.coverImage169;
          const catColor = a.category.color?.trim() || "var(--yh-accent)";
          const last = i === items.length - 1;
          const dur =
            a.contentType === "video" && a.videoDuration
              ? `${Math.floor(a.videoDuration / 60)}:${String(
                  a.videoDuration % 60,
                ).padStart(2, "0")}`
              : null;
          return (
            <li
              key={a.id}
              className={last ? styles.rowLast : styles.row}
            >
              <Link href={`/haber/${a.slug}`} className={styles.link}>
                <span className={styles.idx} aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={styles.thumb}
                  style={!cover ? { background: catColor } : undefined}
                >
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" width={88} height={66} />
                  ) : null}
                </span>
                <span className={styles.text}>
                  <p className={styles.cat}>{a.category.name}</p>
                  <strong>{a.title}</strong>
                  <em>
                    {formatRelative(a.publishedAt) || "Az önce"}
                    {dur ? ` · ${dur}` : ""}
                  </em>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
