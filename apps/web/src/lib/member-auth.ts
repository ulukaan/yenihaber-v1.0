import { createHash, randomBytes } from "node:crypto";
import { SignJWT } from "jose";
import { prisma } from "@yenihaber/database";
import { ensureJwtSecret } from "@yenihaber/config";
import { requiresTwoFactor, slugify, type ApiUser, type Role } from "@yenihaber/shared";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

async function ensureAuthorForUser(user: {
  id: string;
  name: string;
}): Promise<string> {
  const existing = await prisma.author.findUnique({
    where: { userId: user.id },
  });
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

/** Üye oturumu — Hono olmadan Next /api/v1/auth */
export async function issueMemberSession(
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    twofaEnabled: boolean;
  },
  userAgent?: string | null,
) {
  ensureJwtSecret();
  const placeholder = randomBytes(32).toString("base64url");
  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(placeholder),
      userAgent: userAgent ?? null,
    },
  });
  const authorId = await ensureAuthorForUser(user);
  const apiUser = toApiUser(user, authorId);
  const jwt = await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    sid: session.id,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));

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

export function authCorsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

export function authJson(req: Request, body: unknown, status = 200) {
  return Response.json(body, { status, headers: authCorsHeaders(req) });
}

export function authOptions(req: Request) {
  return new Response(null, { status: 204, headers: authCorsHeaders(req) });
}

export function authErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "issues" in error) {
    const issues = (error as { issues: Array<{ message: string }> }).issues;
    return issues[0]?.message ?? "Geçersiz form";
  }
  if (error instanceof Error) {
    const msg = error.message;
    if (/DATABASE_URL|P1001|P1017|Can't reach|ECONNREFUSED/i.test(msg)) {
      return "Veritabanına bağlanılamadı. Hostinger DATABASE_URL değerini kontrol edin.";
    }
    if (/JWT_SECRET/i.test(msg)) {
      return "JWT_SECRET tanımlı değil.";
    }
    return msg;
  }
  return "İşlem başarısız";
}
