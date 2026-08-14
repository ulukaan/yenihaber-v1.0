import Link from "next/link";
import type { ApiTag } from "@yenihaber/shared";
import styles from "./featured-tags.module.css";

type Props = {
  tags: ApiTag[];
};

/** Manşet altı dosya takibi — 5–8 gündem etiket */
export function FeaturedTags({ tags }: Props) {
  if (!tags.length) return null;
  return (
    <nav className={styles.rail} aria-label="Gündemdekiler">
      <span className={styles.label}>Gündemdekiler</span>
      <ul className={styles.list}>
        {tags.map((t) => (
          <li key={t.id}>
            <Link href={`/etiket/${t.slug}`} className={styles.chip}>
              {t.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
