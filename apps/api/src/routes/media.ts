import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "@yenihaber/database";
import { isLoopbackUrl, resolveApiBaseUrl, resolveSiteOrigin } from "@yenihaber/config";
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from "../lib/auth.js";

export const mediaRoutes = new Hono<{ Variables: AuthVariables }>();

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

const KINDS = new Set(["haber", "marka", "genel"]);
type MediaKind = "haber" | "marka" | "genel";

function uploadsRoot() {
  const here = fileURLToPath(new URL(".", import.meta.url));
  return resolve(here, "../../../../data/uploads");
}

function webBrandRoot() {
  const here = fileURLToPath(new URL(".", import.meta.url));
  return resolve(here, "../../../../apps/web/public/brand");
}

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

function siteBase(): string {
  return resolveSiteOrigin();
}

/** Disk + DB — site-brand dosyaları diskten silinmez */
async function deleteMediaAsset(row: {
  id: string;
  originalPath: string;
}) {
  if (!row.originalPath.startsWith("site-brand/")) {
    const full = join(uploadsRoot(), ...row.originalPath.split("/"));
    if (full.startsWith(uploadsRoot()) && existsSync(full)) {
      try {
        await unlink(full);
      } catch {
        /* ignore */
      }
    }
  }
  await prisma.mediaAsset.delete({ where: { id: row.id } });
}

function mimeOf(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
  return "image/jpeg";
}

function parseKind(raw: unknown): MediaKind {
  const k = String(raw ?? "genel").toLocaleLowerCase("tr-TR");
  if (KINDS.has(k)) return k as MediaKind;
  return "genel";
}

function mapAsset(row: {
  id: string;
  originalPath: string;
  url: string;
  fileName: string;
  kind: string;
  altText: string;
  credit: string;
  mime: string | null;
  bytes: number | null;
  uploadedAt: Date;
  uploadedById: string | null;
}) {
  return {
    id: row.id,
    path: row.originalPath,
    url: row.url,
    name: row.fileName,
    kind: row.kind as MediaKind,
    altText: row.altText,
    credit: row.credit,
    mime: row.mime,
    size: row.bytes ?? 0,
    uploadedAt: row.uploadedAt.toISOString(),
    uploadedById: row.uploadedById,
  };
}

