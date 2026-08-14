import { API_BASE } from "@/lib/public-env";
import { NextResponse } from "next/server";

const API =
  API_BASE;

/**
 * Footer bülten formu — KVKK rızası + API double opt-in.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const consent = form.get("consent");

  const origin = new URL(request.url).origin;

  if (!email || !consent) {
    return NextResponse.redirect(
      `${origin}/?bulten=kvkk#bulten`,
      303,
    );
  }

  try {
    const res = await fetch(`${API}/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, consent: "true" }),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.redirect(`${origin}/?bulten=hata#bulten`, 303);
    }

    const data = (await res.json()) as { status?: string };
    if (data.status === "already_active") {
      return NextResponse.redirect(`${origin}/?bulten=zaten#bulten`, 303);
    }
    return NextResponse.redirect(`${origin}/?bulten=onay#bulten`, 303);
  } catch {
    return NextResponse.redirect(`${origin}/?bulten=hata#bulten`, 303);
  }
}
