import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PAID_LISTING_KIND_LABELS } from "@yenihaber/shared";
import { CorporatePage } from "@/components/corporate-page/corporate-page";
import { publicApi } from "@/lib/api";
import styles from "../ilanlar.module.css";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const { listing } = await publicApi.listings.get(slug);
    return {
      title: listing.title,
      description: listing.body.slice(0, 160) || listing.title,
    };
  } catch {
    return { title: "İlan" };
  }
}

/** Tek ücretli ilan detayı */
export default async function IlanDetailPage({ params }: Props) {
  const { slug } = await params;
  let listing;
  try {
    ({ listing } = await publicApi.listings.get(slug));
  } catch {
    notFound();
  }

  return (
    <CorporatePage
      activeHref="/ilanlar"
      title={listing.title}
      lead={
        listing.personName
          ? `${PAID_LISTING_KIND_LABELS[listing.kind]} · ${listing.personName}`
          : PAID_LISTING_KIND_LABELS[listing.kind]
      }
    >
      <div className={styles.detail}>
        {listing.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrl}
            alt=""
            style={{ width: "100%", maxHeight: 420, objectFit: "cover" }}
          />
        ) : null}
        <p className={styles.detailBody}>{listing.body || listing.title}</p>
        <p className={styles.detailMeta}>
          {listing.publishedAt
            ? `Yayın: ${new Date(listing.publishedAt).toLocaleDateString("tr-TR")}`
            : null}
          {listing.endAt
            ? ` · Bitiş: ${new Date(listing.endAt).toLocaleDateString("tr-TR")}`
            : null}
        </p>
        <Link className={styles.back} href="/ilanlar">
          ← Tüm ilanlar
        </Link>
      </div>
    </CorporatePage>
  );
}
