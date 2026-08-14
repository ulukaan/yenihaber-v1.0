import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "@yenihaber/database";
import { isLoopbackUrl, resolveApiBaseUrl } from "@yenihaber/config";
import {
  StoryCreateSchema,
  StoryReorderSchema,
  StoryUpdateSchema,
  CacheTags,
  parseVideoUrl,
  type ApiStory,
} from "@yenihaber/shared";
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from "../lib/auth";
import { revalidateWeb } from "../lib/revalidate";

export const storyRoutes = new Hono<{ Variables: AuthVariables }>();

function revalidateStories() {
  void revalidateWeb(["/"], [CacheTags.anasayfa, CacheTags.hikaye]);
}

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_VIDEO = 48 * 1024 * 1024;

function uploadsRoot() {
  const here = fileURLToPath(new URL(".", import.meta.url));
  return resolve(here, "../../../../data/uploads");
}

/** PUBLIC_API_URL veya istek host + API_PREFIX */
function publicBaseFromRequest(c: { req: { url: string } }): string {
  const fromEnv = resolveApiBaseUrl();
  if (fromEnv && !fromEnv.startsWith("/") && !isLoopbackUrl(fromEnv)) {
    return fromEnv;
  }
  try {
    const u = new URL(c.req.url);
    const prefix = (process.env.API_PREFIX || "api/v1").replace(/^\//, "");
    return `${u.protocol}//${u.host}/${prefix}`;
  } catch {
    return fromEnv || "";
  }
}

/** Eski hatalı URL: host/media/file → host/api/v1/media/file */
function fixMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const prefix = (process.env.API_PREFIX || "api/v1").replace(/^\//, "");
  return url.replace(
    /^(https?:\/\/[^/]+)\/media\/file\//i,
    `$1/${prefix}/media/file/`,
  );
}

function emptyStr(v: string | null | undefined): string | null {
  if (v === undefined || v === null || v === "") return null;
  return v.trim() || null;
}

function parseDate(v: string | null | undefined): Date | null {
  if (v === undefined || v === null || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapStory(row: {
  id: string;
  title: string;
  kind: string;
  mediaUrl: string;
  posterUrl: string | null;
  linkUrl: string | null;
  videoProvider: string | null;
  videoId: string | null;
  status: string;
  sortOrder: number;
  expiresAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ApiStory {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind === "short" ? "short" : "durum",
    mediaUrl: fixMediaUrl(row.mediaUrl) ?? row.mediaUrl,
    posterUrl: fixMediaUrl(row.posterUrl),
    linkUrl: row.linkUrl,
    videoProvider: row.videoProvider,
    videoId: row.videoId,
    status:
      row.status === "active"
        ? "active"
        : row.status === "archived"
          ? "archived"
          : "draft",
    sortOrder: row.sortOrder,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function enrichVideoFields(input: {
  kind?: string;
  mediaUrl?: string;
  videoProvider?: string | null;
  videoId?: string | null;
}) {
  let videoProvider = emptyStr(input.videoProvider ?? undefined);
  let videoId = emptyStr(input.videoId ?? undefined);
  const mediaUrl = input.mediaUrl?.trim() ?? "";

  if (input.kind === "short" && mediaUrl && !videoId) {
    try {
      const parsed = parseVideoUrl(mediaUrl);
      if (parsed?.provider && parsed?.id) {
        videoProvider = parsed.provider;
        videoId = parsed.id;
      }
    } catch {
      /* düz mp4 URL olabilir */
    }
  }

  return { videoProvider, videoId };
}

/** Public: aktif & süresi dolmamış hikayeler */
storyRoutes.get("/", async (c) => {
  const now = new Date();
  const rows = await prisma.story.findMany({
    where: {
      status: "active",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
    take: 40,
  });

  c.header("Cache-Control", "public, max-age=30, stale-while-revalidate=60");
  return c.json({ data: rows.map(mapStory) });
});

storyRoutes.get(
  "/admin",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const status = c.req.query("status");
    const rows = await prisma.story.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      take: 100,
    });
    return c.json({ data: rows.map(mapStory) });
  },
);

storyRoutes.post(
  "/upload",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const user = c.get("user");
    const body = await c.req.parseBody({ all: true });
    const raw = body.file ?? body.image ?? body.video;
    if (!raw || typeof raw === "string") {
      throw new HTTPException(400, { message: "Dosya seçin" });
    }
    const file = raw as File;
    const type = file.type || "application/octet-stream";
    const isImage = IMAGE_TYPES.has(type);
    const isVideo = VIDEO_TYPES.has(type);
    if (!isImage && !isVideo) {
      throw new HTTPException(400, {
        message: "JPEG/PNG/WebP/GIF veya MP4/WebM",
      });
    }
    const max = isVideo ? MAX_VIDEO : MAX_IMAGE;
    if (file.size > max) {
      throw new HTTPException(400, {
        message: isVideo
          ? "Video en fazla 48 MB olabilir"
          : "Görsel en fazla 8 MB olabilir",
      });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const now = new Date();
    const y = String(now.getFullYear());
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const hash = createHash("sha1")
      .update(buf.subarray(0, Math.min(buf.length, 4096)))
      .update(randomBytes(8))
      .digest("hex")
      .slice(0, 16);
    const ext =
      type === "image/png"
        ? ".png"
        : type === "image/webp"
          ? ".webp"
          : type === "image/gif"
            ? ".gif"
            : type === "video/webm"
              ? ".webm"
              : type === "video/quicktime"
                ? ".mov"
                : isVideo
                  ? ".mp4"
                  : ".jpg";
    const baseName = basename(file.name || "story", extname(file.name || ""))
      .toLocaleLowerCase("tr-TR")
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    const filename = `${baseName || "story"}-${hash}${ext}`;
    const folder = `stories/${y}/${m}`;
    const dir = join(uploadsRoot(), ...folder.split("/"));
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), buf);

    const relPath = `${folder}/${filename}`;
    const url = `${publicBaseFromRequest(c)}/media/file/${relPath}`;

    await prisma.mediaAsset.create({
      data: {
        originalPath: relPath,
        url,
        fileName: filename,
        kind: "genel",
        altText: baseName || filename,
        credit: "Hikaye",
        mime: type,
        bytes: file.size,
        uploadedById: user.id,
      },
    });

    return c.json({
      ok: true as const,
      url,
      mime: type,
      kind: isVideo ? ("video" as const) : ("image" as const),
      size: file.size,
    });
  },
);

storyRoutes.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const body = StoryCreateSchema.parse(await c.req.json());
    const maxOrder = await prisma.story.aggregate({ _max: { sortOrder: true } });
    const sortOrder = body.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1;
    const status = body.status ?? "draft";
    const publishedAt = status === "active" ? new Date() : null;
    let expiresAt = parseDate(body.expiresAt);
    if (status === "active" && !expiresAt) {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    const video = enrichVideoFields(body);

    const row = await prisma.story.create({
      data: {
        title: body.title.trim(),
        kind: body.kind,
        mediaUrl: body.mediaUrl.trim(),
        posterUrl: emptyStr(body.posterUrl),
        linkUrl: emptyStr(body.linkUrl),
        videoProvider: video.videoProvider,
        videoId: video.videoId,
        status,
        sortOrder,
        expiresAt,
        publishedAt,
      },
    });
    revalidateStories();
    return c.json({ story: mapStory(row) }, 201);
  },
);

storyRoutes.patch(
  "/reorder",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const body = StoryReorderSchema.parse(await c.req.json());
    await prisma.$transaction(
      body.ids.map((id, i) =>
        prisma.story.update({
          where: { id },
          data: { sortOrder: i + 1 },
        }),
      ),
    );
    revalidateStories();
    return c.json({ ok: true as const });
  },
);

