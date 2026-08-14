import { createHash } from "node:crypto";
import type { ApiPoll, ApiPollOption } from "@yenihaber/shared";

const DAY_MS = 24 * 60 * 60 * 1000;

export type PollOptionRow = {
  id: string;
  label: string;
  sortOrder: number;
  voteCount: number;
};

export type PollRow = {
  id: string;
  question: string;
  articleId: string | null;
  type: string;
  status: string;
  startAt: Date | null;
  endAt: Date | null;
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
  options: PollOptionRow[];
  article?: {
    title: string;
    slug: string;
  } | null;
};

/** IP + UA + 24s dilimi veya kalıcı user_id */
export function buildVoterHash(input: {
  ip: string;
  userAgent: string;
  userId?: string | null;
}): string {
  const salt = process.env.POLL_HASH_SALT || process.env.IP_HASH_SALT || "yh-poll";
  if (input.userId) {
    return createHash("sha256")
      .update(`${salt}:uid:${input.userId}`)
      .digest("hex")
      .slice(0, 48);
  }
  const dayKey = Math.floor(Date.now() / DAY_MS);
  const ua = (input.userAgent || "unknown").slice(0, 280);
  return createHash("sha256")
    .update(`${salt}:ipua:${input.ip}:${ua}:${dayKey}`)
    .digest("hex")
    .slice(0, 48);
}

export function isPollWindowOpen(row: {
  status: string;
  startAt: Date | null;
  endAt: Date | null;
}): boolean {
  if (row.status !== "active") return false;
  const now = Date.now();
  if (row.startAt && row.startAt.getTime() > now) return false;
  if (row.endAt && row.endAt.getTime() < now) return false;
  return true;
}

export function daysLeft(endAt: Date | null): number | null {
  if (!endAt) return null;
  const ms = endAt.getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.max(1, Math.ceil(ms / DAY_MS));
}

export function mapOptions(options: PollOptionRow[], totalVotes: number): ApiPollOption[] {
  const total = Math.max(0, totalVotes);
  return [...options]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, "tr"))
    .map((o) => ({
      id: o.id,
      label: o.label,
      sortOrder: o.sortOrder,
      voteCount: o.voteCount,
      percent:
        total > 0 ? Math.round((o.voteCount / total) * 100) : 0,
    }));
}

export function mapPoll(row: PollRow): ApiPoll {
  const open = isPollWindowOpen(row);
  return {
    id: row.id,
    question: row.question,
    articleId: row.articleId,
    articleTitle: row.article?.title ?? null,
    articleSlug: row.article?.slug ?? null,
    type: row.type === "multi" ? "multi" : "single",
    status: (["draft", "active", "closed"].includes(row.status)
      ? row.status
      : "draft") as ApiPoll["status"],
    startAt: row.startAt?.toISOString() ?? null,
    endAt: row.endAt?.toISOString() ?? null,
    totalVotes: row.totalVotes,
    options: mapOptions(row.options, row.totalVotes),
    daysLeft: daysLeft(row.endAt),
    isOpen: open,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
