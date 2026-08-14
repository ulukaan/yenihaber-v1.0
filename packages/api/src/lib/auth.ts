import { SignJWT, jwtVerify } from "jose";
import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { prisma } from "@yenihaber/database";
import type { ApiUser, Role } from "@yenihaber/shared";
import { requiresTwoFactor } from "@yenihaber/shared";
import { hashToken } from "./authors-util";

export type AuthVariables = {
  user: ApiUser;
  sessionId?: string;
};

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET tanımlı değil");
  return new TextEncoder().encode(secret);
}

export async function signToken(
  user: ApiUser,
  sessionId: string,
): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    sid: sessionId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifyToken(
  token: string,
): Promise<ApiUser & { sessionId: string }> {
  const { payload } = await jwtVerify(token, secretKey());
  const sessionId = String(payload.sid ?? "");
  return {
    id: String(payload.sub),
    email: String(payload.email),
    name: String(payload.name),
    role: payload.role as Role,
    sessionId,
  };
}

export async function optionalAuth(
  c: Context<{ Variables: AuthVariables }>,
): Promise<ApiUser | null> {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const user = await verifyToken(header.slice(7));
    if (user.sessionId) {
      const session = await prisma.userSession.findUnique({
        where: { id: user.sessionId },
      });
      if (!session || session.revokedAt || session.userId !== user.id) {
        return null;
      }
    }
    const db = await prisma.user.findUnique({ where: { id: user.id } });
    if (!db || db.status === "askida") return null;
    return {
      id: db.id,
      name: db.name,
      email: db.email,
      role: db.role as Role,
      status: db.status as ApiUser["status"],
      twofaEnabled: db.twofaEnabled,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(
  c: Context<{ Variables: AuthVariables }>,
  next: Next,
) {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Oturum gerekli" });
  }
  const raw = header.slice(7);
  try {
    const verified = await verifyToken(raw);
    if (verified.sessionId) {
      const session = await prisma.userSession.findUnique({
        where: { id: verified.sessionId },
      });
      if (
        !session ||
        session.revokedAt ||
        session.userId !== verified.id ||
        session.tokenHash !== hashToken(raw)
      ) {
        throw new HTTPException(401, { message: "Oturum sonlandırılmış" });
      }
      await prisma.userSession.update({
        where: { id: session.id },
        data: { lastSeenAt: new Date() },
      });
      c.set("sessionId", session.id);
    }
    const db = await prisma.user.findUnique({ where: { id: verified.id } });
    if (!db) throw new HTTPException(401, { message: "Kullanıcı yok" });
    if (db.status === "askida") {
      throw new HTTPException(403, { message: "Hesap askıda" });
    }
    const author = await prisma.author.findUnique({
      where: { userId: db.id },
      select: { id: true },
    });
    c.set("user", {
      id: db.id,
      name: db.name,
      email: db.email,
      role: db.role as Role,
      status: db.status as ApiUser["status"],
      twofaEnabled: db.twofaEnabled,
      authorId: author?.id ?? null,
      requires2faSetup: requiresTwoFactor(db.role as Role) && !db.twofaEnabled,
    });
    await next();
  } catch (e) {
    if (e instanceof HTTPException) throw e;
    throw new HTTPException(401, { message: "Geçersiz veya süresi dolmuş token" });
  }
}

export function requireRole(...roles: Role[]) {
  return async (
    c: Context<{ Variables: AuthVariables }>,
    next: Next,
  ) => {
    const user = c.get("user");
    if (!roles.includes(user.role)) {
      throw new HTTPException(403, { message: "Yetkisiz işlem" });
    }
    await next();
  };
}