storyRoutes.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const id = c.req.param("id");
    const existing = await prisma.story.findUnique({ where: { id } });
    if (!existing) {
      throw new HTTPException(404, { message: "Hikaye bulunamadı" });
    }
    const body = StoryUpdateSchema.parse(await c.req.json());
    const nextKind = body.kind ?? existing.kind;
    const nextMedia = body.mediaUrl?.trim() ?? existing.mediaUrl;
    const video = enrichVideoFields({
      kind: nextKind,
      mediaUrl: nextMedia,
      videoProvider:
        body.videoProvider !== undefined
          ? body.videoProvider
          : existing.videoProvider,
      videoId: body.videoId !== undefined ? body.videoId : existing.videoId,
    });

    const nextStatus = body.status ?? existing.status;
    let publishedAt = existing.publishedAt;
    if (nextStatus === "active" && !publishedAt) {
      publishedAt = new Date();
    }

    let expiresAt = existing.expiresAt;
    if (body.expiresAt !== undefined) {
      expiresAt = parseDate(body.expiresAt);
    } else if (
      nextStatus === "active" &&
      existing.status !== "active" &&
      !expiresAt
    ) {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const row = await prisma.story.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.kind !== undefined ? { kind: body.kind } : {}),
        ...(body.mediaUrl !== undefined
          ? { mediaUrl: body.mediaUrl.trim() }
          : {}),
        ...(body.posterUrl !== undefined
          ? { posterUrl: emptyStr(body.posterUrl) }
          : {}),
        ...(body.linkUrl !== undefined
          ? { linkUrl: emptyStr(body.linkUrl) }
          : {}),
        videoProvider: video.videoProvider,
        videoId: video.videoId,
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        expiresAt,
        publishedAt,
      },
    });
    revalidateStories();
    return c.json({ story: mapStory(row) });
  },
);

storyRoutes.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const id = c.req.param("id");
    const existing = await prisma.story.findUnique({ where: { id } });
    if (!existing) {
      throw new HTTPException(404, { message: "Hikaye bulunamadı" });
    }
    await prisma.story.delete({ where: { id } });
    revalidateStories();
    // disk temizliği opsiyonel — MediaAsset kalabilir
    if (existing.mediaUrl.includes("/media/file/")) {
      try {
        const rel = existing.mediaUrl.split("/media/file/")[1];
        if (rel) {
          const full = join(uploadsRoot(), ...rel.split("/").filter(Boolean));
          if (full.startsWith(uploadsRoot()) && existsSync(full)) {
            /* dosya bırak — medya kütüphanesinde kalabilir */
          }
        }
      } catch {
        /* ignore */
      }
    }
    return c.json({ ok: true as const });
  },
);
