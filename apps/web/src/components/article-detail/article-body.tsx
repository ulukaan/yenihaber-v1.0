import Link from "next/link";
import type { ApiArticle } from "@yenihaber/shared";
import {
  articleCanonicalUrl,
  coverCaption,
  estimateReadingMinutes,
  formatAbsoluteTr,
  formatUpdateTr,
  splitAfterParagraphs,
  toIsoZ,
} from "@/lib/article-meta";
import { LazyVideoPlayer } from "@/components/lazy-video-player/lazy-video-player";
import { AdSlotClient } from "@/components/ads/ad-slot-client";
import { ArticleShare } from "./article-share";
import { ArticleReactions } from "./article-reactions";
import { ArticleComments } from "./article-comments";
import { ArticleGalleryStrip } from "./article-gallery-strip";
import { ArticleViewBeacon } from "./article-view-beacon";
import { SaveArticleButton } from "@/components/member-account/save-article-button";
import { ArticlePollCard } from "@/components/poll-card/poll-card";
import styles from "./article-body.module.css";

export type ArticleBodyProps = {
  article: ApiArticle;
  isPrimary?: boolean;
  siteUrl?: string;
  index?: number;
  related?: ApiArticle[];
  tipMailto?: string;
  viewCountMinShow?: number;
  /** Sonsuz akışta sonraki haberlerde yorumlar kapalı başlar */
  commentsCollapsed?: boolean;
};

/**
 * Haber detay gövdesi — yazı içi + başlık altı/sonu reklam yuvaları.
 */
