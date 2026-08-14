import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "@yenihaber/database";
import { resolveAdminOrigin } from "@yenihaber/config";
import {
  AdminUserDeleteSchema,
  AdminUserUpdateSchema,
  AuthorAdminCreateSchema,
  AuthorAdminUpdateSchema,
  PANEL_ROLE_LABELS,
  ROLE_CAPABILITIES,
  UserInviteCreateSchema,
  hasCapability,
  slugify,
  type InviteStatus,
  type Role,
} from "@yenihaber/shared";
import {
  requireAuth,
  requireRole,
  type AuthVariables,
} from "../lib/auth";
import { hashToken, newOpaqueToken } from "../lib/authors-util";
import { sendInviteMail } from "../lib/mail";
import { issuePasswordReset } from "../lib/password-reset";

export const userRoutes = new Hono<{ Variables: AuthVariables }>();

const STALE_MS = 90 * 24 * 60 * 60 * 1000;
/** Davet 7 gün */
const INVITE_MS = 7 * 24 * 60 * 60 * 1000;

function inviteStatus(r: {
  acceptedAt: Date | null;
  expiresAt: Date;
}): InviteStatus {
  if (r.acceptedAt) return "kabul";
  if (r.expiresAt < new Date()) return "suresi_doldu";
  return "bekliyor";
}

function mapInvite(r: {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
  invitedBy: { id: string; name: string } | null;
}) {
  const status = inviteStatus(r);
  return {
    id: r.id,
    email: r.email,
    role: r.role as Role,
    expiresAt: r.expiresAt.toISOString(),
    acceptedAt: r.acceptedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    invitedBy: r.invitedBy,
    expired: status === "suresi_doldu",
    status,
  };
}

function mapStaffUser(u: {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  twofaEnabled: boolean;
  lastLoginAt: Date | null;
  avatarUrl: string | null;
  createdAt: Date;
  authorProfile: {
    id: string;
    slug: string;
    photoUrl: string | null;
    _count?: { articles: number };
  } | null;
}) {
  const last = u.lastLoginAt?.getTime() ?? u.createdAt.getTime();
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as Role,
    status: u.status as "aktif" | "askida",
    twofaEnabled: u.twofaEnabled,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    staleLogin: Date.now() - last > STALE_MS,
    avatarUrl: u.authorProfile?.photoUrl || u.avatarUrl || null,
    articleCount: u.authorProfile?._count?.articles ?? 0,
    authorId: u.authorProfile?.id ?? null,
    authorSlug: u.authorProfile?.slug ?? null,
    authorPhotoUrl: u.authorProfile?.photoUrl ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}

const userInclude = {
  authorProfile: {
    select: {
      id: true,
      slug: true,
      photoUrl: true,
      _count: { select: { articles: true } },
    },
  },
} as const;

async function countActiveAdmins(excludeId?: string) {
  return prisma.user.count({
    where: {
      role: "ADMIN",
      status: "aktif",
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
}

function adminPanelBase() {
  return resolveAdminOrigin();
}

function acceptUrlForToken(raw: string) {
  return `${adminPanelBase()}/login?invite=${encodeURIComponent(raw)}`;
}

/** Yetki matrisi */
userRoutes.get(
  "/capabilities",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    return c.json({
      labels: PANEL_ROLE_LABELS,
      matrix: ROLE_CAPABILITIES,
      roles: ["ADMIN", "EDITOR", "MUHABIR", "MODERATOR"],
    });
  },
);

/** Panel hesapları */
userRoutes.get("/", requireAuth, requireRole("ADMIN", "EDITOR"), async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  const users = await prisma.user.findMany({
    where: {
      role: { not: "UYE" },
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : {}),
    },
    include: userInclude,
    orderBy: [{ role: "asc" }, { name: "asc" }],
    take: 200,
  });
  return c.json(users.map(mapStaffUser));
});

