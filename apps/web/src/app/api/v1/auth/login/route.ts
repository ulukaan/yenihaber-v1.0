import { compare } from "bcryptjs";
import { prisma } from "@yenihaber/database";
import { LoginSchema } from "@yenihaber/shared";
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
    const body = LoginSchema.parse(await req.json());
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase().trim() },
    });
    if (!user || !(await compare(body.password, user.password))) {
      return authJson(req, { message: "E-posta veya şifre hatalı" }, 401);
    }
    if (user.status === "askida") {
      return authJson(
        req,
        { message: "Hesap pasif — yöneticinize başvurun" },
        403,
      );
    }

    const session = await issueMemberSession(user, req.headers.get("user-agent"));
    return authJson(req, session);
  } catch (error) {
    console.error("login", error);
    const message = authErrorMessage(error);
    const status = /veritabanı|JWT_SECRET/i.test(message) ? 503 : 400;
    return authJson(req, { message }, status);
  }
}
