import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "@yenihaber/database";

export const newsletterRoutes = new Hono();

const SubscribeSchema = z.object({
  email: z.string().email("Geçerli e-posta girin").max(120),
  consent: z.union([z.literal("on"), z.literal("true"), z.literal("1")]),
});

function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

function siteOrigin(): string {
  return (
    process.env.PUBLIC_SITE_URL ||
    process.env.CORS_ORIGIN?.split(",")[0]?.trim() ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/**
 * Bülten kaydı — açık rıza + double opt-in.
 * POST body: form-urlencoded veya JSON { email, consent }
 */
newsletterRoutes.post("/subscribe", async (c) => {
  const contentType = c.req.header("content-type") ?? "";
  let raw: Record<string, unknown> = {};

  if (contentType.includes("application/json")) {
    raw = (await c.req.json()) as Record<string, unknown>;
  } else {
    const form = await c.req.parseBody();
    raw = {
      email: form.email,
      consent: form.consent ?? form.kvkk,
    };
  }

  const parsed = SubscribeSchema.safeParse({
    email: String(raw.email ?? "")
      .trim()
      .toLowerCase(),
    consent: raw.consent,
  });

  if (!parsed.success) {
    throw new HTTPException(400, {
      message: parsed.error.issues[0]?.message ?? "Geçersiz istek",
    });
  }

  const { email } = parsed.data;
  const token = randomBytes(24).toString("hex");
  const ip =
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
    c.req.header("x-real-ip") ||
    undefined;

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  });

  if (existing?.status === "AKTIF") {
    return c.json({
      ok: true,
      status: "already_active",
      message: "Bu e-posta zaten listede.",
    });
  }

  if (existing) {
    await prisma.newsletterSubscriber.update({
      where: { email },
      data: {
        status: "BEKLEMEDE",
        token,
        consentAt: new Date(),
        confirmedAt: null,
        ipHash: hashIp(ip),
      },
    });
  } else {
    await prisma.newsletterSubscriber.create({
      data: {
        email,
        status: "BEKLEMEDE",
        token,
        consentAt: new Date(),
        ipHash: hashIp(ip),
      },
    });
  }

  const confirmUrl = `${siteOrigin()}/bulten/onay?token=${token}`;
  // SMTP yoksa sunucu loguna düşer — prod'da e-posta servisine bağlanır
  console.info(`[bülten] Çift onay linki → ${email}: ${confirmUrl}`);

  return c.json({
    ok: true,
    status: "pending",
    message:
      "Kayıt alındı. Aboneliği tamamlamak için e-postanızdaki onay linkine tıklayın.",
    // Sadece geliştirme ortamında
    ...(process.env.NODE_ENV !== "production"
      ? { debugConfirmUrl: confirmUrl }
      : {}),
  });
});

/** E-posta içindeki onay linki */
newsletterRoutes.get("/confirm", async (c) => {
  const token = c.req.query("token")?.trim();
  if (!token || token.length < 20) {
    throw new HTTPException(400, { message: "Geçersiz onay bağlantısı" });
  }

  const row = await prisma.newsletterSubscriber.findUnique({
    where: { token },
  });
  if (!row) {
    throw new HTTPException(404, { message: "Onay kaydı bulunamadı" });
  }
  if (row.status === "AKTIF") {
    return c.json({ ok: true, status: "already_active" });
  }

  await prisma.newsletterSubscriber.update({
    where: { id: row.id },
    data: {
      status: "AKTIF",
      confirmedAt: new Date(),
      token: randomBytes(24).toString("hex"), // tek kullanımlık
    },
  });

  return c.json({ ok: true, status: "confirmed" });
});
