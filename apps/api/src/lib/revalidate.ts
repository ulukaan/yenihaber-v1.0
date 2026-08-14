import { expandCacheTags } from "@yenihaber/shared";
import { isLoopbackUrl, resolveRevalidateOrigin } from "@yenihaber/config";

/**
 * Next.js web'e on-demand revalidation sinyali.
 * WEB_REVALIDATE_URL + REVALIDATE_SECRET yoksa no-op.
 */
export async function revalidateWeb(paths: string[], tags: string[] = []) {
  const base = resolveRevalidateOrigin();
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    console.warn(
      "[revalidate] REVALIDATE_SECRET yok — site önbelleği temizlenmedi",
    );
    return { ok: false as const, reason: "no-secret" };
  }
  if (!base || isLoopbackUrl(base)) {
    return { ok: false as const, reason: "no-public-url" };
  }

  const expandedTags = expandCacheTags(tags);
  const url = `${base.replace(/\/$/, "")}/api/revalidate`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({ paths, tags: expandedTags }),
    });
    if (!res.ok) {
      console.warn(
        `[revalidate] ${res.status} ${url} paths=${paths.join(",")} tags=${expandedTags.join(",")}`,
      );
      return { ok: false as const, status: res.status };
    }
    console.info(
      `[revalidate] ok paths=${paths.join(",")} tags=${expandedTags.join(",")}`,
    );
    return { ok: true as const };
  } catch (e) {
    console.warn(
      "[revalidate] fetch başarısız (web kapalı olabilir)",
      e instanceof Error ? e.message : e,
    );
    return { ok: false as const, reason: "fetch-failed" };
  }
}

export function articleRevalidateTargets(
  slug: string,
  categorySlug?: string,
  articleId?: string,
) {
  const paths = ["/", `/haber/${slug}`, "/son-dakika"];
  if (categorySlug) paths.push(`/kategori/${categorySlug}`);
  const tags = [
    "anasayfa",
    "articles",
    `haber:${slug}`,
    ...(articleId ? [`haber:${articleId}`] : []),
    ...(categorySlug ? [`kategori:${categorySlug}`] : []),
  ];
  return { paths, tags };
}
