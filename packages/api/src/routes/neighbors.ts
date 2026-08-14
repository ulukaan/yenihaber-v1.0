import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "@yenihaber/database";

export const neighborRoutes = new Hono();

type NeighborRow = {
  slug: string;
  title: string;
  coverImage: string | null;
  publishedAt: Date | null;
  category: { name: string };
};

function mapNeighbor(row: NeighborRow | null) {
  if (!row) return null;
  return {
    slug: row.slug,
    title: row.title,
    coverImage: row.coverImage,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    categoryName: row.category.name,
  };
}

/**
 * Aynı kategoride kronolojik komşu.
 * next: daha yeni (publishedAt > current ASC)
 * prev: daha eski (publishedAt < current DESC)
 * Kategori biterse next genel akıştan.
 */
neighborRoutes.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const current = await prisma.article.findFirst({
    where: { slug, status: "YAYINDA" },
    select: {
      id: true,
      categoryId: true,
      publishedAt: true,
      createdAt: true,
    },
  });
  if (!current) throw new HTTPException(404, { message: "Haber bulunamadı" });

  const pivot = current.publishedAt ?? current.createdAt;
  const select = {
    slug: true,
    title: true,
    coverImage: true,
    publishedAt: true,
    category: { select: { name: true } },
  } as const;

  let next = await prisma.article.findFirst({
    where: {
      status: "YAYINDA",
      categoryId: current.categoryId,
      id: { not: current.id },
      OR: [
        { publishedAt: { gt: pivot } },
        { publishedAt: null, createdAt: { gt: pivot } },
      ],
    },
    orderBy: [{ publishedAt: "asc" }, { createdAt: "asc" }],
    select,
  });

  if (!next) {
    next = await prisma.article.findFirst({
      where: {
        status: "YAYINDA",
        id: { not: current.id },
        OR: [
          { publishedAt: { gt: pivot } },
          { publishedAt: null, createdAt: { gt: pivot } },
        ],
      },
      orderBy: [{ publishedAt: "asc" }, { createdAt: "asc" }],
      select,
    });
  }

  // Kategori/genel daha yenisi yoksa: akışta bir sonrakiler (eskiye doğru)
  if (!next) {
    next = await prisma.article.findFirst({
      where: {
        status: "YAYINDA",
        categoryId: current.categoryId,
        id: { not: current.id },
        OR: [
          { publishedAt: { lt: pivot } },
          { publishedAt: null, createdAt: { lt: pivot } },
        ],
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select,
    });
  }
  if (!next) {
    next = await prisma.article.findFirst({
      where: {
        status: "YAYINDA",
        id: { not: current.id },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select,
    });
  }

  const prev = await prisma.article.findFirst({
    where: {
      status: "YAYINDA",
      categoryId: current.categoryId,
      id: { not: current.id },
      OR: [
        { publishedAt: { lt: pivot } },
        { publishedAt: null, createdAt: { lt: pivot } },
      ],
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select,
  });

  return c.json({
    next: mapNeighbor(next),
    prev: mapNeighbor(prev),
  });
});
