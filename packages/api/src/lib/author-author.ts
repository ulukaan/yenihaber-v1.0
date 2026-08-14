import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@yenihaber/database";
import { slugify } from "@yenihaber/shared";

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function newOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Muhabir kapsamı: bağlı yazar profilinin id'si */
export async function authorIdForUser(userId: string): Promise<string | null> {
  const row = await prisma.author.findUnique({
    where: { userId },
    select: { id: true },
  });
  return row?.id ?? null;
}

/** Habere imza yazan Author — yoksa oluştur */
export async function ensureAuthorForUser(user: {
  id: string;
  name: string;
}): Promise<string> {
  const existing = await prisma.author.findUnique({ where: { userId: user.id } });
  if (existing) return existing.id;

  let slug = slugify(user.name) || `yazar-${user.id.slice(0, 6)}`;
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const clash = await prisma.author.findUnique({ where: { slug: candidate } });
    if (!clash) {
      slug = candidate;
      break;
    }
    n += 1;
  }

  const created = await prisma.author.create({
    data: {
      userId: user.id,
      displayName: user.name,
      slug,
      status: "yayinda",
    },
  });
  return created.id;
}

export function generateTotpSecret(): string {
  return randomBytes(20).toString("base64url").slice(0, 32);
}

function hotp(secret: Buffer, counter: bigint): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(counter);
  const hmac = createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1]! & 0xf;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

function secretToBuffer(secret: string): Buffer {
  return Buffer.from(secret, "utf8");
}

export function verifyTotp(secret: string, token: string, window = 1): boolean {
  const clean = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  const sec = secretToBuffer(secret);
  const now = Math.floor(Date.now() / 1000 / 30);
  for (let w = -window; w <= window; w += 1) {
    const expected = hotp(sec, BigInt(now + w));
    try {
      if (
        timingSafeEqual(Buffer.from(expected), Buffer.from(clean.padStart(6, "0")))
      ) {
        return true;
      }
    } catch {
      /* length mismatch */
    }
  }
  return false;
}

export function totpUri(email: string, secret: string): string {
  const issuer = encodeURIComponent("Duzce Radikal");
  const label = encodeURIComponent(email);
  return `otpauth://totp/${issuer}:${label}?secret=${encodeURIComponent(secret)}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}