/** Rol / durum / ad — silme yok, pasif varsayılan */
userRoutes.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const id = c.req.param("id");
    const actor = c.get("user");
    const body = AdminUserUpdateSchema.parse(await c.req.json());
    const existing = await prisma.user.findUnique({
      where: { id },
      include: userInclude,
    });
    if (!existing) throw new HTTPException(404, { message: "Kullanıcı bulunamadı" });

    // Kendi rolünü düşüremez
    if (body.role && body.role !== existing.role && actor.id === id) {
      throw new HTTPException(403, {
        message: "Kendi rolünüzü değiştiremezsiniz",
      });
    }
    // Kendi hesabını askıya alamaz
    if (body.status === "askida" && actor.id === id) {
      throw new HTTPException(403, {
        message: "Kendi hesabınızı pasife alamazsınız",
      });
    }
    // Son süper admin'in rolünü düşürme / pasife alma
    if (
      existing.role === "ADMIN" &&
      existing.status === "aktif" &&
      ((body.role && body.role !== "ADMIN") || body.status === "askida")
    ) {
      const others = await countActiveAdmins(id);
      if (others < 1) {
        throw new HTTPException(400, {
          message: "Son süper admin pasife alınamaz veya rolü düşürülemez",
        });
      }
    }

    if (body.role && body.role !== existing.role) {
      await prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: "user.role_change",
          entityType: "user",
          entityId: id,
          meta: JSON.stringify({
            from: existing.role,
            to: body.role,
            labelFrom: PANEL_ROLE_LABELS[existing.role],
            labelTo: PANEL_ROLE_LABELS[body.role],
          }),
        },
      });
    }
    if (body.status === "askida" && existing.status !== "askida") {
      await prisma.userSession.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: "user.suspend",
          entityType: "user",
          entityId: id,
        },
      });
    }
    if (body.status === "aktif" && existing.status === "askida") {
      await prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: "user.activate",
          entityType: "user",
          entityId: id,
        },
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.role !== undefined ? { role: body.role } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
      },
      include: userInclude,
    });
    return c.json(mapStaffUser(updated));
  },
);

/** Admin: hedef kullanıcı için tüm oturumları sonlandır */
userRoutes.post(
  "/:id/logout-all",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const id = c.req.param("id");
    const actor = c.get("user");
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) throw new HTTPException(404, { message: "Kullanıcı yok" });

    const result = await prisma.userSession.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "user.logout_all_admin",
        entityType: "user",
        entityId: id,
        meta: JSON.stringify({ count: result.count }),
      },
    });
    return c.json({ ok: true as const, revoked: result.count });
  },
);

/** Admin: şifre sıfırlama bağlantısı gönder (şifre yazmaz) */
userRoutes.post(
  "/:id/send-reset",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const id = c.req.param("id");
    const actor = c.get("user");
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new HTTPException(404, { message: "Kullanıcı yok" });

    await issuePasswordReset({
      userId: target.id,
      email: target.email,
      name: target.name,
      role: target.role,
      actorId: actor.id,
      reason: "admin_send",
    });
    return c.json({
      ok: true as const,
      message: "Şifre sıfırlama bağlantısı e-postaya gönderildi",
    });
  },
);

/**
 * Kalıcı silme — varsayılan aksiyon değil.
 * Yazar profili + haberler kalır (unlink). Haberler başka yazara devredilebilir.
 */
