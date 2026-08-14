import type { ArticleStatus, Role } from "@yenihaber/shared";
import { assertStatusAllowedForRole } from "@yenihaber/shared";
import { HTTPException } from "hono/http-exception";
import { prisma } from "@yenihaber/database";

/** Muhabir YAYINDA'ya basamaz — panelin kritik kuralı */
export function enforcePublishRole(role: Role, status: ArticleStatus) {
  const check = assertStatusAllowedForRole(role, status);
  if (!check.ok) {
    throw new HTTPException(403, { message: check.message });
  }
}

type PublishFields = {
  status: string;
  publishedAt: Date | null | undefined;
  scheduledAt: Date | null | undefined;
};

export function resolvePublishTimestamps(
  nextStatus: ArticleStatus,
  existing: { publishedAt: Date | null; scheduledAt?: Date | null },
  scheduledAtRaw?: string | null,
  publishedAtRaw?: string | null,
): Pick<PublishFields, "publishedAt" | "scheduledAt"> {
  const scheduledAt =
    scheduledAtRaw === undefined
      ? undefined
      : scheduledAtRaw
        ? new Date(scheduledAtRaw)
        : null;

  const publishedOverride =
    publishedAtRaw === undefined
      ? undefined
      : publishedAtRaw
        ? new Date(publishedAtRaw)
        : null;

  if (nextStatus === "YAYINDA") {
    return {
      publishedAt:
        publishedOverride !== undefined
          ? (publishedOverride ?? new Date())
          : (existing.publishedAt ?? new Date()),
      scheduledAt: scheduledAt === undefined ? null : scheduledAt,
    };
  }
  if (nextStatus === "ZAMANLANMIS") {
    return {
      publishedAt:
        publishedOverride !== undefined
          ? publishedOverride
          : existing.publishedAt,
      scheduledAt: scheduledAt ?? existing.scheduledAt ?? null,
    };
  }
  return {
    publishedAt:
      publishedOverride !== undefined
        ? publishedOverride
        : existing.publishedAt,
    scheduledAt:
      scheduledAt === undefined
        ? (existing.scheduledAt ?? null)
        : scheduledAt,
  };
}

/** Yayın öncesi revizyon + audit */
export async function recordArticleChange(opts: {
  articleId: string;
  editorId: string;
  action: string;
  snapshot: unknown;
  note?: string | null;
}) {
  const snap = JSON.stringify(opts.snapshot);
  await prisma.$transaction([
    prisma.articleRevision.create({
      data: {
        articleId: opts.articleId,
        editorId: opts.editorId,
        snapshot: snap,
        note: opts.note ?? null,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: opts.editorId,
        action: opts.action,
        entityType: "article",
        entityId: opts.articleId,
        meta: opts.note ? JSON.stringify({ note: opts.note }) : null,
      },
    }),
  ]);
}
