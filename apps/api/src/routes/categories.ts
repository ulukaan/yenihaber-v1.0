import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "@yenihaber/database";
import {
  CacheTags,
  CATEGORY_MAX_ROOT,
  CATEGORY_MAX_TOTAL,
  CategoryInputSchema,
  CategoryMoveSchema,
  CategoryPatchSchema,
  COLOR_DISTANCE_WARN,
  colorDistance,
  HomeRailsSaveSchema,
} from "@yenihaber/shared";
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from "../lib/auth.js";
import { mapCategory } from "../lib/mappers.js";
import { revalidateWeb } from "../lib/revalidate.js";

function revalidateHomeRails() {
  void revalidateWeb(["/"], [CacheTags.anasayfa, CacheTags.seritler]);
}

export const categoryRoutes = new Hono<{ Variables: AuthVariables }>();

const categoryInclude = {
  _count: { select: { articles: true, children: true } },
  parent: { select: { id: true, name: true, slug: true } },
} as const;

function pathForSlug(slug: string) {
  return `/kategori/${slug}`;
}

async function assertDepthOk(parentId: string | null | undefined) {
  if (!parentId) return;
  const parent = await prisma.category.findUnique({ where: { id: parentId } });
  if (!parent) throw new HTTPException(400, { message: "Üst kategori yok" });
  if (parent.parentId) {
    throw new HTTPException(400, {
      message: "En fazla iki seviye: alt kategorinin altı olamaz",
    });
  }
}

async function assertPartyColorOk(
  color: string | null | undefined,
  excludeId?: string,
  forceColor = false,
) {
  if (!color) return;
  const others = await prisma.category.findMany({
    where: {
      bucket: "parti",
      color: { not: null },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, name: true, color: true },
  });
  const close = others.find(
    (p) => p.color && colorDistance(p.color, color) < COLOR_DISTANCE_WARN,
  );
  if (close && !forceColor) {
    throw new HTTPException(409, {
      message: `“${close.name}” ile renk çok yakın. forceColor: true ile yine de kaydedebilirsiniz.`,
    });
  }
}

categoryRoutes.get("/", async (c) => {
  const tree = c.req.query("tree") === "1";
  const homeOnly = c.req.query("home") === "1";
  const menuOnly = c.req.query("menu") === "1";
  const bucket = c.req.query("bucket")?.trim() || undefined;
  const bucketWhere = bucket
    ? { bucket: bucket }
    : {};

  if (tree) {
    const roots = await prisma.category.findMany({
      where: { parentId: null, status: "aktif", ...bucketWhere },
      orderBy: [{ menuOrder: "asc" }, { sortOrder: "asc" }],
      include: {
        ...categoryInclude,
        children: {
          where: { status: "aktif", ...bucketWhere },
          orderBy: [{ menuOrder: "asc" }, { sortOrder: "asc" }],
          include: categoryInclude,
        },
      },
    });
    return c.json(roots.map(mapCategory));
  }

  const rows = await prisma.category.findMany({
    where: {
      status: "aktif",
      ...bucketWhere,
      ...(homeOnly ? { onHome: true } : {}),
      ...(menuOnly ? { inMenu: true } : {}),
    },
    orderBy: homeOnly
      ? [{ homeOrder: "asc" }, { sortOrder: "asc" }]
      : menuOnly
        ? [{ menuOrder: "asc" }, { sortOrder: "asc" }]
        : [{ sortOrder: "asc" }, { name: "asc" }],
    include: categoryInclude,
  });
  return c.json(rows.map(mapCategory));
});

categoryRoutes.get("/slug/:slug", async (c) => {
  const category = await prisma.category.findUnique({
    where: { slug: c.req.param("slug") },
    include: {
      ...categoryInclude,
      children: {
        where: { status: "aktif" },
        orderBy: { sortOrder: "asc" },
        include: categoryInclude,
      },
    },
  });
  if (!category || category.status === "pasif") {
    throw new HTTPException(404, { message: "Kategori bulunamadı" });
  }
  return c.json(mapCategory(category));
});

