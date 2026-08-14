import { articleHasMansetCover, isUsableArticleCover } from "@yenihaber/shared";
import { peekDefaultCoverUrl } from "./settings";

/** Habere gerçek kapak varsa manşete uygundur — logo / varsayılan SVG yetmez */
export function articleHasEffectiveCover(a: {
  coverImage169?: string | null;
  coverImage?: string | null;
  videoPoster?: string | null;
}): boolean {
  if (articleHasMansetCover(a)) return true;
  // Site varsayılanı tek başına manşet için yeterli değil
  return false;
}

export function resolvePublicCoverUrl(
  ...candidates: Array<string | null | undefined>
): string {
  for (const c of candidates) {
    if (isUsableArticleCover(c)) return (c ?? "").trim();
  }
  const fallback = peekDefaultCoverUrl()?.trim();
  if (isUsableArticleCover(fallback)) return fallback!;
  return "/brand/default-cover.svg";
}
