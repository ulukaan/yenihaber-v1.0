import { hash } from "bcryptjs";
import { prisma } from "@yenihaber/database";
import { resolveAdminOrigin, resolveSiteOrigin } from "@yenihaber/config";
import { sendPasswordResetMail } from "./mail.js";
import { hashToken, newOpaqueToken } from "./authors-util.js";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 saat

function adminBase() {
  return resolveAdminOrigin();
}

function siteBase() {
  return resolveSiteOrigin();
}

/**
 * Token oluştur + mail. Aynı cevap — e-posta yoksa da sessiz.
 * Staff → admin panel linki, üye → site linki.
 */
export async function issuePasswordReset(opts: {
  userId: string;
  email: string;
  name: string;
  role: string;
  actorId?: string | null;
  reason?: "user_forgot" | "admin_send";
}): Promise<{ ok: true }> {
  const raw = newOpaqueToken();
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await prisma.passwordResetToken.updateMany({
    where: { userId: opts.userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: opts.userId,
      tokenHash: hashToken(raw),
      expiresAt,
    },
  });

  const isStaff = opts.role !== "UYE";
  const admin = adminBase();
  const site = siteBase();
  const resetUrl =
    isStaff && admin
      ? `${admin}/login?reset=${encodeURIComponent(raw)}`
      : site
        ? `${site}/sifre-sifirla?token=${encodeURIComponent(raw)}`
        : "";
  if (!resetUrl) {
    console.warn("[password-reset] PUBLIC_SITE_URL / ADMIN_PUBLIC_URL yok");
    return { ok: true as const };
  }

  await sendPasswordResetMail({
    to: opts.email,
    name: opts.name,
    resetUrl,
    expiresMinutes: 60,
  });

  await prisma.auditLog.create({
    data: {
      actorId: opts.actorId ?? null,
      action:
        opts.reason === "admin_send"
          ? "user.password_reset_send"
          : "user.password_forgot",
      entityType: "user",
      entityId: opts.userId,
      meta: JSON.stringify({ email: opts.email }),
    },
  });

  return { ok: true as const };
}

export async function consumePasswordReset(opts: {
  token: string;
  password: string;
}): Promise<{ userId: string }> {
  const tokenHash = hashToken(opts.token);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    throw new Error("Geçersiz veya süresi dolmuş bağlantı");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { password: await hash(opts.password, 10) },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
    prisma.userSession.updateMany({
      where: { userId: row.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        actorId: row.userId,
        action: "user.password_reset",
        entityType: "user",
        entityId: row.userId,
      },
    }),
  ]);

  return { userId: row.userId };
}