/** Ana sayfa şeritleri — toplu kaydet + tek revalidate (/:id'den önce) */
categoryRoutes.put(
  "/home-rails",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const body = HomeRailsSaveSchema.parse(await c.req.json());
    const onIds = new Set(
      body.items.filter((i) => i.onHome).map((i) => i.id),
    );

    await prisma.$transaction(async (tx) => {
      const currentlyOn = await tx.category.findMany({
        where: { onHome: true },
        select: { id: true },
      });
      for (const row of currentlyOn) {
        if (!onIds.has(row.id)) {
          await tx.category.update({
            where: { id: row.id },
            data: { onHome: false, homeOrder: 0 },
          });
        }
      }
      for (const item of body.items) {
        await tx.category.update({
          where: { id: item.id },
          data: {
            onHome: item.onHome,
            homeOrder: item.onHome ? item.homeOrder : 0,
            ...(item.color !== undefined ? { color: item.color } : {}),
          },
        });
      }
    });

    await revalidateWeb(["/"], [CacheTags.anasayfa, CacheTags.seritler]);

    const home = await prisma.category.findMany({
      where: { onHome: true, status: "aktif" },
      orderBy: [{ homeOrder: "asc" }, { sortOrder: "asc" }],
      include: categoryInclude,
    });
    return c.json({ ok: true as const, data: home.map(mapCategory) });
  },
);

categoryRoutes.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const body = CategoryInputSchema.parse(await c.req.json());
    const parentId = body.parentId ?? null;
    await assertDepthOk(parentId);

    const total = await prisma.category.count();
    if (total >= CATEGORY_MAX_TOTAL) {
      throw new HTTPException(400, {
        message: `En fazla ${CATEGORY_MAX_TOTAL} kategori — konuları etiketle ayırın`,
      });
    }
    if (!parentId) {
      const roots = await prisma.category.count({ where: { parentId: null } });
      if (roots >= CATEGORY_MAX_ROOT) {
        throw new HTTPException(400, {
          message: `Ana kategori tavanı ${CATEGORY_MAX_ROOT}. Yeni konu için etiket kullanın`,
        });
      }
    }

    const commentsEnabled =
      body.disableQuickComment !== undefined
        ? !body.disableQuickComment
        : body.commentsEnabled;

    if ((body.bucket ?? "haber") === "parti") {
      await assertPartyColorOk(body.color, undefined, Boolean(body.forceColor));
    }

    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug: body.slug,
        sortOrder: body.sortOrder ?? body.menuOrder ?? 0,
        description: body.description,
        parentId,
        inMenu: body.inMenu,
        menuOrder: body.menuOrder ?? body.sortOrder ?? 0,
        onHome: body.onHome,
        homeOrder: body.homeOrder,
        commentsEnabled,
        disableQuickComment: !commentsEnabled,
        defaultCover: body.defaultCover || null,
        status: body.status,
        bucket: body.bucket ?? "haber",
        pageTemplate: body.pageTemplate ?? "magazine",
        color: body.color ?? null,
        logoUrl: body.logoUrl || null,
      },
      include: categoryInclude,
    });
    return c.json(mapCategory(category), 201);
  },
);

