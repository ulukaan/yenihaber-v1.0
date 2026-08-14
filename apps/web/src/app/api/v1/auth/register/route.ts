import { hash } from "bcryptjs";
import { prisma } from "@yenihaber/database";
import { RegisterSchema } from "@yenihaber/shared";
import {
  authErrorMessage,
  authJson,
  authOptions,
  issueMemberSession,
} from "@/lib/member-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS(req: Request) {
  return authOptions(req);
}

export async function POST(req: Request) {
  try {
    const body = RegisterSchema.parse(await req.json());
    const email = body.email.toLowerCase().trim();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return authJson(req, { message: "Bu e-posta zaten kayıtlı" }, 409);
    }

    const user = await prisma.user.create({
      data: {
        name: body.name.trim(),
        email,
        password: await hash(body.password, 10),
        role: "UYE",
        status: "aktif",
      },
    });

    const session = await issueMemberSession(user, req.headers.get("user-agent"));
    return authJson(req, session, 201);
  } catch (error) {
    console.error("register", error);
    const message = authErrorMessage(error);
    const status = /veritabanı|JWT_SECRET/i.test(message) ? 503 : 400;
    return authJson(req, { message }, status);
  }
}
