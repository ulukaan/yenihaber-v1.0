import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "@yenihaber/database";
import {
  TAG_FEATURED_MAX,
  TAG_INDEX_MIN,
  TAG_SIMILARITY_THRESHOLD,
  TagBulkSchema,
  TagInputSchema,
  TagMergeSchema,
  TagPatchSchema,
  stringSimilarity,
  tagSlugFromName,
} from "@yenihaber/shared";
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from "../lib/auth.js";
import {
  mapTag,
  pathForTagSlug,
  prepareTagName,
  type TagRow,
} from "../lib/tags.js";
import { revalidateWeb } from "../lib/revalidate.js";

export const tagRoutes = new Hono<{ Variables: AuthVariables }>();

const tagInclude = {
  _count: { select: { articles: true } },
} as const;

async function tabCounts() {
  const allTags = await prisma.tag.findMany({
    where: { status: "aktif" },
    select: {
      id: true,
      slug: true,
      isFeatured: true,
      _count: { select: { articles: true } },
    },
  });
  const all = allTags.length;
  const featured = allTags.filter((t) => t.isFeatured).length;
  const rare = allTags.filter((t) => t._count.articles < 2).length;
  let similar = 0;
  for (let i = 0; i < allTags.length; i++) {
    for (let j = i + 1; j < allTags.length; j++) {
      const s = stringSimilarity(allTags[i]!.slug, allTags[j]!.slug);
      if (s > TAG_SIMILARITY_THRESHOLD && s < 1) similar++;
    }
  }
  return {
    all,
    featured,
    rare,
    similar,
    rareHint: `${rare} etiket 2'den az haberde kullanılıyor`,
  };
}

/** Public + panel liste */
tagRoutes.get("/", async (c) => {
  const featuredOnly = c.req.query("featured") === "1";
  const filter = c.req.query("filter") ?? (featuredOnly ? "featured" : "all");
  const q = (c.req.query("q") ?? "").trim().toLocaleLowerCase("tr-TR");
  const page = Math.max(1, Number(c.req.query("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query("limit") || 25)));

  if (filter === "similar") {
    const rows = await prisma.tag.findMany({
      where: { status: "aktif" },
      include: tagInclude,
      orderBy: { name: "asc" },
      take: 400,
    });
    const pairs: Array<{ a: ReturnType<typeof mapTag>; b: ReturnType<typeof mapTag>; score: number }> =
      [];
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const score = stringSimilarity(rows[i]!.slug, rows[j]!.slug);
        if (score > TAG_SIMILARITY_THRESHOLD && score < 1) {
          pairs.push({
            a: mapTag(rows[i] as TagRow),
            b: mapTag(rows[j] as TagRow),
            score,
          });
        }
      }
    }
    pairs.sort((x, y) => y.score - x.score);
    const counts = await tabCounts();
    const slice = pairs.slice((page - 1) * limit, page * limit);
    return c.json({
      data: slice,
      meta: {
        page,
        limit,
        total: pairs.length,
        totalPages: Math.max(1, Math.ceil(pairs.length / limit)),
        counts: {
          all: counts.all,
          featured: counts.featured,
          rare: counts.rare,
          similar: counts.similar,
        },
        rareHint: counts.rareHint,
      },
    });
  }

  const rows = await prisma.tag.findMany({
    where: { status: "aktif" },
    include: tagInclude,
    orderBy: [
      { isFeatured: "desc" },
      { featuredOrder: "asc" },
      { lastUsedAt: "desc" },
      { name: "asc" },
    ],
  });

  let list = rows.map((r) => mapTag(r as TagRow));

  if (featuredOnly || filter === "featured") {
    list = list
      .filter((t) => t.isFeatured)
      .sort(
        (a, b) =>
          (a.featuredOrder ?? 0) - (b.featuredOrder ?? 0) ||
          a.name.localeCompare(b.name, "tr"),
      );
  } else if (filter === "rare") {
    list = list.filter((t) => (t.articleCount ?? 0) < 2);
  }

  if (q) {
    list = list.filter(
      (t) =>
        t.name.includes(q) ||
        t.slug.includes(tagSlugFromName(q)) ||
        t.slug.includes(q),
    );
  }

  // Benzer ipucu (panel)
  const bySlug = list.map((t) => t.slug);
  for (const t of list) {
    let best: { slug: string; score: number } | null = null;
    for (const other of bySlug) {
      if (other === t.slug) continue;
      const score = stringSimilarity(t.slug, other);
      if (score > TAG_SIMILARITY_THRESHOLD && score < 1) {
        if (!best || score > best.score) best = { slug: other, score };
      }
    }
    if (best) {
      t.similarHint = best.slug;
    }
  }

  const total = list.length;
  const data = list.slice((page - 1) * limit, page * limit);
  const counts = await tabCounts();

  return c.json({
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      counts: {
        all: counts.all,
        featured: counts.featured,
        rare: counts.rare,
        similar: counts.similar,
      },
      rareHint: counts.rareHint,
    },
  });
});