categoryRoutes.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const id = c.req.param("id");
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new HTTPException(404, { message: "Kategori bulunamadı" });
    }

    const body = CategoryPatchSchema.parse(await c.req.json());

    const nextBucket = body.bucket ?? existing.bucket;
    const nextColor =
      body.color !== undefined ? body.color : existing.color;
    if (nextBucket === "parti") {
      if (!nextColor) {
        throw new HTTPException(400, {
          message: "Parti kategorisinde renk zorunlu",
        });
      }
      if (body.color !== undefined) {
        await assertPartyColorOk(body.color, id, Boolean(body.forceColor));
      }
    }

    const nextParent =
      body.parentId !== undefined ? body.parentId : existing.parentId;
    if (nextParent === id) {
      throw new HTTPException(400, { message: "Kategori kendisinin üstü olamaz" });
    }
    await assertDepthOk(nextParent);
    // Mevcut kökün çocuğunu üst yapma
    if (nextParent) {
      const childCount = await prisma.category.count({
        where: { parentId: id },
      });
      if (childCount > 0) {
        throw new HTTPException(400, {
          message: "Alt kategorisi olan kayıt iki seviyenin altına inemez",
        });
      }
    }

    const commentsEnabled =
      body.commentsEnabled !== undefined
        ? body.commentsEnabled
        : body.disableQuickComment !== undefined
          ? !body.disableQuickComment
          : undefined;

    const nextSlug = body.slug ?? existing.slug;
    const slugChanged = nextSlug !== existing.slug;

    const category = await prisma.$transaction(async (tx) => {
      if (slugChanged) {
        const from = pathForSlug(existing.slug);
        const to = pathForSlug(nextSlug);
        await tx.redirect.upsert({
          where: { fromPath: from },
          create: { fromPath: from, toPath: to, code: 301 },
          update: { toPath: to, code: 301 },
        });
        // Zincir: eski to_path = from olan kayıtları da güncelle
        await tx.redirect.updateMany({
          where: { toPath: from },
          data: { toPath: to },
        });
      }

      return tx.category.update({
        where: { id },
        data: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.slug !== undefined ? { slug: body.slug } : {}),
          ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
          ...(body.description !== undefined
            ? { description: body.description }
            : {}),
          ...(body.parentId !== undefined ? { parentId: body.parentId } : {}),
          ...(body.inMenu !== undefined ? { inMenu: body.inMenu } : {}),
          ...(body.menuOrder !== undefined ? { menuOrder: body.menuOrder } : {}),
          ...(body.onHome !== undefined ? { onHome: body.onHome } : {}),
          ...(body.homeOrder !== undefined ? { homeOrder: body.homeOrder } : {}),
          ...(commentsEnabled !== undefined
            ? {
                commentsEnabled,
                disableQuickComment: !commentsEnabled,
              }
            : {}),
          ...(body.defaultCover !== undefined
            ? { defaultCover: body.defaultCover || null }
            : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.bucket !== undefined ? { bucket: body.bucket } : {}),
          ...(body.pageTemplate !== undefined
            ? { pageTemplate: body.pageTemplate }
            : {}),
          ...(body.color !== undefined ? { color: body.color } : {}),
          ...(body.logoUrl !== undefined
            ? { logoUrl: body.logoUrl || null }
            : {}),
        },
        include: categoryInclude,
      });
    });

    const homeTouched =
      body.onHome !== undefined ||
      body.homeOrder !== undefined ||
      body.color !== undefined;

    if (slugChanged) {
      void revalidateWeb(
        [pathForSlug(existing.slug), pathForSlug(nextSlug), "/"],
        [
          "categories",
          CacheTags.anasayfa,
          CacheTags.seritler,
          CacheTags.kategori(existing.slug),
          CacheTags.kategori(nextSlug),
        ],
      );
    } else if (homeTouched) {
      revalidateHomeRails();
    }

    return c.json(mapCategory(category));
  },
);

/** Haberleri başka kategoriye taşı */
categoryRoutes.post(
  "/:id/move-articles",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const id = c.req.param("id");
    const body = CategoryMoveSchema.parse(await c.req.json());
    if (body.targetCategoryId === id) {
      throw new HTTPException(400, { message: "Hedef farklı olmalı" });
    }
    const [src, target] = await Promise.all([
      prisma.category.findUnique({ where: { id } }),
      prisma.category.findUnique({ where: { id: body.targetCategoryId } }),
    ]);
    if (!src || !target) {
      throw new HTTPException(404, { message: "Kategori bulunamadı" });
    }
    const result = await prisma.article.updateMany({
      where: { categoryId: id },
      data: { categoryId: body.targetCategoryId },
    });
    return c.json({ ok: true as const, moved: result.count });
  },
);

categoryRoutes.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const id = c.req.param("id");
    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { articles: true, children: true } },
      },
    });
    if (!existing) {
      throw new HTTPException(404, { message: "Kategori bulunamadı" });
    }
    if (existing._count.articles > 0) {
      throw new HTTPException(400, {
        message: "Silmek için önce haberleri başka kategoriye taşıyın",
      });
    }
    if (existing._count.children > 0) {
      throw new HTTPException(400, {
        message: "Önce alt kategorileri taşıyın veya silin",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.redirect.upsert({
        where: { fromPath: pathForSlug(existing.slug) },
        create: {
          fromPath: pathForSlug(existing.slug),
          toPath: "/",
          code: 301,
        },
        update: { toPath: "/", code: 301 },
      });
      await tx.category.delete({ where: { id } });
    });

    return c.json({ ok: true as const });
  },
);