userRoutes.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const id = c.req.param("id");
    const actor = c.get("user");
    if (actor.id === id) {
      throw new HTTPException(403, {
        message: "Kendi hesabınızı silemezsiniz",
      });
    }

    const body = AdminUserDeleteSchema.parse(
      await c.req.json().catch(() => ({})),
    );
    const existing = await prisma.user.findUnique({
      where: { id },
      include: {
        authorProfile: {
          include: { _count: { select: { articles: true } } },
        },
      },
    });
    if (!existing) throw new HTTPException(404, { message: "Kullanıcı yok" });

    if (existing.role === "ADMIN" && existing.status === "aktif") {
      const others = await countActiveAdmins(id);
      if (others < 1) {
        throw new HTTPException(400, {
          message: "Son süper admin silinemez",
        });
      }
    }

    const articleCount = existing.authorProfile?._count.articles ?? 0;
    if (articleCount > 0 && !body.transferAuthorId) {
      // Yazar profili kalır, hesap kopar — haberler künyede kalır
    }

    if (body.transferAuthorId) {
      if (!existing.authorProfile) {
        throw new HTTPException(400, {
          message: "Devredilecek yazar profili yok",
        });
      }
      if (body.transferAuthorId === existing.authorProfile.id) {
        throw new HTTPException(400, {
          message: "Hedef yazar farklı olmalı",
        });
      }
      const target = await prisma.author.findUnique({
        where: { id: body.transferAuthorId },
      });
      if (!target) {
        throw new HTTPException(404, { message: "Hedef yazar bulunamadı" });
      }
      await prisma.article.updateMany({
        where: { authorId: existing.authorProfile.id },
        data: { authorId: body.transferAuthorId },
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.userSession.updateMany({
        where: { userId: id },
        data: { revokedAt: new Date() },
      });
      // Yazar profili oturumdan ayrılır; künye bozulmaz
      if (existing.authorProfile) {
        await tx.author.update({
          where: { id: existing.authorProfile.id },
          data: { userId: null },
        });
      }
      await tx.user.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "user.delete",
          entityType: "user",
          entityId: id,
          meta: JSON.stringify({
            email: existing.email,
            name: existing.name,
            role: existing.role,
            articleCount,
            transferAuthorId: body.transferAuthorId ?? null,
          }),
        },
      });
    });

    return c.json({ ok: true as const });
  },
);

/** Davet — e-posta + rol, 7 gün */
userRoutes.post(
  "/invites",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const actor = c.get("user");
    if (!hasCapability(actor.role, "manageUsers")) {
      throw new HTTPException(403, { message: "Yetkisiz" });
    }
    const body = UserInviteCreateSchema.parse(await c.req.json());
    const email = body.email.toLowerCase().trim();
    if (await prisma.user.findUnique({ where: { email } })) {
      throw new HTTPException(409, { message: "Bu e-posta zaten hesaplı" });
    }
    // Bekleyen davetleri kapat
    await prisma.userInvite.deleteMany({
      where: { email, acceptedAt: null },
    });

    const raw = newOpaqueToken();
    const expiresAt = new Date(Date.now() + INVITE_MS);
    const invite = await prisma.userInvite.create({
      data: {
        email,
        role: body.role,
        tokenHash: hashToken(raw),
        expiresAt,
        invitedById: actor.id,
      },
      include: { invitedBy: { select: { id: true, name: true } } },
    });

    const acceptUrl = acceptUrlForToken(raw);
    await sendInviteMail({
      to: email,
      roleLabel: PANEL_ROLE_LABELS[body.role] ?? body.role,
      acceptUrl,
      expiresAt,
    });
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "user.invite.create",
        entityType: "invite",
        entityId: invite.id,
        meta: JSON.stringify({ email, role: body.role }),
      },
    });

    console.info(`[invite] ${email} → ${acceptUrl}`);

    return c.json(
      {
        ...mapInvite(invite),
        acceptUrl,
      },
      201,
    );
  },
);

userRoutes.get(
  "/invites",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const rows = await prisma.userInvite.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { invitedBy: { select: { id: true, name: true } } },
    });
    return c.json(rows.map(mapInvite));
  },
);

