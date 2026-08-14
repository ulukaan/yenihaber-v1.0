/** Tarayıcıda saklanan üye tercihleri (takip / kayıtlı haber). */

export type SavedArticle = {
  slug: string;
  title: string;
  coverImage?: string | null;
  categoryName?: string | null;
  savedAt: string;
};

export type FollowedAuthor = {
  slug: string;
  name: string;
  title?: string | null;
  avatarUrl?: string | null;
  followedAt: string;
};

const FOLLOWS_KEY = "yh-web-follows";
const SAVED_KEY = "yh-web-saved";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("yh-member-prefs"));
}

export function listFollows(): FollowedAuthor[] {
  return readJson<FollowedAuthor[]>(FOLLOWS_KEY, []);
}

export function isFollowing(slug: string): boolean {
  return listFollows().some((f) => f.slug === slug);
}

export function toggleFollow(author: Omit<FollowedAuthor, "followedAt">): FollowedAuthor[] {
  const cur = listFollows();
  const exists = cur.some((f) => f.slug === author.slug);
  const next = exists
    ? cur.filter((f) => f.slug !== author.slug)
    : [
        {
          ...author,
          followedAt: new Date().toISOString(),
        },
        ...cur,
      ];
  writeJson(FOLLOWS_KEY, next);
  return next;
}

export function removeFollow(slug: string): FollowedAuthor[] {
  const next = listFollows().filter((f) => f.slug !== slug);
  writeJson(FOLLOWS_KEY, next);
  return next;
}

export function listSaved(): SavedArticle[] {
  return readJson<SavedArticle[]>(SAVED_KEY, []);
}

export function isSaved(slug: string): boolean {
  return listSaved().some((a) => a.slug === slug);
}

export function toggleSaved(
  article: Omit<SavedArticle, "savedAt">,
): SavedArticle[] {
  const cur = listSaved();
  const exists = cur.some((a) => a.slug === article.slug);
  const next = exists
    ? cur.filter((a) => a.slug !== article.slug)
    : [
        {
          ...article,
          savedAt: new Date().toISOString(),
        },
        ...cur,
      ];
  writeJson(SAVED_KEY, next);
  return next;
}

export function removeSaved(slug: string): SavedArticle[] {
  const next = listSaved().filter((a) => a.slug !== slug);
  writeJson(SAVED_KEY, next);
  return next;
}
