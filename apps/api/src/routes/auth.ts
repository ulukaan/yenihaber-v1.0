import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { compare, hash } from "bcryptjs";
import { prisma } from "@yenihaber/database";
import {
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResetPasswordSchema,
  UserInviteAcceptSchema,
  requiresTwoFactor,
  type ApiUser,
  type Role,
} from "@yenihaber/shared";
import {
  requireAuth,
  signToken,
  type AuthVariables,
} from "../lib/auth.js";
import {
  ensureAuthorForUser,
  generateTotpSecret,
  hashToken,
  newOpaqueToken,
  totpUri,
  verifyTotp,
} from "../lib/authors-util.js";
import {
  consumePasswordReset,
  issuePasswordReset,
} from "../lib/password-reset.js";

export const authRoutes = new Hono<{ Variables: AuthVariables }>();

function toApiUser(
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status?: string;
    twofaEnabled?: boolean;
  },
  authorId?: string | null,
): ApiUser {
  const role = user.role as Role;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role,
    status: (user.status as ApiUser["status"]) ?? "aktif",
    twofaEnabled: Boolean(user.twofaEnabled),
    authorId: authorId ?? null,
    requires2faSetup: requiresTwoFactor(role) && !user.twofaEnabled,
  };
}

async function issueSession(
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    twofaEnabled: boolean;
  },
  meta: { userAgent?: string | null },
) {
  const rawTokenPlaceholder = newOpaqueToken();
  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawTokenPlaceholder),
      userAgent: meta.userAgent ?? null,
    },
  });
  const authorId = await ensureAuthorForUser(user);
  const apiUser = toApiUser(user, authorId);
  const jwt = await signToken(apiUser, session.id);
  await prisma.userSession.update({
    where: { id: session.id },
    data: { tokenHash: hashToken(jwt) },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  return { token: jwt, user: apiUser, sessionId: session.id };
}

authRoutes.post("/login", async (c) => {
  const body = LoginSchema.parse(await c.req.json());
  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user || !(await compare(body.password, user.password))) {
    throw new HTTPException(401, { message: "E-posta veya şifre hatalı" });
  }
  if (user.status === "askida") {
    throw new HTTPException(403, {
      message: "Hesap pasif — yöneticinize başvurun",
    });
  }

  const totp = (body as { totp?: string }).totp;
  if (user.twofaEnabled && user.twofaSecret) {
    if (!totp || !verifyTotp(user.twofaSecret, totp)) {
      throw new HTTPException(401, {
        message: "2FA kodu gerekli veya hatalı",
      });
    }
  }

  const result = await issueSession(user, {
    userAgent: c.req.header("user-agent"),
  });
  return c.json(result);
});

authRoutes.post("/register", async (c) => {
  const body = RegisterSchema.parse(await c.req.json());
  const exists = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
  });
  if (exists) {
    throw new HTTPException(409, { message: "Bu e-posta zaten kayıtlı" });
  }

  const user = await prisma.user.create({
    data: {
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      password: await hash(body.password, 10),
      role: "UYE",
      status: "aktif",
    },
  });

  return c.json(
    await issueSession(user, { userAgent: c.req.header("user-agent") }),
    201,
  );
});

/** Kullanıcı unuttu — her zaman aynı mesaj (e-posta sızıntısı yok) */
authRoutes.post("/forgot-password", async (c) => {
  const body = ForgotPasswordSchema.parse(await c.req.json());
  const email = body.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.status === "aktif") {
    await issuePasswordReset({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      reason: "user_forgot",
    });
  }
  return c.json({
    ok: true as const,
    message:
      "E-posta adresiniz sistemde kayıtlıysa şifre sıfırlama bağlantısı gönderildi.",
  });
});

authRoutes.post("/reset-password", async (c) => {
  const body = ResetPasswordSchema.parse(await c.req.json());
  try {
    await consumePasswordReset({
      token: body.token,
      password: body.password,
    });
  } catch (e) {
    throw new HTTPException(400, {
      message:
        e instanceof Error ? e.message : "Geçersiz veya süresi dolmuş bağlantı",
    });
  }
  return c.json({
    ok: true as const,
    message: "Şifreniz güncellendi. Giriş yapabilirsiniz.",
  });
});

/** Davet kabul */
authRoutes.post("/accept-invite", async (c) => {
  const body = UserInviteAcceptSchema.parse(await c.req.json());
  const tokenHash = hashToken(body.token);
  const invite = await prisma.userInvite.findUnique({ where: { tokenHash } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    throw new HTTPException(400, {
      message: "Davet geçersiz veya süresi dolmuş",
    });
  }
  const email = invite.email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email } })) {
    throw new HTTPException(409, { message: "Bu e-posta zaten kayıtlı" });
  }
  const user = await prisma.user.create({
    data: {
      name: body.name.trim(),
      email,
      password: await hash(body.password, 10),
      role: invite.role,
      status: "aktif",
    },
  });
  await ensureAuthorForUser(user);
  await prisma.userInvite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "user.invite.accept",
      entityType: "user",
      entityId: user.id,
      meta: JSON.stringify({ email, role: invite.role }),
    },
  });
  return c.json(
    await issueSession(user, { userAgent: c.req.header("user-agent") }),
    201,
  );
});

authRoutes.get("/me", requireAuth, async (c) => {
  return c.json(c.get("user"));
});

authRoutes.get("/sessions", requireAuth, async (c) => {
  const user = c.get("user");
  const currentId = c.get("sessionId");
  const rows = await prisma.userSession.findMany({
    where: { userId: user.id, revokedAt: null },
    orderBy: { lastSeenAt: "desc" },
    take: 30,
  });
  return c.json({
    data: rows.map((r) => ({
      id: r.id,
      userAgent: r.userAgent,
      createdAt: r.createdAt.toISOString(),
      lastSeenAt: r.lastSeenAt.toISOString(),
      current: r.id === currentId,
    })),
  });
});

authRoutes.post("/logout-all", requireAuth, async (c) => {
  const user = c.get("user");
  await prisma.userSession.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "user.logout_all",
      entityType: "user",
      entityId: user.id,
    },
  });
  return c.json({ ok: true as const });
});

authRoutes.post("/sessions/:id/revoke", requireAuth, async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const row = await prisma.userSession.findUnique({ where: { id } });
  if (!row || row.userId !== user.id) {
    throw new HTTPException(404, { message: "Oturum bulunamadı" });
  }
  await prisma.userSession.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
  return c.json({ ok: true as const });
});

authRoutes.post("/2fa/setup", requireAuth, async (c) => {
  const user = c.get("user");
  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: user.id },
    data: { twofaSecret: secret, twofaEnabled: false },
  });
  return c.json({
    secret,
    otpauthUrl: totpUri(user.email, secret),
  });
});

authRoutes.post("/2fa/enable", requireAuth, async (c) => {
  const user = c.get("user");
  const body = (await c.req.json()) as { code?: string };
  const db = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!db.twofaSecret || !body.code || !verifyTotp(db.twofaSecret, body.code)) {
    throw new HTTPException(400, { message: "Geçersiz 2FA kodu" });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { twofaEnabled: true },
  });
  return c.json({ ok: true as const, twofaEnabled: true });
});