export function ArticleBody({
  article,
  isPrimary = false,
  siteUrl = "",
  index = 0,
  related = [],
  tipMailto = "duzeltme@duzceradikal.com",
  viewCountMinShow = 500,
  commentsCollapsed = false,
}: ArticleBodyProps) {
  const agency = article.sourceAgency?.trim();
  const publishedIso =
    toIsoZ(article.publishedAt) || toIsoZ(article.createdAt);
  const updatedIso = toIsoZ(article.updatedAt);
  const publishedLabel =
    formatAbsoluteTr(article.publishedAt) ||
    formatAbsoluteTr(article.createdAt);
  const updateLabel = formatUpdateTr(
    article.publishedAt || article.createdAt,
    article.updatedAt,
  );
  const readMin =
    article.readingMinutes || estimateReadingMinutes(article.content);
  const showViews = (article.viewCount ?? 0) >= viewCountMinShow;
  const shareUrl = articleCanonicalUrl(siteUrl, article.slug);
  const { before, after } = splitAfterParagraphs(article.content, 2);
  const caption = coverCaption(article);
  const authorName = agency || article.author.name;
  const reportHref = `mailto:${tipMailto}?subject=${encodeURIComponent(
    `Hata bildirimi: ${article.title}`,
  )}&body=${encodeURIComponent(
    `Haber: ${shareUrl}\n\nDüzeltmek istediğim nokta:\n`,
  )}`;
  const gallery = article.galleryImages ?? [];

  return (
    <article
      className={`${styles.article} ${isPrimary ? styles.primary : styles.continued}`}
      data-article-slug={article.slug}
      data-article-title={article.title}
      data-category-name={article.category.name}
      data-category-slug={article.category.slug}
      data-article-index={index}
      id={`haber-${article.slug}`}
    >
      <ArticleViewBeacon articleId={article.id} />

      {!isPrimary ? (
        <div className={styles.continueMark} role="separator">
          <span>Sıradaki haber</span>
        </div>
      ) : null}

      <nav className={styles.breadcrumb} aria-label="Konum">
        <Link href="/">Ana sayfa</Link>
        <span aria-hidden>·</span>
        <Link href={`/kategori/${article.category.slug}`}>
          {article.category.name}
        </Link>
      </nav>

      <header className={styles.header}>
        <div className={styles.kicker}>
          <Link
            href={`/kategori/${article.category.slug}`}
            className={styles.cat}
          >
            {article.category.name}
          </Link>
          {article.isBreaking ? (
            <span className={styles.flagBreaking}>Son dakika</span>
          ) : null}
          {article.isSponsored ? (
            <span className={styles.flagSponsored}>Sponsorlu içerik</span>
          ) : null}
          {article.pressAdNo ? (
            <span className={styles.pressAd}>
              Basın ilan no: {article.pressAdNo}
            </span>
          ) : null}
        </div>

        <h1 className={styles.title}>{article.title}</h1>

        {article.excerpt ? (
          <p className={styles.lead}>{article.excerpt}</p>
        ) : null}

        <AdSlotClient code="article-top" className={styles.adInHeader} />

        <div className={styles.metaBar}>
          <div className={styles.metaLeft}>
            {agency ? (
              <span className={styles.authorName}>{authorName}</span>
            ) : article.author.slug ? (
              <Link
                href={`/yazar/${article.author.slug}`}
                className={styles.authorName}
              >
                {article.author.name}
              </Link>
            ) : (
              <span className={styles.authorName}>{article.author.name}</span>
            )}
            <p className={styles.dateLine}>
              {publishedIso ? (
                <time dateTime={publishedIso}>{publishedLabel}</time>
              ) : null}
              {updateLabel && updatedIso ? (
                <>
                  {" "}
                  · Güncelleme:{" "}
                  <time dateTime={updatedIso}>{updateLabel}</time>
                </>
              ) : null}
              {" "}
              · {readMin} dk okuma
              {showViews ? (
                <>
                  {" "}
                  · {article.viewCount.toLocaleString("tr-TR")} okunma
                </>
              ) : null}
            </p>
          </div>
          <div className={styles.metaActions}>
            <SaveArticleButton
              slug={article.slug}
              title={article.title}
              coverImage={article.coverImage}
              categoryName={article.category.name}
            />
            <ArticleShare url={shareUrl} title={article.title} />
          </div>
        </div>
      </header>

      {article.contentType === "video" &&
      article.videoProvider &&
      article.videoId ? (
        <LazyVideoPlayer
          provider={article.videoProvider}
          videoId={article.videoId}
          title={article.title}
          poster={article.videoPoster || article.coverImage}
          duration={article.videoDuration}
          orientation={article.videoOrientation}
          isLive={article.videoIsLive}
        />
      ) : article.coverImage ? (
        <figure className={styles.cover}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.coverImage}
            alt={article.title}
            width={1600}
            height={900}
            fetchPriority={isPrimary ? "high" : "auto"}
          />
          <figcaption>{caption}</figcaption>
        </figure>
      ) : null}

      {gallery.length > 0 ? (
        <ArticleGalleryStrip images={gallery} title={article.title} />
      ) : null}

      {article.contentType === "video" && article.videoTranscript ? (
        <details className={styles.transcript}>
          <summary>Transkript</summary>
          <div className={styles.transcriptBody}>
            {article.videoTranscript.split(/\n\n+/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </details>
      ) : null}

      <div className={styles.prose}>
        {before ? (
          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: before }}
          />
        ) : null}

        {/* Yazı içi — article-inline */}
        <div className={styles.adSlot} key={`inline-${article.id}-${index}`}>
          <AdSlotClient code="article-inline" />
        </div>

        {after ? (
          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: after }}
          />
        ) : !before ? (
          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        ) : null}
      </div>

      <AdSlotClient
        key={`bottom-${article.id}-${index}`}
        code="article-bottom"
        className={styles.adBottom}
      />

      <ArticlePollCard articleId={article.id} variant="inline" />

      {article.tags.length > 0 ? (
        <div className={styles.tags} aria-label="Etiketler">
          {article.tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/ara?q=${encodeURIComponent(tag.name)}`}
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      ) : null}

      <ArticleReactions articleId={article.id} />

      <p className={styles.report}>
        Bu haberde bir hata gördünüz mü?{" "}
        <a href={reportHref}>Düzeltme / hata bildirimi</a>
      </p>

      <ArticleComments
        articleId={article.id}
        initialCount={article.commentCount ?? 0}
        categorySlug={article.category.slug}
        disableQuickComment={Boolean(article.category.disableQuickComment)}
        commentsClosed={Boolean(article.commentsClosed)}
        categoryCommentsEnabled={
          article.category.commentsEnabled !== false
        }
        startCollapsed={commentsCollapsed}
      />

      {related.length > 0 ? (
        <section className={styles.related} aria-labelledby={`rel-${article.id}`}>
          <h2 id={`rel-${article.id}`}>İlgili haberler</h2>
          <ul className={styles.relatedList}>
            {related.map((item) => (
              <li key={item.id}>
                <Link href={`/haber/${item.slug}`}>
                  <span className={styles.relatedCat}>{item.category.name}</span>
                  <strong>{item.title}</strong>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