/** Tekrar gönder — yeni token, 7 gün uzat */
userRoutes.post(
  "/invites/:id/resend",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const actor = c.get("user");
    const id = c.req.param("id");
    const invite = await prisma.userInvite.findUnique({
      where: { id },
      include: { invitedBy: { select: { id: true, name: true } } },
    });
    if (!invite) throw new HTTPException(404, { message: "Davet yok" });
    if (invite.acceptedAt) {
      throw new HTTPException(400, { message: "Davet zaten kabul edilmiş" });
    }
    if (await prisma.user.findUnique({ where: { email: invite.email } })) {
      throw new HTTPException(409, { message: "Bu e-posta zaten hesaplı" });
    }

    const raw = newOpaqueToken();
    const expiresAt = new Date(Date.now() + INVITE_MS);
    const updated = await prisma.userInvite.update({
      where: { id },
      data: {
        tokenHash: hashToken(raw),
        expiresAt,
      },
      include: { invitedBy: { select: { id: true, name: true } } },
    });
    const acceptUrl = acceptUrlForToken(raw);
    await sendInviteMail({
      to: invite.email,
      roleLabel: PANEL_ROLE_LABELS[invite.role] ?? invite.role,
      acceptUrl,
      expiresAt,
    });
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "user.invite.resend",
        entityType: "invite",
        entityId: id,
        meta: JSON.stringify({ email: invite.email }),
      },
    });
    console.info(`[invite resend] ${invite.email} → ${acceptUrl}`);
    return c.json({ ...mapInvite(updated), acceptUrl });
  },
);

userRoutes.delete(
  "/invites/:id",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const actor = c.get("user");
    const id = c.req.param("id");
    const invite = await prisma.userInvite.findUnique({ where: { id } });
    if (!invite) throw new HTTPException(404, { message: "Davet yok" });
    await prisma.userInvite.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "user.invite.cancel",
        entityType: "invite",
        entityId: id,
        meta: JSON.stringify({ email: invite.email, role: invite.role }),
      },
    });
    return c.json({ ok: true as const });
  },
);

/** Yazar profilleri (hesaplı/hesapsız) */
userRoutes.get(
  "/authors",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const rows = await prisma.author.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { articles: true } },
      },
      orderBy: [
        { isColumnist: "desc" },
        { columnistOrder: "asc" },
        { displayName: "asc" },
      ],
      take: 200,
    });
    return c.json(
      rows.map((a) => ({
        id: a.id,
        displayName: a.displayName,
        slug: a.slug,
        title: a.title,
        bio: a.bio,
        photoUrl: a.photoUrl,
        twitterUrl: a.twitterUrl,
        linkedinUrl: a.linkedinUrl,
        status: a.status as "yayinda" | "gizli",
        isColumnist: a.isColumnist,
        columnistOrder: a.columnistOrder,
        articleCount: a._count.articles,
        user: a.user,
        createdAt: a.createdAt.toISOString(),
      })),
    );
  },
);

userRoutes.post(
  "/authors",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const body = AuthorAdminCreateSchema.parse(await c.req.json());
    let slug = body.slug?.trim() || slugify(body.displayName);
    const clash = await prisma.author.findUnique({ where: { slug } });
    if (clash) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }
    if (body.userId) {
      const linked = await prisma.author.findUnique({
        where: { userId: body.userId },
      });
      if (linked) {
        throw new HTTPException(409, {
          message: "Bu hesabın zaten yazar profili var",
        });
      }
    }
    const created = await prisma.author.create({
      data: {
        displayName: body.displayName,
        slug,
        title: body.title ?? null,
        bio: body.bio ?? null,
        photoUrl: body.photoUrl || null,
        userId: body.userId || null,
        isColumnist: body.isColumnist ?? false,
        status: "yayinda",
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { articles: true } },
      },
    });
    return c.json(
      {
        id: created.id,
        displayName: created.displayName,
        slug: created.slug,
        title: created.title,
        bio: created.bio,
        photoUrl: created.photoUrl,
        twitterUrl: created.twitterUrl,
        linkedinUrl: created.linkedinUrl,
        status: created.status as "yayinda" | "gizli",
        isColumnist: created.isColumnist,
        columnistOrder: created.columnistOrder,
        articleCount: 0,
        user: created.user,
        createdAt: created.createdAt.toISOString(),
      },
      201,
    );
  },
);