/** Autocomplete — editör */
tagRoutes.get("/suggest", async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  if (q.length < 1) return c.json([]);
  const limit = Math.min(20, Math.max(1, Number(c.req.query("limit") || 12)));
  const slugQ = tagSlugFromName(q);
  const rows = await prisma.tag.findMany({
    where: {
      status: "aktif",
      OR: [
        { name: { contains: q } },
        { name: { contains: q.toLocaleLowerCase("tr-TR") } },
        { slug: { contains: slugQ } },
      ],
    },
    include: tagInclude,
    take: limit * 2,
    orderBy: { lastUsedAt: "desc" },
  });
  // Sırala: slug startsWith önde, sonra similarity
  const mapped = rows
    .map((r) => {
      const m = mapTag(r as TagRow);
      const sim = Math.max(
        stringSimilarity(r.slug, slugQ),
        stringSimilarity(r.name, q.toLocaleLowerCase("tr-TR")),
      );
      return { ...m, _sim: sim };
    })
    .sort((a, b) => b._sim - a._sim)
    .slice(0, limit)
    .map(({ _sim, ...rest }) => {
      void _sim;
      return rest;
    });
  return c.json(mapped);
});

tagRoutes.get("/slug/:slug", async (c) => {
  const tag = await prisma.tag.findUnique({
    where: { slug: c.req.param("slug") },
    include: tagInclude,
  });
  if (!tag || tag.status === "pasif") {
    throw new HTTPException(404, { message: "Etiket bulunamadı" });
  }
  return c.json(mapTag(tag as TagRow));
});

tagRoutes.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "EDITOR", "MUHABIR", "YAZAR"),
  async (c) => {
    const body = TagInputSchema.parse(await c.req.json());
    let prepared;
    try {
      prepared = prepareTagName(body.name);
    } catch (e) {
      throw new HTTPException(400, {
        message: e instanceof Error ? e.message : "Geçersiz etiket",
      });
    }

    const existing = await prisma.tag.findUnique({
      where: { slug: prepared.slug },
    });
    if (existing) {
      throw new HTTPException(409, {
        message: `Aynı slug zaten var: «${existing.name}» — birleştirin veya mevcut etiketi kullanın`,
      });
    }

    if (body.isFeatured) {
      const fc = await prisma.tag.count({ where: { isFeatured: true } });
      if (fc >= TAG_FEATURED_MAX) {
        throw new HTTPException(400, {
          message: `En fazla ${TAG_FEATURED_MAX} öne çıkan etiket`,
        });
      }
    }

    const tag = await prisma.tag.create({
      data: {
        name: prepared.name,
        slug: prepared.slug,
        isFeatured: body.isFeatured ?? false,
        featuredOrder: body.featuredOrder ?? 0,
        status: body.status ?? "aktif",
      },
      include: tagInclude,
    });
    return c.json(mapTag(tag as TagRow), 201);
  },
);

