import { prisma } from "@yenihaber/database";
import type { CommentStatus } from "@yenihaber/shared";

/** Kök + tüm alt cevaplar (tek seviye veya derin) */
export async function collectCommentTreeIds(
  rootIds: string[],
): Promise<string[]> {
  const set = new Set(rootIds.filter(Boolean));
  let frontier = [...set];
  while (frontier.length) {
    const kids = await prisma.comment.findMany({
      where: { parentId: { in: frontier } },
      select: { id: true },
    });
    frontier = [];
    for (const k of kids) {
      if (!set.has(k.id)) {
        set.add(k.id);
        frontier.push(k.id);
      }
    }
  }
  return [...set];
}

export function auditActionForStatus(status: CommentStatus): string {
  switch (status) {
    case "ONAYLI":
      return "comment.approve";
    case "ARSIV":
      return "comment.archive";
    case "COP":
      return "comment.trash";
    case "BEKLEMEDE":
      return "comment.pending";
    default:
      return "comment.moderate";
  }
}

/**
 * Durum değiştir + alt yorumlara cascade + audit
 */
export async function applyCommentStatus(opts: {
  ids: string[];
  status: CommentStatus;
  actorId: string | null;
  ipHash?: string | null;
  cascade?: boolean;
}): Promise<{ updated: number; ids: string[] }> {
  const cascade = opts.cascade !== false;
  const targets = cascade
    ? await collectCommentTreeIds(opts.ids)
    : [...new Set(opts.ids)];

  if (!targets.length) return { updated: 0, ids: [] };

  const now = new Date();
  const result = await prisma.comment.updateMany({
    where: { id: { in: targets } },
    data: {
      status: opts.status,
      moderatedAt: now,
      moderatedById: opts.actorId,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: opts.actorId,
      action: auditActionForStatus(opts.status),
      entityType: "Comment",
      entityId: targets[0] ?? null,
      meta: JSON.stringify({
        status: opts.status,
        ids: targets,
        count: targets.length,
        cascade,
      }),
      ipHash: opts.ipHash ?? null,
    },
  });

  return { updated: result.count, ids: targets };
}

/** Çöpte 30 günden eski yorumları kalıcı sil */
export async function purgeTrashedComments(
  olderThanDays = 30,
): Promise<number> {
  const cutoff = new Date(
    Date.now() - olderThanDays * 24 * 60 * 60 * 1000,
  );
  const result = await prisma.comment.deleteMany({
    where: {
      status: "COP",
      OR: [
        { moderatedAt: { lte: cutoff } },
        { moderatedAt: null, updatedAt: { lte: cutoff } },
      ],
    },
  });
  if (result.count > 0) {
    await prisma.auditLog.create({
      data: {
        action: "comment.purge",
        entityType: "Comment",
        meta: JSON.stringify({
          count: result.count,
          olderThanDays,
          cutoff: cutoff.toISOString(),
        }),
      },
    });
  }
  return result.count;
}
