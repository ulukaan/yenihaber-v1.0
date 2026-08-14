import {
  parseVideoUrl,
  videoEmbedUrl,
  type VideoOembedResult,
  type VideoProvider,
} from "@yenihaber/shared";
import { prisma } from "@yenihaber/database";

function parseIso8601Duration(iso: string | undefined): number | null {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!m) return null;
  const h = Number(m[1] ?? 0);
  const min = Number(m[2] ?? 0);
  const s = Number(m[3] ?? 0);
  return h * 3600 + min * 60 + s;
}

/**
 * Bağlantı yapıştır → oEmbed (başlık, kapak, süre).
 * Kendi sunucuda host yok — YouTube / Vimeo / Bunny gömme.
 */
export async function fetchVideoOembed(rawUrl: string): Promise<VideoOembedResult> {
  const parsed = parseVideoUrl(rawUrl);
  if (!parsed) {
    throw new Error("Desteklenen bağlantı: YouTube, Vimeo veya Bunny Stream");
  }

  let title = `Video ${parsed.id}`;
  let poster: string | null = null;
  let duration: number | null = null;
  let html: string | null = null;

  if (parsed.provider === "youtube") {
    poster = `https://i.ytimg.com/vi/${parsed.id}/hqdefault.jpg`;
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(parsed.watchUrl)}&format=json`;
      const res = await fetch(oembedUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          title?: string;
          thumbnail_url?: string;
          html?: string;
        };
        if (data.title) title = data.title;
        if (data.thumbnail_url) poster = data.thumbnail_url;
        if (data.html) html = data.html;
      }
    } catch {
      /* poster fallback yeter */
    }
    // noembed süre (opsiyonel)
    try {
      const ne = await fetch(
        `https://noembed.com/embed?url=${encodeURIComponent(parsed.watchUrl)}`,
        { signal: AbortSignal.timeout(6000) },
      );
      if (ne.ok) {
        const data = (await ne.json()) as {
          title?: string;
          duration?: number;
          thumbnail_url?: string;
        };
        if (data.title) title = data.title;
        if (typeof data.duration === "number" && data.duration > 0) {
          duration = Math.round(data.duration);
        }
        if (data.thumbnail_url) poster = data.thumbnail_url;
      }
    } catch {
      /* ignore */
    }
  } else if (parsed.provider === "vimeo") {
    try {
      const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(parsed.watchUrl)}`;
      const res = await fetch(oembedUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          title?: string;
          thumbnail_url?: string;
          duration?: number;
          html?: string;
        };
        if (data.title) title = data.title;
        if (data.thumbnail_url) poster = data.thumbnail_url;
        if (typeof data.duration === "number") duration = data.duration;
        if (data.html) html = data.html;
      }
    } catch {
      throw new Error("Vimeo oEmbed alınamadı");
    }
  } else {
    // bunny — harici oEmbed yok; id yeterli
    title = `Bunny video`;
  }

  const provider = parsed.provider as VideoProvider;
  return {
    provider,
    videoId: parsed.id,
    title,
    poster,
    duration,
    watchUrl: parsed.watchUrl,
    embedUrl: videoEmbedUrl(provider, parsed.id),
    html,
  };
}

/** Canlı bitiş saati geçmiş → arşiv + canlı rozeti kapat + kapak tazele */
export async function expireEndedLiveVideos(): Promise<number> {
  const now = new Date();
  const lives = await prisma.article.findMany({
    where: {
      contentType: "video",
      videoIsLive: true,
      videoLiveEndsAt: { lte: now },
    },
  });

  for (const row of lives) {
    let poster = row.videoPoster;
    if (row.videoProvider === "youtube" && row.videoId) {
      poster = `https://i.ytimg.com/vi/${row.videoId}/hqdefault.jpg`;
    }
    await prisma.article.update({
      where: { id: row.id },
      data: {
        videoIsLive: false,
        status: "ARSIV",
        isBreaking: false,
        videoPoster: poster,
        coverImage: poster ?? row.coverImage,
        updateNote: "Canlı yayın otomatik arşive alındı",
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "video.live_expire",
        entityType: "article",
        entityId: row.id,
        meta: JSON.stringify({ slug: row.slug, endedAt: row.videoLiveEndsAt }),
      },
    });
  }

  return lives.length;
}

export function durationFromProviderMeta(
  duration: number | null | undefined,
  durationIso?: string,
): number | null {
  if (typeof duration === "number" && duration > 0) return Math.round(duration);
  return parseIso8601Duration(durationIso);
}
