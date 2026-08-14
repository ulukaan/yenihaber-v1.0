import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "@yenihaber/database";
import {
  MENU_LOCATION_META,
  MenuItemInputSchema,
  MenuItemPatchSchema,
  MenuLocationSchema,
  MenuReorderSchema,
} from "@yenihaber/shared";
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from "../lib/auth";
import { revalidateWeb } from "../lib/revalidate";
import {
  copyHeaderToSidebar,
  ensureMenus,
  getMenuByLocation,
} from "../lib/menus";

export const menuRoutes = new Hono<{ Variables: AuthVariables }>();

async function bumpMenu() {
  await revalidateWeb(["/"], ["menu"]);
}

/** Admin — pasifler dahil */
menuRoutes.get(
  "/admin/:location",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const location = MenuLocationSchema.parse(c.req.param("location"));
    const menu = await getMenuByLocation(location, {
      includeInactive: true,
      withMega: false,
    });
    return c.json({
      menu,
      meta: MENU_LOCATION_META[location],
    });
  },
);

menuRoutes.post(
  "/admin/:location/items",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const location = MenuLocationSchema.parse(c.req.param("location"));
    await ensureMenus();
    const menu = await prisma.menu.findUniqueOrThrow({
      where: { location },
    });
    const body = MenuItemInputSchema.parse(await c.req.json());
    const meta = MENU_LOCATION_META[location];

    if (body.parentId) {
      if (meta.maxDepth < 2 || location === "icons" || location === "footer") {
        throw new HTTPException(400, {
          message: "Bu lokasyonda alt öğe yok",
        });
      }
      const parent = await prisma.menuItem.findFirst({
        where: { id: body.parentId, menuId: menu.id },
      });
      if (!parent) throw new HTTPException(400, { message: "Üst öğe yok" });
      if (parent.parentId) {
        throw new HTTPException(400, {
          message: "En fazla iki seviye",
        });
      }
    } else {
      const roots = await prisma.menuItem.count({
        where: { menuId: menu.id, parentId: null },
      });
      if (roots >= meta.maxRoots) {
        throw new HTTPException(400, {
          message: `En fazla ${meta.maxRoots} kök öğe`,
        });
      }
    }

    if (location === "icons" && body.type !== "icon") {
      throw new HTTPException(400, {
        message: "İkonlar sekmesinde yalnızca icon tipi",
      });
    }

    const siblings = await prisma.menuItem.count({
      where: {
        menuId: menu.id,
        parentId: body.parentId ?? null,
      },
    });

    const item = await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        parentId: body.parentId ?? null,
        sortOrder: body.sortOrder ?? siblings,
        type: body.type,
        refId: body.refId ?? null,
        label: body.label ?? null,
        url: body.url ?? null,
        icon: body.icon ?? null,
        badgeText: body.badgeText ?? null,
        badgeColor: body.badgeColor ?? null,
        dropdownType: body.dropdownType ?? "simple",
        targetBlank: body.targetBlank ?? false,
        device: body.device ?? "all",
        isActive: body.isActive ?? true,
        startAt: body.startAt ? new Date(body.startAt) : null,
        endAt: body.endAt ? new Date(body.endAt) : null,
      },
    });
    await bumpMenu();
    return c.json({ item }, 201);
  },
);

menuRoutes.patch(
  "/admin/items/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const id = c.req.param("id");
    const existing = await prisma.menuItem.findUnique({
      where: { id },
      include: { menu: true },
    });
    if (!existing) throw new HTTPException(404, { message: "Öğe yok" });

    const body = MenuItemPatchSchema.parse(await c.req.json());

    // Arama ikonu kilitli — kapatılamaz
    if (
      existing.menu.location === "icons" &&
      existing.refId === "search" &&
      body.isActive === false
    ) {
      throw new HTTPException(400, {
        message: "Arama kapatılamaz",
      });
    }

    const item = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(body.parentId !== undefined ? { parentId: body.parentId } : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.refId !== undefined ? { refId: body.refId } : {}),
        ...(body.label !== undefined ? { label: body.label } : {}),
        ...(body.url !== undefined ? { url: body.url } : {}),
        ...(body.icon !== undefined ? { icon: body.icon } : {}),
        ...(body.badgeText !== undefined ? { badgeText: body.badgeText } : {}),
        ...(body.badgeColor !== undefined
          ? { badgeColor: body.badgeColor }
          : {}),
        ...(body.dropdownType !== undefined
          ? { dropdownType: body.dropdownType }
          : {}),
        ...(body.targetBlank !== undefined
          ? { targetBlank: body.targetBlank }
          : {}),
        ...(body.device !== undefined ? { device: body.device } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.startAt !== undefined
          ? { startAt: body.startAt ? new Date(body.startAt) : null }
          : {}),
        ...(body.endAt !== undefined
          ? { endAt: body.endAt ? new Date(body.endAt) : null }
          : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      },
    });
    await bumpMenu();
    return c.json({ item });
  },
);

menuRoutes.post(
  "/admin/:location/reorder",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const location = MenuLocationSchema.parse(c.req.param("location"));
    const body = MenuReorderSchema.parse(await c.req.json());
    const menu = await prisma.menu.findUniqueOrThrow({ where: { location } });

    await prisma.$transaction(
      body.orderedIds.map((id, i) =>
        prisma.menuItem.updateMany({
          where: {
            id,
            menuId: menu.id,
            parentId: body.parentId ?? null,
          },
          data: { sortOrder: i },
        }),
      ),
    );
    await bumpMenu();
    return c.json({ ok: true });
  },
);

menuRoutes.post(
  "/admin/sidebar/copy-header",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    await ensureMenus();
    await copyHeaderToSidebar();
    await bumpMenu();
    const menu = await getMenuByLocation("sidebar", {
      includeInactive: true,
    });
    return c.json({ menu });
  },
);

menuRoutes.delete(
  "/admin/items/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const id = c.req.param("id");
    const hard =
      c.req.query("hard") === "1" || c.req.query("hard") === "true";
    const existing = await prisma.menuItem.findUnique({
      where: { id },
      include: { menu: true },
    });
    if (!existing) throw new HTTPException(404, { message: "Öğe yok" });
    if (
      existing.menu.location === "icons" &&
      existing.refId === "search"
    ) {
      throw new HTTPException(400, { message: "Arama silinemez" });
    }
    if (hard) {
      await prisma.menuItem.delete({ where: { id } });
      await bumpMenu();
      return c.json({ ok: true, soft: false });
    }
    await prisma.menuItem.update({
      where: { id },
      data: { isActive: false },
    });
    await bumpMenu();
    return c.json({ ok: true, soft: true });
  },
);

/** Public — görünür öğeler + mega cache (admin rotalarından sonra) */
menuRoutes.get("/:location", async (c) => {
  const location = MenuLocationSchema.parse(c.req.param("location"));
  const menu = await getMenuByLocation(location, {
    includeInactive: false,
    withMega: location === "header",
  });
  c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
  return c.json({ menu });
});