tagRoutes.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const id = c.req.param("id");
    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) throw new HTTPException(404, { message: "Etiket yok" });

    const body = TagPatchSchema.parse(await c.req.json());
    let nextName = existing.name;
    let nextSlug = existing.slug;
    const slugChanged =
      body.name !== undefined &&
      tagSlugFromName(body.name) !== existing.slug;

    if (body.name !== undefined) {
      try {
        const p = prepareTagName(body.name);
        nextName = p.name;
        nextSlug = p.slug;
      } catch (e) {
        throw new HTTPException(400, {
          message: e instanceof Error ? e.message : "Geçersiz",
        });
      }
      if (nextSlug !== existing.slug) {
        const clash = await prisma.tag.findUnique({ where: { slug: nextSlug } });
        if (clash && clash.id !== id) {
          throw new HTTPException(409, {
            message: `Slug «${nextSlug}» başka etikette — birleştirme kullanın`,
          });
        }
      }
    }

    if (body.isFeatured === true && !existing.isFeatured) {
      const fc = await prisma.tag.count({ where: { isFeatured: true } });
      if (fc >= TAG_FEATURED_MAX) {
        throw new HTTPException(400, {
          message: `En fazla ${TAG_FEATURED_MAX} öne çıkan etiket`,
        });
      }
    }

    const tag = await prisma.$transaction(async (tx) => {
      if (slugChanged) {
        const from = pathForTagSlug(existing.slug);
        const to = pathForTagSlug(nextSlug);
        await tx.redirect.upsert({
          where: { fromPath: from },
          create: { fromPath: from, toPath: to, code: 301 },
          update: { toPath: to, code: 301 },
        });
        await tx.redirect.updateMany({
          where: { toPath: from },
          data: { toPath: to },
        });
      }
      return tx.tag.update({
        where: { id },
        data: {
          name: nextName,
          slug: nextSlug,
          ...(body.isFeatured !== undefined
            ? { isFeatured: body.isFeatured }
            : {}),
          ...(body.featuredOrder !== undefined
            ? { featuredOrder: body.featuredOrder }
            : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
        },
        include: tagInclude,
      });
    });

    if (slugChanged) {
      void revalidateWeb(
        [pathForTagSlug(existing.slug), pathForTagSlug(nextSlug), "/"],
        ["tags"],
      );
    }

    return c.json(mapTag(tag as TagRow));
  },
);

/** Birleştir — ilişkiler taşı, 301, kaynak sil, audit */
tagRoutes.post(
  "/merge",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const user = c.get("user");
    const body = TagMergeSchema.parse(await c.req.json());
    const sources = body.sourceIds.filter((id) => id !== body.targetId);
    if (!sources.length) {
      throw new HTTPException(400, { message: "Kaynak id gerekli" });
    }

    const target = await prisma.tag.findUnique({
      where: { id: body.targetId },
      include: tagInclude,
    });
    if (!target) {
      throw new HTTPException(404, { message: "Hedef etiket yok" });
    }

    const sourceRows = await prisma.tag.findMany({
      where: { id: { in: sources } },
      include: tagInclude,
    });
    if (sourceRows.length !== sources.length) {
      throw new HTTPException(404, { message: "Kaynak etiket bulunamadı" });
    }

    const result = await prisma.$transaction(async (tx) => {
      let movedLinks = 0;
      for (const src of sourceRows) {
        const links = await tx.articleTag.findMany({
          where: { tagId: src.id },
        });
        for (const link of links) {
          const exists = await tx.articleTag.findUnique({
            where: {
              articleId_tagId: {
                articleId: link.articleId,
                tagId: target.id,
              },
            },
          });
          if (!exists) {
            await tx.articleTag.create({
              data: { articleId: link.articleId, tagId: target.id },
            });
            movedLinks++;
          }
        }
        await tx.articleTag.deleteMany({ where: { tagId: src.id } });

        const from = pathForTagSlug(src.slug);
        const to = pathForTagSlug(target.slug);
        await tx.redirect.upsert({
          where: { fromPath: from },
          create: { fromPath: from, toPath: to, code: 301 },
          update: { toPath: to, code: 301 },
        });
        await tx.redirect.updateMany({
          where: { toPath: from },
          data: { toPath: to },
        });
        await tx.tag.delete({ where: { id: src.id } });
      }

      await tx.tag.update({
        where: { id: target.id },
        data: { lastUsedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "tag.merge",
          entityType: "tag",
          entityId: target.id,
          meta: JSON.stringify({
            target: { id: target.id, slug: target.slug, name: target.name },
            sources: sourceRows.map((s) => ({
              id: s.id,
              slug: s.slug,
              name: s.name,
              articleCount: s._count.articles,
            })),
            movedLinks,
          }),
        },
      });

      return { movedLinks };
    });

    void revalidateWeb(
      [
        pathForTagSlug(target.slug),
        ...sourceRows.map((s) => pathForTagSlug(s.slug)),
        "/",
      ],
      ["tags"],
    );

    const fresh = await prisma.tag.findUnique({
      where: { id: target.id },
      include: tagInclude,
    });
    return c.json({
      ok: true as const,
      target: mapTag(fresh as TagRow),
      merged: sourceRows.map((s) => s.id),
      movedLinks: result.movedLinks,
    });
  },
);

