import { prisma } from "@yenihaber/database";

/** Dakikada bir flush — view buffer */
const buffer = new Map<string, number>();
let flushTimer: ReturnType<typeof setInterval> | null = null;

export function bumpViewBuffer(articleId: string) {
  buffer.set(articleId, (buffer.get(articleId) ?? 0) + 1);
  ensureFlush();
}

function ensureFlush() {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    void flushViewBuffer();
  }, 60_000);
  if (typeof flushTimer === "object" && "unref" in flushTimer) {
    flushTimer.unref?.();
  }
}

export async function flushViewBuffer() {
  if (!buffer.size) return;
  const snapshot = Array.from(buffer.entries());
  buffer.clear();
  await Promise.all(
    snapshot.map(([id, n]) =>
      prisma.article
        .update({
          where: { id },
          data: { viewCount: { increment: n } },
        })
        .catch(() => null),
    ),
  );
  const total = snapshot.reduce((s, [, n]) => s + n, 0);
  try {
    const { bumpBikPageviews } = await import("./bik-stats.js");
    await bumpBikPageviews(total);
  } catch {
    /* tablo yoksa sessiz */
  }
}
