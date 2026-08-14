import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "@yenihaber/database";
import { PaginationSchema } from "@yenihaber/shared";
import { articleInclude, mapArticle, mapAuthor } from "../lib/mappers.js";

export const authorRoutes = new Hono();

/** Köşe / yazar listesi — public Author tablosu */
authorRoutes.get("/", async (c) => {
  const columnistsOnly = c.req.query("columnistsOnly") === "true";
  const q = (c.req.query("q") ?? "").trim();
  const limit = Math.min(
    48,
    Math.max(1, Number(c.req.query("limit") ?? (columnistsOnly ? 12 : q ? 16 : 24))),
  );

  const authors = await prisma.author.findMany({
    where: {
      status: "yayinda",
      AND: [
        columnistsOnly
          ? { isColumnist: true }
          : {
              OR: [
                { isColumnist: true },
                { articles: { some: { status: "YAYINDA" } } },
              ],
            },
        ...(q
          ? [
              {
                OR: [
                  { displayName: { contains: q } },
                  { title: { contains: q } },
                  { bio: { contains: q } },
                  { slug: { contains: q } },
                ],
              },
            ]
          : []),
      ],
    },
    select: {
      id: true,
      displayName: true,
      slug: true,
      title: true,
      bio: true,
      photoUrl: true,
      twitterUrl: true,
      linkedinUrl: true,
      isColumnist: true,
      columnistOrder: true,
      _count: {
        select: { articles: { where: { status: "YAYINDA" } } },
      },
      articles: {
        where: { status: "YAYINDA" },
        orderBy: { publishedAt: "desc" },
        take: 1,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          publishedAt: true,
          coverImage: true,
          _count: {
            select: {
              comments: { where: { status: "ONAYLI" } },
            },
          },
        },
      },
    },
    orderBy: columnistsOnly
      ? [{ columnistOrder: "asc" }, { displayName: "asc" }]
      : [{ displayName: "asc" }],
    take: limit,
  });

  return c.json(authors.map(mapAuthor));
});

authorRoutes.get("/slug/:slug", async (c) => {
  const slug = c.req.param("slug");
  const query = PaginationSchema.parse({
    page: c.req.query("page"),
    limit: c.req.query("limit") ?? "12",
  });

  const author = await prisma.author.findFirst({
    where: { slug, status: "yayinda" },
  });
  if (!author) {
    throw new HTTPException(404, { message: "Yazar bulunamadı" });
  }

  const where = { authorId: author.id, status: "YAYINDA" as const };
  const [total, rows] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      include: articleInclude,
      orderBy: { publishedAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return c.json({
    author: mapAuthor({
      ...author,
      _count: { articles: total },
    }),
    articles: {
      data: rows.map(mapArticle),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    },
  });
});