tagRoutes.post(
  "/bulk",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const user = c.get("user");
    const body = TagBulkSchema.parse(await c.req.json());

    if (body.action === "feature") {
      const current = await prisma.tag.count({ where: { isFeatured: true } });
      const adding = await prisma.tag.count({
        where: { id: { in: body.ids }, isFeatured: false },
      });
      if (current + adding > TAG_FEATURED_MAX) {
        throw new HTTPException(400, {
          message: `Öne çıkan tavanı ${TAG_FEATURED_MAX}`,
        });
      }
      await prisma.tag.updateMany({
        where: { id: { in: body.ids } },
        data: { isFeatured: true },
      });
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: "tag.feature",
          entityType: "tag",
          meta: JSON.stringify({ ids: body.ids }),
        },
      });
      return c.json({ ok: true as const });
    }

    if (body.action === "unfeature") {
      await prisma.tag.updateMany({
        where: { id: { in: body.ids } },
        data: { isFeatured: false, featuredOrder: 0 },
      });
      return c.json({ ok: true as const });
    }

    // delete — yalnızca 0 haber (birleştirme zorunlu değilse boş etiket)
    const tags = await prisma.tag.findMany({
      where: { id: { in: body.ids } },
      include: tagInclude,
    });
    const blocked = tags.filter((t) => t._count.articles > 0);
    if (blocked.length) {
      throw new HTTPException(400, {
        message: `Haberli etiket silinemez — birleştirin: ${blocked.map((t) => t.name).join(", ")}`,
      });
    }

    await prisma.$transaction(async (tx) => {
      for (const t of tags) {
        await tx.redirect.upsert({
          where: { fromPath: pathForTagSlug(t.slug) },
          create: {
            fromPath: pathForTagSlug(t.slug),
            toPath: "/",
            code: 301,
          },
          update: { toPath: "/", code: 301 },
        });
        await tx.tag.delete({ where: { id: t.id } });
      }
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "tag.delete",
          entityType: "tag",
          meta: JSON.stringify({
            tags: tags.map((t) => ({ id: t.id, slug: t.slug, name: t.name })),
          }),
        },
      });
    });

    return c.json({ ok: true as const, deleted: tags.length });
  },
);

/** Ayda bir temizlik: 12 ay + &lt;2 haber */
tagRoutes.post(
  "/cleanup",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const user = c.get("user");
    const months = Math.max(1, Number(c.req.query("months") || 12));
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    const candidates = await prisma.tag.findMany({
      where: {
        isFeatured: false,
        OR: [{ lastUsedAt: null }, { lastUsedAt: { lt: cutoff } }],
      },
      include: tagInclude,
    });
    const toDelete = candidates.filter((t) => t._count.articles < 2);

    await prisma.$transaction(async (tx) => {
      for (const t of toDelete) {
        await tx.articleTag.deleteMany({ where: { tagId: t.id } });
        await tx.redirect.upsert({
          where: { fromPath: pathForTagSlug(t.slug) },
          create: {
            fromPath: pathForTagSlug(t.slug),
            toPath: "/",
            code: 301,
          },
          update: { toPath: "/", code: 301 },
        });
        await tx.tag.delete({ where: { id: t.id } });
      }
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "tag.cleanup",
          entityType: "tag",
          meta: JSON.stringify({
            months,
            deleted: toDelete.map((t) => ({
              id: t.id,
              slug: t.slug,
              articles: t._count.articles,
            })),
          }),
        },
      });
    });

    return c.json({
      ok: true as const,
      deleted: toDelete.length,
      indexMin: TAG_INDEX_MIN,
    });
  },
);

tagRoutes.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const id = c.req.param("id");
    const existing = await prisma.tag.findUnique({
      where: { id },
      include: tagInclude,
    });
    if (!existing) throw new HTTPException(404, { message: "Etiket yok" });
    if (existing._count.articles > 0) {
      throw new HTTPException(400, {
        message: "Haberli etiket silinemez — birleştirme kullanın",
      });
    }

    const user = c.get("user");
    await prisma.$transaction(async (tx) => {
      await tx.redirect.upsert({
        where: { fromPath: pathForTagSlug(existing.slug) },
        create: {
          fromPath: pathForTagSlug(existing.slug),
          toPath: "/",
          code: 301,
        },
        update: { toPath: "/", code: 301 },
      });
      await tx.tag.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "tag.delete",
          entityType: "tag",
          entityId: id,
          meta: JSON.stringify({
            slug: existing.slug,
            name: existing.name,
          }),
        },
      });
    });
    return c.json({ ok: true as const });
  },
);