userRoutes.patch(
  "/authors/:id",
  requireAuth,
  requireRole("ADMIN", "EDITOR"),
  async (c) => {
    const id = c.req.param("id");
    const body = AuthorAdminUpdateSchema.parse(await c.req.json());
    const existing = await prisma.author.findUnique({ where: { id } });
    if (!existing) throw new HTTPException(404, { message: "Yazar bulunamadı" });

    if (body.slug && body.slug !== existing.slug) {
      const clash = await prisma.author.findFirst({
        where: { slug: body.slug, NOT: { id } },
      });
      if (clash) throw new HTTPException(409, { message: "Slug kullanımda" });
    }

    const updated = await prisma.author.update({
      where: { id },
      data: {
        ...(body.displayName !== undefined
          ? { displayName: body.displayName }
          : {}),
        ...(body.slug !== undefined ? { slug: body.slug } : {}),
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.bio !== undefined ? { bio: body.bio } : {}),
        ...(body.photoUrl !== undefined
          ? { photoUrl: body.photoUrl || null }
          : {}),
        ...(body.twitterUrl !== undefined
          ? { twitterUrl: body.twitterUrl || null }
          : {}),
        ...(body.linkedinUrl !== undefined
          ? { linkedinUrl: body.linkedinUrl || null }
          : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.isColumnist !== undefined
          ? { isColumnist: body.isColumnist }
          : {}),
        ...(body.columnistOrder !== undefined
          ? { columnistOrder: body.columnistOrder }
          : {}),
        ...(body.userId !== undefined
          ? { userId: body.userId || null }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { articles: true } },
      },
    });
    return c.json({
      id: updated.id,
      displayName: updated.displayName,
      slug: updated.slug,
      title: updated.title,
      bio: updated.bio,
      photoUrl: updated.photoUrl,
      twitterUrl: updated.twitterUrl,
      linkedinUrl: updated.linkedinUrl,
      status: updated.status as "yayinda" | "gizli",
      isColumnist: updated.isColumnist,
      columnistOrder: updated.columnistOrder,
      articleCount: updated._count.articles,
      user: updated.user,
      createdAt: updated.createdAt.toISOString(),
    });
  },
);

/**
 * Yazar profili sil — haber varsa transferAuthorId zorunlu.
 * Bağlı panel hesabı silinmez (yalnızca profil kopar / profil gider).
 */
userRoutes.delete(
  "/authors/:id",
  requireAuth,
  requireRole("ADMIN"),
  async (c) => {
    const id = c.req.param("id");
    const actor = c.get("user");
    const body = AdminUserDeleteSchema.parse(
      await c.req.json().catch(() => ({})),
    );
    const existing = await prisma.author.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true } },
        _count: { select: { articles: true } },
      },
    });
    if (!existing) throw new HTTPException(404, { message: "Yazar bulunamadı" });

    const articleCount = existing._count.articles;
    if (articleCount > 0) {
      if (!body.transferAuthorId) {
        throw new HTTPException(400, {
          message: `${articleCount} haber var — önce başka yazara devredin veya transferAuthorId gönderin`,
        });
      }
      if (body.transferAuthorId === id) {
        throw new HTTPException(400, {
          message: "Hedef yazar farklı olmalı",
        });
      }
      const target = await prisma.author.findUnique({
        where: { id: body.transferAuthorId },
      });
      if (!target) {
        throw new HTTPException(404, { message: "Hedef yazar bulunamadı" });
      }
      await prisma.article.updateMany({
        where: { authorId: id },
        data: { authorId: body.transferAuthorId },
      });
    }

    await prisma.author.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "author.delete",
        entityType: "author",
        entityId: id,
        meta: JSON.stringify({
          displayName: existing.displayName,
          slug: existing.slug,
          articleCount,
          transferAuthorId: body.transferAuthorId ?? null,
          linkedUserId: existing.user?.id ?? null,
        }),
      },
    });
    return c.json({ ok: true as const });
  },
);
