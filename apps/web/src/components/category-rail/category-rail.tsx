import Link from "next/link";
import type { CSSProperties } from "react";
import { ArticleCard, SectionHeader } from "@yenihaber/ui";
import type { ApiArticle } from "@yenihaber/shared";
import { HOME_RAIL_MIN_ARTICLES } from "@yenihaber/shared";
import { formatRelative } from "@/lib/api";
import { Copy } from "@/lib/copy";
import { categoryThemeColor } from "@/lib/category-theme";
import styles from "./category-rail.module.css";

/** Geri uyumluluk — layout artık tek asimetrik form */
export type CategoryRailVariant =
  | "hero"
  | "split"
  | "cards"
  | "magazine"
  | "stack"
  | "dense";

export type CategoryRailProps = {
  title: string;
  slug: string;
  articles: ApiArticle[];
  /** Admin’den kategori rengi — çubuk, etiket, kart zemini */
  accentColor?: string | null;
  /** @deprecated */
  variant?: CategoryRailVariant;
  /** @deprecated */
  density?: "default" | "compact";
  /** @deprecated zemin boyama yok */
  band?: boolean;
  toneIndex?: number;
  /** Minimum haber — altındaysa render yok */
  minArticles?: number;
};

const SIDE = 3;

function readMinutes(article: ApiArticle): number {
  const text = `${article.excerpt ?? ""} ${article.content ?? ""}`
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = text ? text.split(" ").length : 0;
  if (words < 40) return 1;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Kategori şeridi — lead + sıkı yan liste.
 */
export function CategoryRail({
  title,
  slug,
  articles,
  accentColor,
  minArticles = HOME_RAIL_MIN_ARTICLES,
}: CategoryRailProps) {
  if (articles.length < minArticles) return null;

  const items = articles.slice(0, 1 + SIDE);
  const lead = items[0]!;
  const side = items.slice(1, 1 + SIDE);
  const leadRel = formatRelative(lead.publishedAt);
  const leadRead = readMinutes(lead);
  const accent = categoryThemeColor(accentColor);
  const themed = accent.startsWith("#");

  return (
    <section
      className={styles.rail}
      aria-labelledby={`rail-${slug}`}
      style={
        themed
          ? ({ ["--yh-accent" as string]: accent } as CSSProperties)
          : undefined
      }
    >
      <SectionHeader
        title={title}
        titleId={`rail-${slug}`}
        href={`/kategori/${slug}`}
        accent="underline"
        more={
          <Link href={`/kategori/${slug}`} className={styles.more}>
            {Copy.seeAll}
            <span aria-hidden> →</span>
          </Link>
        }
      />

      <div className={styles.grid}>
        <ArticleCard
          href={`/haber/${lead.slug}`}
          title={lead.title}
          excerpt={lead.excerpt}
          coverImage={lead.coverImage}
          categoryName={title}
          categoryAccent={themed ? accent : null}
          variant="lead"
          meta={
            <>
              {leadRel || "Az önce"}
              <span aria-hidden> · </span>
              {leadRead} dk okuma
            </>
          }
        />

        {side.length ? (
          <div className={styles.side}>
            {side.map((item, i) => {
              const rel = formatRelative(item.publishedAt);
              return (
                <ArticleCard
                  key={item.id}
                  href={`/haber/${item.slug}`}
                  title={item.title}
                  coverImage={item.coverImage}
                  categoryName={title}
                  categoryAccent={themed ? accent : null}
                  variant="row"
                  index={i + 1}
                  meta={rel || "Az önce"}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