async function serveUploadRel(rel: string) {
  const clean = rel.replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    !clean ||
    clean.includes("..") ||
    /[<>"|?*]/.test(clean)
  ) {
    throw new HTTPException(400, { message: "Geçersiz yol" });
  }
  const full = join(uploadsRoot(), ...clean.split("/").filter(Boolean));
  const root = uploadsRoot();
  if (!full.startsWith(root) || !existsSync(full)) {
    throw new HTTPException(404, { message: "Dosya bulunamadı" });
  }
  const data = await readFile(full);
  return new Response(data, {
    headers: {
      "Content-Type": mimeOf(basename(full)),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

/** /media/file/... — yıl/ay, marka/, genel/... */
mediaRoutes.get("/file/*", async (c) => {
  const fullPath = c.req.path;
  const idx = fullPath.lastIndexOf("/file/");
  const rel =
    idx >= 0
      ? fullPath.slice(idx + "/file/".length)
      : String(c.req.param("*") ?? "");
  return serveUploadRel(decodeURIComponent(rel));
});

/** Liste */
mediaRoutes.get(
  "/",
  requireAuth,
  requireRole("ADMIN", "EDITOR", "MUHABIR", "YAZAR"),
  async (c) => {
    const kind = c.req.query("kind")?.trim();
    const q = c.req.query("q")?.trim();
    const page = Math.max(1, Number(c.req.query("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(c.req.query("limit") || 48)));

    const where: {
      kind?: string;
      OR?: Array<
        | { fileName: { contains: string } }
        | { altText: { contains: string } }
      >;
    } = {};
    if (kind && KINDS.has(kind)) where.kind = kind;
    if (q) {
      where.OR = [
        { fileName: { contains: q } },
        { altText: { contains: q } },
      ];
    }

    const [total, rows, counts] = await Promise.all([
      prisma.mediaAsset.count({ where }),
      prisma.mediaAsset.findMany({
        where,
        orderBy: { uploadedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.mediaAsset.groupBy({
        by: ["kind"],
        _count: { _all: true },
      }),
    ]);

    const byKind: Record<string, number> = { haber: 0, marka: 0, genel: 0 };
    for (const row of counts) {
      byKind[row.kind] = row._count._all;
    }

    return c.json({
      data: rows.map(mapAsset),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        counts: byKind,
      },
    });
  },
);

/** Disk + site brand indeksle */
mediaRoutes.post(
  "/sync",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const base = publicBaseFromRequest(c);
    let created = 0;
    let scanned = 0;

    async function ensure(
      rel: string,
      kind: MediaKind,
      fullPath: string,
      publicUrl: string,
    ) {
      scanned += 1;
      const existing = await prisma.mediaAsset.findUnique({
        where: { originalPath: rel },
      });
      if (existing) return;
      const st = await stat(fullPath);
      await prisma.mediaAsset.create({
        data: {
          originalPath: rel,
          url: publicUrl,
          fileName: basename(fullPath),
          kind,
          altText: basename(fullPath),
          credit:
            kind === "haber"
              ? "Haber"
              : kind === "marka"
                ? "Marka"
                : "Genel",
          mime: mimeOf(basename(fullPath)),
          bytes: st.size,
        },
      });
      created += 1;
    }

    async function walk(dir: string, relBase: string, kind: MediaKind) {
      if (!existsSync(dir)) return;
      const entries = await readdir(dir, { withFileTypes: true });
      for (const ent of entries) {
        const full = join(dir, ent.name);
        const rel = relBase ? `${relBase}/${ent.name}` : ent.name;
        if (ent.isDirectory()) {
          await walk(full, rel, kind);
          continue;
        }
        if (!ent.isFile()) continue;
        const ext = extname(ent.name).toLowerCase();
        if (![".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext)) {
          continue;
        }
        const url = `${base}/media/file/${rel
          .split("/")
          .map(encodeURIComponent)
          .join("/")}`;
        await ensure(rel, kind, full, url);
      }
    }

    const root = uploadsRoot();
    if (existsSync(root)) {
      const top = await readdir(root, { withFileTypes: true });
      for (const ent of top) {
        if (!ent.isDirectory()) continue;
        if (/^\d{4}$/.test(ent.name)) {
          await walk(join(root, ent.name), ent.name, "haber");
        } else if (ent.name === "marka") {
          await walk(join(root, ent.name), "marka", "marka");
        } else {
          await walk(join(root, ent.name), ent.name, "genel");
        }
      }
    }

    const brandDir = webBrandRoot();
    if (existsSync(brandDir)) {
      const web = siteBase();
      const files = await readdir(brandDir, { withFileTypes: true });
      for (const ent of files) {
        if (!ent.isFile()) continue;
        const ext = extname(ent.name).toLowerCase();
        if (![".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext)) {
          continue;
        }
        const pathKey = `site-brand/${ent.name}`;
        await ensure(
          pathKey,
          "marka",
          join(brandDir, ent.name),
          `${web}/brand/${ent.name}`,
        );
      }
    }

    return c.json({ ok: true as const, scanned, created });
  },
);

mediaRoutes.post(
  "/upload",
  requireAuth,
  requireRole("ADMIN", "EDITOR", "MUHABIR", "YAZAR"),
  async (c) => {
    const user = c.get("user");
    const body = await c.req.parseBody({ all: true });
    const raw = body.file ?? body.image;
    if (!raw || typeof raw === "string") {
      throw new HTTPException(400, { message: "Dosya seçin" });
    }
    const file = raw as File;
    const type = file.type || "application/octet-stream";
    // svg without type
    const resolvedType =
      type === "application/octet-stream" && file.name?.endsWith(".svg")
        ? "image/svg+xml"
        : type;
    if (!ALLOWED.has(resolvedType)) {
      throw new HTTPException(400, {
        message: "Sadece JPEG, PNG, WebP, GIF veya SVG",
      });
    }
    if (file.size > MAX_BYTES) {
      throw new HTTPException(400, {
        message: "Dosya en fazla 8 MB olabilir",
      });
    }

    const kind = parseKind(body.kind);
    const altRaw = typeof body.alt === "string" ? body.alt.trim() : "";
    const creditRaw = typeof body.credit === "string" ? body.credit.trim() : "";

    const buf = Buffer.from(await file.arrayBuffer());
    const now = new Date();
    const y = String(now.getFullYear());
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const hash = createHash("sha1")
      .update(buf.subarray(0, Math.min(buf.length, 4096)))
      .update(randomBytes(8))
      .digest("hex")
      .slice(0, 16);
    const baseName = basename(file.name || "image", extname(file.name || ""))
      .toLocaleLowerCase("tr-TR")
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    const filename = `${baseName || "img"}-${hash}${EXT[resolvedType] ?? ".jpg"}`;

    const folder =
      kind === "marka"
        ? "marka"
        : kind === "haber"
          ? `${y}/${m}`
          : `genel/${y}/${m}`;
    const dir = join(uploadsRoot(), ...folder.split("/"));
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), buf);

    const relPath = `${folder}/${filename}`;
    const url = `${publicBaseFromRequest(c)}/media/file/${relPath}`;

    const asset = await prisma.mediaAsset.create({
      data: {
        originalPath: relPath,
        url,
        fileName: filename,
        kind,
        altText: altRaw || baseName || filename,
        credit:
          creditRaw ||
          (kind === "haber" ? "Haber" : kind === "marka" ? "Marka" : "Genel"),
        mime: resolvedType,
        bytes: file.size,
        uploadedById: user.id,
      },
    });

    return c.json({
      ok: true as const,
      url: asset.url,
      path: asset.originalPath,
      mime: resolvedType,
      size: file.size,
      name: filename,
      kind: asset.kind,
      id: asset.id,
    });
  },
);

mediaRoutes.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const id = c.req.param("id");
    const row = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!row) throw new HTTPException(404, { message: "Kayıt yok" });
    await deleteMediaAsset(row);
    return c.json({ ok: true as const });
  },
);

/** Toplu silme — max 100 id */
mediaRoutes.post(
  "/bulk",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const body = (await c.req.json().catch(() => null)) as {
      action?: string;
      ids?: unknown;
    } | null;
    if (!body || body.action !== "delete") {
      throw new HTTPException(400, { message: "action=delete gerekli" });
    }
    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      throw new HTTPException(400, { message: "ids boş olamaz" });
    }
    const ids = [
      ...new Set(
        body.ids.filter((id): id is string => typeof id === "string" && id.length > 0),
      ),
    ].slice(0, 100);
    if (!ids.length) {
      throw new HTTPException(400, { message: "Geçerli id yok" });
    }

    const rows = await prisma.mediaAsset.findMany({
      where: { id: { in: ids } },
    });
    let deleted = 0;
    for (const row of rows) {
      await deleteMediaAsset(row);
      deleted += 1;
    }
    return c.json({ ok: true as const, deleted });
  },
);
